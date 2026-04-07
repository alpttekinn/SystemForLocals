import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireTenantId, getTenantContact, getTenantFeatures, getBusinessHours } from '@/lib/data/tenant'
import {
  getWhatsAppSettings,
  createWhatsAppConversation,
  createWhatsAppMessage,
  updateConversationStatus,
  incrementMessageCount,
} from '@/lib/data/whatsapp'
import { generateFirstResponse, isAiError } from '@/lib/whatsapp/ai-response'
import { getMenuCategories } from '@/lib/data/menu'
import { getActiveCampaigns } from '@/lib/data/campaigns'
import { DAYS_OF_WEEK } from '@/lib/constants'

const schema = z.object({
  message: z.string().min(1).max(2000),
  conversation_id: z.string().uuid().optional(),
  customer_name: z.string().max(100).optional(),
})

/**
 * POST /api/whatsapp/chat
 *
 * In-site chat endpoint. Called from the ChatWidget on the public site.
 * Does NOT require Twilio — processes messages directly via AI and returns reply.
 *
 * Tenant resolved from x-tenant-slug header (set by middleware).
 */
export async function POST(request: NextRequest) {
  const slug = request.headers.get('x-tenant-slug')
  if (!slug) {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 400 })
  }

  let tenantId: string
  try {
    tenantId = await requireTenantId(slug)
  } catch {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 404 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Doğrulama hatası' }, { status: 422 })
  }

  const { message, conversation_id, customer_name } = parsed.data

  const settings = await getWhatsAppSettings(tenantId)
  if (!settings || !settings.enabled) {
    return NextResponse.json({ error: 'WhatsApp aktif değil' }, { status: 403 })
  }

  // Create or reuse conversation
  let convId = conversation_id
  if (!convId) {
    const conv = await createWhatsAppConversation(tenantId, {
      customer_name: customer_name || undefined,
      source: 'website_chat',
    })
    if (!conv) return NextResponse.json({ error: 'Konuşma oluşturulamadı' }, { status: 500 })
    convId = conv.id
  }

  // Log inbound message
  await createWhatsAppMessage(tenantId, {
    conversation_id: convId,
    direction: 'inbound',
    sender_type: 'customer',
    content: message,
  })
  await incrementMessageCount(convId)

  // Generate AI reply
  let replyText = settings.ai_fallback_text || 'Kısa süre içinde size dönüş yapılacaktır.'
  let escalated = false

  if (settings.ai_enabled) {
    const supabase = createAdminClient()
    const [contact, features, hours, categories, campaigns, tenantRow] = await Promise.all([
      getTenantContact(tenantId),
      getTenantFeatures(tenantId),
      getBusinessHours(tenantId),
      getMenuCategories(tenantId),
      getActiveCampaigns(tenantId),
      supabase.from('tenants').select('name').eq('id', tenantId).single(),
    ])

    const tenantContext = {
      tenantName: tenantRow.data?.name || 'İşletme',
      phone: contact?.phone,
      address: contact?.address,
      city: contact?.city,
      email: contact?.email,
      businessHours: hours?.map(h => ({
        day: DAYS_OF_WEEK[h.day_of_week]?.label || `Gün ${h.day_of_week}`,
        open: h.open_time,
        close: h.close_time,
        isOpen: h.is_open,
      })),
      menuCategories: categories?.map(c => c.name),
      activeCampaigns: campaigns?.map(c => ({ title: c.title, description: c.description })),
      reservationEnabled: features?.reservations_enabled,
      eventsEnabled: features?.events_enabled,
    }

    const result = await generateFirstResponse(message, settings, tenantContext)
    replyText = result.content
    escalated = isAiError(result) ? false : result.escalated

    await createWhatsAppMessage(tenantId, {
      conversation_id: convId,
      direction: 'outbound',
      sender_type: 'ai',
      content: replyText,
      ai_model: isAiError(result) ? undefined : result.model,
      ai_confidence: isAiError(result) ? undefined : result.confidence,
      ai_escalated: escalated,
    })
    await incrementMessageCount(convId)

    await updateConversationStatus(tenantId, convId, escalated ? 'awaiting_human' : 'ai_replied', {
      last_message_preview: replyText.slice(0, 200),
      ai_used: true,
    })
  } else {
    await updateConversationStatus(tenantId, convId, 'awaiting_human', {
      last_message_preview: message.slice(0, 200),
    })
    escalated = true
  }

  return NextResponse.json({
    reply: replyText,
    conversation_id: convId,
    escalated,
    // If escalated, client can show WhatsApp direct link
    whatsapp_number: escalated ? settings.phone_number : null,
  })
}
