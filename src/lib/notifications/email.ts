/**
 * Email notification service using Resend.
 * Phase 1: structure and types only.
 * Phase 2+: actual sending with templates.
 */

interface SendEmailParams {
  to: string
  subject: string
  html: string
  replyTo?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yesilcamcekmekoy.com'

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured — skipping send')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        html: params.html,
        reply_to: params.replyTo,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('[Email] Send failed:', response.status, body)
      return { success: false, error: `HTTP ${response.status}: ${body}` }
    }

    const data = await response.json()
    return { success: true, messageId: data.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Email] Send error:', message)
    return { success: false, error: message }
  }
}

export { FROM_EMAIL }
export type { SendEmailParams, EmailResult }
