/**
 * Twilio outbound messaging service.
 *
 * Used to:
 * 1. Notify the business owner when a new chat arrives on the website
 * 2. Forward AI-escalated conversations to the business WhatsApp
 */

export interface SendWhatsAppResult {
  success: boolean
  sid?: string
  error?: string
}

/**
 * Send a WhatsApp message via Twilio REST API.
 *
 * In sandbox mode, the "To" number must have joined the sandbox first
 * (by sending "join <keyword>" to the sandbox number).
 */
export async function sendWhatsAppMessage(
  to: string,   // E.164, e.g. "905394380128" or "+905394380128"
  body: string,
): Promise<SendWhatsAppResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER?.trim() || '+14155238886'

  if (!accountSid || !authToken) {
    return { success: false, error: 'Twilio credentials not configured' }
  }

  const toFormatted = to.startsWith('+') ? to : `+${to.replace(/[^0-9]/g, '')}`
  const fromFormatted = fromNumber.startsWith('+') ? fromNumber : `+${fromNumber.replace(/[^0-9]/g, '')}`

  const params = new URLSearchParams({
    To: `whatsapp:${toFormatted}`,
    From: `whatsapp:${fromFormatted}`,
    Body: body,
  })

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: `Twilio error ${res.status}: ${(err as {message?: string}).message || 'unknown'}` }
    }

    const data = await res.json() as { sid: string }
    return { success: true, sid: data.sid }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Notify business owner that a new website visitor started a chat.
 * Sends a WhatsApp message to the business phone number.
 */
export async function notifyBusinessOwner(
  businessPhone: string,
  visitorMessage: string,
  aiReply: string,
  escalated: boolean,
): Promise<SendWhatsAppResult> {
  const preview = visitorMessage.length > 100 ? visitorMessage.slice(0, 97) + '...' : visitorMessage

  let text: string
  if (escalated) {
    text = `🔔 *Web Sitesinden Yeni Müşteri Mesajı*\n\nMüşteri: "${preview}"\n\nAI yanıt yetersiz kaldı — lütfen yanıt verin.\n\n_Yeşilçam Çekmeköy CafePanel_`
  } else {
    text = `🔔 *Web Sitesinden Yeni Sohbet*\n\nMüşteri: "${preview}"\n\nAI yanıtladı: "${aiReply.length > 80 ? aiReply.slice(0, 77) + '...' : aiReply}"\n\n_Yeşilçam Çekmeköy CafePanel_`
  }

  return sendWhatsAppMessage(businessPhone, text)
}
