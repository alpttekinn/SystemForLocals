import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationChannel, NotificationStatus } from '@/types'

/**
 * Logs a notification attempt to the notification_log table.
 * Used by email and SMS senders for audit trail.
 */
export async function logNotification(params: {
  tenant_id: string
  channel: NotificationChannel
  recipient: string
  template?: string
  subject?: string
  status: NotificationStatus
  error_message?: string
  reservation_id?: string
  event_inquiry_id?: string
}) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('notification_log').insert({
      tenant_id: params.tenant_id,
      channel: params.channel,
      recipient: params.recipient,
      template: params.template || null,
      subject: params.subject || null,
      status: params.status,
      error_message: params.error_message || null,
      reservation_id: params.reservation_id || null,
      event_inquiry_id: params.event_inquiry_id || null,
    })

    if (error) {
      console.error('[NotificationLogger] Failed to log notification:', error.message)
    }
  } catch (err) {
    // Logging should never break the main flow
    console.error('[NotificationLogger] Unexpected error:', err)
  }
}
