import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWhatsAppSettings } from '@/lib/data/whatsapp'
import {
  createWhatsAppConversation,
  createWhatsAppMessage,
  updateConversationStatus,
  incrementMessageCount,
} from '@/lib/data/whatsapp'
import { generateFirstResponse, isAiError } from '@/lib/whatsapp/ai-response'
import {
  getTenantContact,
  getTenantFeatures,
  getBusinessHours,
} from '@/lib/data/tenant'
import { getMenuCategories } from '@/lib/data/menu'
import { getActiveCampaigns } from '@/lib/data/campaigns'
import { DAYS_OF_WEEK } from '@/lib/constants'
import { z } from 'zod'

const inboundSchema = z.object({
  tenant_id: z.string().uuid(),
  customer_phone: z.string().min(1).max(30).optional(),
  customer_name: z.string().max(100).optional(),
  message: z.string().min(1).max(5000),
  source: z.string().max(50).optional(),
  provider_message_id: z.string().max(200).optional(),
  conversation_id: z.string().uuid().optional(), // if continuing existing conversation
})

/**
 * POST /api/whatsapp/inbound — receive an inbound WhatsApp message.
 *
 * This endpoint:
 * 1. Creates or continues a conversation
 * 2. Logs the inbound message
 * 3. If AI is enabled, generates a first response
 * 4. Returns the AI response (for the provider to send back)
 *
 * In Phase 1, this is called by the webhook adapter or manually.
 * A real WhatsApp Business API provider (e.g., Twilio, 360dialog, Meta Cloud API)
 * would hit this endpoint via a thin adapter that maps their payload format.
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = inboundSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const { tenant_id, customer_phone, customer_name, message, source, provider_message_id, conversation_id } = parsed.data

  // Verify tenant exists and WhatsApp is enabled
  const settings = await getWhatsAppSettings(tenant_id)
  if (!settings || !settings.enabled) {
    return NextResponse.json({ error: 'WhatsApp is not enabled for this tenant' }, { status: 403 })
  }

  // Create or get conversation
  let convId = conversation_id
  if (!convId) {
    const conv = await createWhatsAppConversation(tenant_id, {
      customer_phone,
      customer_name,
      source: source || 'webhook',
    })
    if (!conv) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }
    convId = conv.id
  }

  // Log inbound message
  await createWhatsAppMessage(tenant_id, {
    conversation_id: convId,
    direction: 'inbound',
    sender_type: 'customer',
    content: message,
    provider_message_id,
  })
  await incrementMessageCount(convId)

  // If AI auto-reply is enabled, generate response
  let aiReply: { content: string; model?: string; confidence?: number; escalated?: boolean } | null = null

  if (settings.ai_enabled) {
    // Build tenant context for AI
    const [contact, features, hours, categories, campaigns] = await Promise.all([
      getTenantContact(tenant_id),
      getTenantFeatures(tenant_id),
      getBusinessHours(tenant_id),
      getMenuCategories(tenant_id),
      getActiveCampaigns(tenant_id),
    ])

    const supabase = createAdminClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenant_id)
      .single()

    const tenantContext = {
      tenantName: tenant?.name || 'İşletme',
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

    if (isAiError(result)) {
      // Fallback used — still log and send fallback
      aiReply = { content: result.content }
    } else {
      aiReply = {
        content: result.content,
        model: result.model,
        confidence: result.confidence,
        escalated: result.escalated,
      }
    }

    // Log AI outbound message
    await createWhatsAppMessage(tenant_id, {
      conversation_id: convId,
      direction: 'outbound',
      sender_type: 'ai',
      content: aiReply.content,
      ai_model: aiReply.model,
      ai_confidence: aiReply.confidence,
      ai_escalated: aiReply.escalated,
    })
    await incrementMessageCount(convId)

    // Update conversation status
    const newStatus = aiReply.escalated ? 'awaiting_human' : 'ai_replied'
    await updateConversationStatus(tenant_id, convId, newStatus, {
      last_message_preview: aiReply.content.slice(0, 200),
      ai_used: true,
    })
  } else {
    // No AI — mark as awaiting human
    await updateConversationStatus(tenant_id, convId, 'awaiting_human', {
      last_message_preview: message.slice(0, 200),
    })
  }

  return NextResponse.json({
    conversation_id: convId,
    ai_reply: aiReply,
  })
}
