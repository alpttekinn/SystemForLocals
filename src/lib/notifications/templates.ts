/**
 * Email/SMS notification templates.
 * All templates accept a `businessName` parameter for multi-tenant support.
 * HTML emails use inline styles for maximum compatibility.
 */

// ---- Shared email wrapper ----

function emailWrapper(businessName: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f5f0;font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5f0;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <tr><td style="padding:32px 32px 0;text-align:center;border-bottom:2px solid #f0e8d8;">
      <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#264d26;letter-spacing:0.5px;">★ ${escapeHtml(businessName)} ★</p>
    </td></tr>
    <tr><td style="padding:32px;">
      ${content}
    </td></tr>
    <tr><td style="padding:16px 32px 32px;text-align:center;border-top:1px solid #f0e8d8;">
      <p style="margin:0;font-size:12px;color:#7a7a7a;">${escapeHtml(businessName)}</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 12px;border-bottom:1px solid #f0e8d8;font-size:14px;color:#7a7a7a;width:35%;">${escapeHtml(label)}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #f0e8d8;font-size:14px;font-weight:600;color:#1a1a1a;">${escapeHtml(value)}</td>
  </tr>`
}

function detailTable(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #f0e8d8;border-radius:8px;overflow:hidden;">
    ${rows.map(([l, v]) => detailRow(l, v)).join('')}
  </table>`
}

function ctaButton(text: string, url: string, color: string = '#264d26'): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr><td style="background:${color};border-radius:8px;padding:14px 32px;">
      <a href="${escapeHtml(url)}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">${escapeHtml(text)}</a>
    </td></tr>
  </table>`
}

// ---- Reservation: Guest Created (pending) ----

export function reservationCreatedEmail(params: {
  businessName: string
  businessPhone?: string
  guestName: string
  date: string
  time: string
  guestCount: number
  cancelUrl?: string
}): { subject: string; html: string } {
  const details: [string, string][] = [
    ['Tarih', params.date],
    ['Saat', params.time],
    ['Kişi Sayısı', String(params.guestCount)],
  ]
  const cancelBlock = params.cancelUrl
    ? `<p style="font-size:13px;color:#7a7a7a;margin-top:16px;">Rezervasyonunuzu iptal etmek isterseniz:</p>${ctaButton('Rezervasyonu İptal Et', params.cancelUrl, '#8b2545')}`
    : ''

  return {
    subject: `Rezervasyon Alındı — ${params.businessName}`,
    html: emailWrapper(params.businessName, `
      <h1 style="margin:0 0 8px;font-size:22px;color:#264d26;text-align:center;">Rezervasyonunuz Alındı</h1>
      <p style="text-align:center;color:#7a7a7a;font-size:14px;margin:0 0 24px;">Onay bekleniyor</p>
      <p style="font-size:15px;color:#1a1a1a;">Sayın <strong>${escapeHtml(params.guestName)}</strong>,</p>
      <p style="font-size:15px;color:#4a4a4a;">Rezervasyon talebiniz alınmıştır. Onaylandığında size bilgi vereceğiz.</p>
      ${detailTable(details)}
      ${cancelBlock}
    `),
  }
}

// ---- Reservation: Guest Confirmed ----

export function reservationConfirmedEmail(params: {
  businessName: string
  businessPhone?: string
  guestName: string
  date: string
  time: string
  guestCount: number
  cancelUrl?: string
}): { subject: string; html: string } {
  const details: [string, string][] = [
    ['Tarih', params.date],
    ['Saat', params.time],
    ['Kişi Sayısı', String(params.guestCount)],
  ]

  return {
    subject: `Rezervasyon Onaylandı — ${params.businessName}`,
    html: emailWrapper(params.businessName, `
      <h1 style="margin:0 0 8px;font-size:22px;color:#264d26;text-align:center;">✓ Rezervasyonunuz Onaylandı</h1>
      <p style="font-size:15px;color:#1a1a1a;">Sayın <strong>${escapeHtml(params.guestName)}</strong>,</p>
      <p style="font-size:15px;color:#4a4a4a;">Rezervasyonunuz onaylanmıştır. Sizi ağırlamaktan mutluluk duyacağız!</p>
      ${detailTable(details)}
      ${params.businessPhone ? `<p style="font-size:13px;color:#7a7a7a;text-align:center;">Sorularınız için: ${escapeHtml(params.businessPhone)}</p>` : ''}
      ${params.cancelUrl ? `<p style="font-size:12px;color:#999;text-align:center;margin-top:20px;"><a href="${escapeHtml(params.cancelUrl)}" style="color:#8b2545;">Rezervasyonu iptal et</a></p>` : ''}
    `),
  }
}

// ---- Reservation: Cancelled ----

export function reservationCancelledEmail(params: {
  businessName: string
  guestName: string
  date: string
  time: string
  reason?: string
}): { subject: string; html: string } {
  return {
    subject: `Rezervasyon İptal Edildi — ${params.businessName}`,
    html: emailWrapper(params.businessName, `
      <h1 style="margin:0 0 8px;font-size:22px;color:#8b2545;text-align:center;">Rezervasyon İptal Edildi</h1>
      <p style="font-size:15px;color:#1a1a1a;">Sayın <strong>${escapeHtml(params.guestName)}</strong>,</p>
      <p style="font-size:15px;color:#4a4a4a;">${escapeHtml(params.date)} tarihli ${escapeHtml(params.time)} saatli rezervasyonunuz iptal edilmiştir.</p>
      ${params.reason ? `<p style="font-size:14px;color:#7a7a7a;">Sebep: ${escapeHtml(params.reason)}</p>` : ''}
      <p style="font-size:15px;color:#4a4a4a;">Yeni bir rezervasyon oluşturmak isterseniz sitemizi ziyaret edebilirsiniz.</p>
    `),
  }
}

// ---- Reservation: Rejected ----

export function reservationRejectedEmail(params: {
  businessName: string
  guestName: string
  date: string
  time: string
  reason?: string
}): { subject: string; html: string } {
  return {
    subject: `Rezervasyon Talebi Reddedildi — ${params.businessName}`,
    html: emailWrapper(params.businessName, `
      <h1 style="margin:0 0 8px;font-size:22px;color:#8b2545;text-align:center;">Rezervasyon Reddedildi</h1>
      <p style="font-size:15px;color:#1a1a1a;">Sayın <strong>${escapeHtml(params.guestName)}</strong>,</p>
      <p style="font-size:15px;color:#4a4a4a;">Üzgünüz, ${escapeHtml(params.date)} tarihli rezervasyon talebiniz onaylanamamıştır.</p>
      ${params.reason ? `<p style="font-size:14px;color:#7a7a7a;">Sebep: ${escapeHtml(params.reason)}</p>` : ''}
      <p style="font-size:15px;color:#4a4a4a;">Farklı bir tarih için tekrar deneyebilirsiniz.</p>
    `),
  }
}

// ---- Admin: New Reservation Alert ----

export function newReservationAdminEmail(params: {
  businessName: string
  guestName: string
  guestPhone: string
  guestEmail: string
  date: string
  time: string
  guestCount: number
  specialRequests?: string | null
  adminUrl?: string
}): { subject: string; html: string } {
  const details: [string, string][] = [
    ['Misafir', params.guestName],
    ['Telefon', params.guestPhone],
    ['E-posta', params.guestEmail],
    ['Tarih', params.date],
    ['Saat', params.time],
    ['Kişi', String(params.guestCount)],
  ]
  if (params.specialRequests) {
    details.push(['Özel İstek', params.specialRequests])
  }

  return {
    subject: `Yeni Rezervasyon: ${params.guestName} — ${params.date} ${params.time}`,
    html: emailWrapper(params.businessName, `
      <h1 style="margin:0 0 16px;font-size:20px;color:#264d26;text-align:center;">Yeni Rezervasyon Talebi</h1>
      ${detailTable(details)}
      ${params.adminUrl ? ctaButton('Yönetim Panelinde Görüntüle', params.adminUrl) : ''}
    `),
  }
}

// ---- Event Inquiry: Guest Acknowledgment ----

export function eventInquiryReceivedEmail(params: {
  businessName: string
  guestName: string
  eventType: string
  estimatedGuests: number
  preferredDate?: string | null
}): { subject: string; html: string } {
  const details: [string, string][] = [
    ['Etkinlik Türü', params.eventType],
    ['Tahmini Kişi', String(params.estimatedGuests)],
  ]
  if (params.preferredDate) {
    details.push(['Tercih Edilen Tarih', params.preferredDate])
  }

  return {
    subject: `Etkinlik Talebiniz Alındı — ${params.businessName}`,
    html: emailWrapper(params.businessName, `
      <h1 style="margin:0 0 16px;font-size:22px;color:#264d26;text-align:center;">Etkinlik Talebiniz Alındı</h1>
      <p style="font-size:15px;color:#1a1a1a;">Sayın <strong>${escapeHtml(params.guestName)}</strong>,</p>
      <p style="font-size:15px;color:#4a4a4a;">Etkinlik talebiniz alınmıştır. Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
      ${detailTable(details)}
    `),
  }
}

// ---- Admin: New Event Inquiry Alert ----

export function newEventInquiryAdminEmail(params: {
  businessName: string
  guestName: string
  guestPhone: string
  guestEmail: string
  eventType: string
  estimatedGuests: number
  preferredDate?: string | null
  message?: string | null
  adminUrl?: string
}): { subject: string; html: string } {
  const details: [string, string][] = [
    ['Misafir', params.guestName],
    ['Telefon', params.guestPhone],
    ['E-posta', params.guestEmail],
    ['Etkinlik Türü', params.eventType],
    ['Tahmini Kişi', String(params.estimatedGuests)],
  ]
  if (params.preferredDate) details.push(['Tercih Edilen Tarih', params.preferredDate])
  if (params.message) details.push(['Mesaj', params.message])

  return {
    subject: `Yeni Etkinlik Talebi: ${params.guestName}`,
    html: emailWrapper(params.businessName, `
      <h1 style="margin:0 0 16px;font-size:20px;color:#264d26;text-align:center;">Yeni Etkinlik Talebi</h1>
      ${detailTable(details)}
      ${params.adminUrl ? ctaButton('Yönetim Panelinde Görüntüle', params.adminUrl) : ''}
    `),
  }
}

// ---- Contact: Admin Alert ----

export function newContactAdminEmail(params: {
  businessName: string
  name: string
  email: string
  phone?: string
  message: string
}): { subject: string; html: string } {
  const details: [string, string][] = [
    ['İsim', params.name],
    ['E-posta', params.email],
  ]
  if (params.phone) details.push(['Telefon', params.phone])
  details.push(['Mesaj', params.message])

  return {
    subject: `Yeni İletişim Mesajı: ${params.name}`,
    html: emailWrapper(params.businessName, `
      <h1 style="margin:0 0 16px;font-size:20px;color:#264d26;text-align:center;">Yeni İletişim Formu</h1>
      ${detailTable(details)}
    `),
  }
}

// ---- SMS Templates ----

export function reservationConfirmedSms(params: {
  businessName: string
  guestName: string
  date: string
  time: string
  guestCount: number
}): string {
  return `${params.businessName} - Rezervasyonunuz onaylandı! ${params.guestName}, ${params.date} ${params.time}, ${params.guestCount} kişi. Görüşmek üzere!`
}

export function reservationCancelledSms(params: {
  businessName: string
  guestName: string
  date: string
  time: string
}): string {
  return `${params.businessName} - Sayın ${params.guestName}, ${params.date} ${params.time} tarihli rezervasyonunuz iptal edilmiştir.`
}

export function newReservationAdminSms(params: {
  guestName: string
  date: string
  time: string
  guestCount: number
}): string {
  return `Yeni rezervasyon: ${params.guestName}, ${params.date} ${params.time}, ${params.guestCount} kişi`
}

export function eventInquiryReceivedSms(params: {
  businessName: string
  contactName: string
}): string {
  return `${params.businessName} - Sayın ${params.contactName}, etkinlik talebiniz alınmıştır. En kısa sürede dönüş yapacağız.`
}

// ---- Utility ----

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}
