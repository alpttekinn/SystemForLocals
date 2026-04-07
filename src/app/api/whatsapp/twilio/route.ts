import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getTenantBySlug } from '@/lib/data/tenant'
import {
  getWhatsAppSettings,
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
import { createAdminClient } from '@/lib/supabase/admin'
import { DAYS_OF_WEEK } from '@/lib/constants'

/**
 * Validate Twilio webhook signature.
 * See: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string,
): boolean {
  // Build canonical string: URL + alphabetically sorted param key-value pairs
  const sortedKeys = Object.keys(params).sort()
  const canonical = url + sortedKeys.map(k => k + params[k]).join('')
  const expected = createHmac('sha1', authToken).update(canonical).digest('base64')
  return expected === signature
}

/**
 * POST /api/whatsapp/twilio
 *
 * Twilio webhook adapter. Twilio sends form-encoded POST with:
 *   - From: "whatsapp:+905394380128"
 *   - To:   "whatsapp:+14155238886"
 *   - Body: message text
 *   - MessageSid, AccountSid, ProfileName, ...
 *
 * Flow:
 *   1. Validate Twilio signature
 *   2. Resolve tenant (default tenant for now)
 *   3. Extract conversation (match by customer phone)
 *   4. Run AI response logic
 *   5. Return TwiML so Twilio sends the reply
 */
export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const accountSid = process.env.TWILIO_ACCOUNT_SID

  // Parse form body
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const params: Record<string, string> = {}
  formData.forEach((value, key) => {
    params[key] = String(value)
  })

  // Validate Twilio signature (skip if auth token not configured — dev/sandbox only)
  if (authToken) {
    const signature = request.headers.get('x-twilio-signature') || ''
    // Use the actual request URL for signature validation (Twilio signs the exact URL it POSTs to)
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || ''
    const url = `${proto}://${host}/api/whatsapp/twilio`
    if (!validateTwilioSignature(authToken, url, params, signature)) {
      return new Response('Forbidden', { status: 403 })
    }
  }

  // Validate sender is from expected account
  if (accountSid && params.AccountSid !== accountSid) {
    return new Response('Forbidden', { status: 403 })
  }

  const fromRaw = params.From || '' // "whatsapp:+905394380128"
  const bodyText = params.Body || ''
  const messageSid = params.MessageSid || undefined
  const profileName = params.ProfileName || undefined

  const customerPhone = fromRaw.replace(/^whatsapp:/, '')

  if (!bodyText || !customerPhone) {
    return twimlResponse('') // empty reply, nothing to process
  }

  // Resolve tenant: look up by Twilio number, fall back to default slug
  const defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'demo'
  const tenant = await getTenantBySlug(defaultSlug)
  if (!tenant) {
    return twimlResponse('Üzgünüz, şu an hizmet veremiyoruz.')
  }

  const tenantId = tenant.id

  const settings = await getWhatsAppSettings(tenantId)
  if (!settings || !settings.enabled) {
    return twimlResponse('')
  }

  // Find existing open conversation for this customer phone
  const supabase = createAdminClient()
  const { data: existingConv } = await supabase
    .from('whatsapp_conversations')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('customer_phone', customerPhone)
    .not('status', 'eq', 'closed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let convId: string
  if (existingConv) {
    convId = existingConv.id
  } else {
    const conv = await createWhatsAppConversation(tenantId, {
      customer_phone: customerPhone,
      customer_name: profileName,
      source: 'twilio_webhook',
    })
    if (!conv) return twimlResponse(settings.ai_fallback_text || 'Tekrar deneyin.')
    convId = conv.id
  }

  // Log inbound message
  await createWhatsAppMessage(tenantId, {
    conversation_id: convId,
    direction: 'inbound',
    sender_type: 'customer',
    content: bodyText,
    provider_message_id: messageSid,
  })
  await incrementMessageCount(convId)

  // Generate AI reply
  let replyText = settings.ai_fallback_text || 'Kısa süre içinde size dönüş yapılacaktır.'

  if (settings.ai_enabled) {
    const [contact, features, hours, categories, campaigns] = await Promise.all([
      getTenantContact(tenantId),
      getTenantFeatures(tenantId),
      getBusinessHours(tenantId),
      getMenuCategories(tenantId),
      getActiveCampaigns(tenantId),
    ])

    const tenantContext = {
      tenantName: tenant.name,
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

    const result = await generateFirstResponse(bodyText, settings, tenantContext)
    const aiReply = {
      content: result.content,
      escalated: isAiError(result) ? false : result.escalated,
      model: isAiError(result) ? undefined : result.model,
      confidence: isAiError(result) ? undefined : result.confidence,
    }

    replyText = aiReply.content

    await createWhatsAppMessage(tenantId, {
      conversation_id: convId,
      direction: 'outbound',
      sender_type: 'ai',
      content: aiReply.content,
      ai_model: aiReply.model,
      ai_confidence: aiReply.confidence,
      ai_escalated: aiReply.escalated,
    })
    await incrementMessageCount(convId)

    const newStatus = aiReply.escalated ? 'awaiting_human' : 'ai_replied'
    await updateConversationStatus(tenantId, convId, newStatus, {
      last_message_preview: aiReply.content.slice(0, 200),
      ai_used: true,
    })
  } else {
    await updateConversationStatus(tenantId, convId, 'awaiting_human', {
      last_message_preview: bodyText.slice(0, 200),
    })
  }

  return twimlResponse(replyText)
}

function twimlResponse(message: string): Response {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}
