import { sendEmail } from './email'
import { logNotification } from './logger'
import { createSmsProvider } from './sms'
import {
  reservationCreatedEmail,
  reservationConfirmedEmail,
  reservationCancelledEmail,
  reservationRejectedEmail,
  newReservationAdminEmail,
  eventInquiryReceivedEmail,
  newEventInquiryAdminEmail,
  newContactAdminEmail,
  reservationConfirmedSms,
  reservationCancelledSms,
} from './templates'
import { getTenantContact } from '@/lib/data/tenant'
import { formatDateTR } from '@/lib/utils'
import type { Reservation, EventInquiry } from '@/types'

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL
const PLATFORM_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3000'

/**
 * Fire-and-forget notification sender.
 * All errors are caught and logged — never blocks the calling flow.
 */
async function safeSend(fn: () => Promise<void>) {
  try {
    await fn()
  } catch (err) {
    console.error('[Notify] Send error:', err)
  }
}

// =============================================================================
// Reservation Notifications
// =============================================================================

export async function notifyReservationCreated(
  tenantId: string,
  reservation: Reservation,
  businessName: string,
) {
  const contact = await getTenantContact(tenantId)
  const dateStr = formatDateTR(reservation.reservation_date)
  const time = reservation.reservation_time.slice(0, 5)
  const cancelUrl = reservation.cancel_token
    ? `${PLATFORM_URL}/reservation/cancel/${reservation.cancel_token}`
    : undefined

  // Email to guest
  await safeSend(async () => {
    const tpl = reservationCreatedEmail({
      businessName,
      businessPhone: contact?.phone || undefined,
      guestName: reservation.guest_name,
      date: dateStr,
      time,
      guestCount: reservation.party_size,
      cancelUrl,
    })
    const result = await sendEmail({
      to: reservation.guest_email,
      subject: tpl.subject,
      html: tpl.html,
    })
    await logNotification({
      tenant_id: tenantId,
      channel: 'email',
      recipient: reservation.guest_email,
      template: 'reservation_created',
      subject: tpl.subject,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      reservation_id: reservation.id,
    })
  })

  // Email to admin
  const adminEmail = ADMIN_EMAIL || contact?.email
  if (adminEmail) {
    await safeSend(async () => {
      const tpl = newReservationAdminEmail({
        businessName,
        guestName: reservation.guest_name,
        guestPhone: reservation.guest_phone,
        guestEmail: reservation.guest_email,
        date: dateStr,
        time,
        guestCount: reservation.party_size,
        specialRequests: reservation.special_requests,
        adminUrl: `${PLATFORM_URL}/admin/reservations`,
      })
      const result = await sendEmail({ to: adminEmail, subject: tpl.subject, html: tpl.html })
      await logNotification({
        tenant_id: tenantId,
        channel: 'email',
        recipient: adminEmail,
        template: 'new_reservation_admin',
        subject: tpl.subject,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error,
        reservation_id: reservation.id,
      })
    })
  }
}

export async function notifyReservationConfirmed(
  tenantId: string,
  reservation: Reservation,
  businessName: string,
) {
  const contact = await getTenantContact(tenantId)
  const dateStr = formatDateTR(reservation.reservation_date)
  const time = reservation.reservation_time.slice(0, 5)
  const cancelUrl = reservation.cancel_token
    ? `${PLATFORM_URL}/reservation/cancel/${reservation.cancel_token}`
    : undefined

  // Email to guest
  await safeSend(async () => {
    const tpl = reservationConfirmedEmail({
      businessName,
      businessPhone: contact?.phone || undefined,
      guestName: reservation.guest_name,
      date: dateStr,
      time,
      guestCount: reservation.party_size,
      cancelUrl,
    })
    const result = await sendEmail({ to: reservation.guest_email, subject: tpl.subject, html: tpl.html })
    await logNotification({
      tenant_id: tenantId,
      channel: 'email',
      recipient: reservation.guest_email,
      template: 'reservation_confirmed',
      subject: tpl.subject,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      reservation_id: reservation.id,
    })
  })

  // SMS to guest (optional)
  await safeSend(async () => {
    const sms = createSmsProvider()
    const msg = reservationConfirmedSms({
      businessName,
      guestName: reservation.guest_name,
      date: dateStr,
      time,
      guestCount: reservation.party_size,
    })
    const result = await sms.send(reservation.guest_phone, msg)
    await logNotification({
      tenant_id: tenantId,
      channel: 'sms',
      recipient: reservation.guest_phone,
      template: 'reservation_confirmed_sms',
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      reservation_id: reservation.id,
    })
  })
}

export async function notifyReservationCancelled(
  tenantId: string,
  reservation: Reservation,
  businessName: string,
  reason?: string,
) {
  const dateStr = formatDateTR(reservation.reservation_date)
  const time = reservation.reservation_time.slice(0, 5)

  // Email to guest
  await safeSend(async () => {
    const tpl = reservationCancelledEmail({
      businessName,
      guestName: reservation.guest_name,
      date: dateStr,
      time,
      reason,
    })
    const result = await sendEmail({ to: reservation.guest_email, subject: tpl.subject, html: tpl.html })
    await logNotification({
      tenant_id: tenantId,
      channel: 'email',
      recipient: reservation.guest_email,
      template: 'reservation_cancelled',
      subject: tpl.subject,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      reservation_id: reservation.id,
    })
  })

  // SMS to guest
  await safeSend(async () => {
    const sms = createSmsProvider()
    const msg = reservationCancelledSms({
      businessName,
      guestName: reservation.guest_name,
      date: dateStr,
      time,
    })
    const result = await sms.send(reservation.guest_phone, msg)
    await logNotification({
      tenant_id: tenantId,
      channel: 'sms',
      recipient: reservation.guest_phone,
      template: 'reservation_cancelled_sms',
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      reservation_id: reservation.id,
    })
  })
}

export async function notifyReservationRejected(
  tenantId: string,
  reservation: Reservation,
  businessName: string,
  reason?: string,
) {
  const dateStr = formatDateTR(reservation.reservation_date)
  const time = reservation.reservation_time.slice(0, 5)

  await safeSend(async () => {
    const tpl = reservationRejectedEmail({
      businessName,
      guestName: reservation.guest_name,
      date: dateStr,
      time,
      reason,
    })
    const result = await sendEmail({ to: reservation.guest_email, subject: tpl.subject, html: tpl.html })
    await logNotification({
      tenant_id: tenantId,
      channel: 'email',
      recipient: reservation.guest_email,
      template: 'reservation_rejected',
      subject: tpl.subject,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      reservation_id: reservation.id,
    })
  })
}

// =============================================================================
// Event Inquiry Notifications
// =============================================================================

export async function notifyEventInquiryCreated(
  tenantId: string,
  inquiry: EventInquiry,
  businessName: string,
) {
  const contact = await getTenantContact(tenantId)

  // Acknowledgment to guest
  await safeSend(async () => {
    const tpl = eventInquiryReceivedEmail({
      businessName,
      guestName: inquiry.guest_name,
      eventType: inquiry.event_type,
      estimatedGuests: inquiry.estimated_guests,
      preferredDate: inquiry.preferred_date,
    })
    const result = await sendEmail({ to: inquiry.guest_email, subject: tpl.subject, html: tpl.html })
    await logNotification({
      tenant_id: tenantId,
      channel: 'email',
      recipient: inquiry.guest_email,
      template: 'event_inquiry_received',
      subject: tpl.subject,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      event_inquiry_id: inquiry.id,
    })
  })

  // Admin alert
  const adminEmail = ADMIN_EMAIL || contact?.email
  if (adminEmail) {
    await safeSend(async () => {
      const tpl = newEventInquiryAdminEmail({
        businessName,
        guestName: inquiry.guest_name,
        guestPhone: inquiry.guest_phone,
        guestEmail: inquiry.guest_email,
        eventType: inquiry.event_type,
        estimatedGuests: inquiry.estimated_guests,
        preferredDate: inquiry.preferred_date,
        message: inquiry.message,
        adminUrl: `${PLATFORM_URL}/admin/events`,
      })
      const result = await sendEmail({ to: adminEmail, subject: tpl.subject, html: tpl.html })
      await logNotification({
        tenant_id: tenantId,
        channel: 'email',
        recipient: adminEmail,
        template: 'new_event_inquiry_admin',
        subject: tpl.subject,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error,
        event_inquiry_id: inquiry.id,
      })
    })
  }
}

// =============================================================================
// Contact Notifications
// =============================================================================

export async function notifyContactSubmission(
  tenantId: string,
  submission: { name: string; email: string; phone?: string; message: string },
  businessName: string,
) {
  const contact = await getTenantContact(tenantId)
  const adminEmail = ADMIN_EMAIL || contact?.email
  if (!adminEmail) return

  await safeSend(async () => {
    const tpl = newContactAdminEmail({
      businessName,
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      message: submission.message,
    })
    const result = await sendEmail({ to: adminEmail, subject: tpl.subject, html: tpl.html, replyTo: submission.email })
    await logNotification({
      tenant_id: tenantId,
      channel: 'email',
      recipient: adminEmail,
      template: 'new_contact_admin',
      subject: tpl.subject,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
    })
  })
}
