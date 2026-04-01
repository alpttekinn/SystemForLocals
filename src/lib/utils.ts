import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx + tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================================================
// Day-of-week helpers
// Convention: 0 = Monday, 6 = Sunday (ISO 8601)
// JS Date.getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
// =============================================================================

/**
 * Convert JS Date.getDay() (0=Sun) to our ISO convention (0=Mon, 6=Sun).
 */
export function jsDateToDayOfWeek(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

/**
 * Convert our day_of_week (0=Mon, 6=Sun) to JS Date.getDay() (0=Sun).
 */
export function dayOfWeekToJsDay(dow: number): number {
  return dow === 6 ? 0 : dow + 1
}

/**
 * Get the ISO day-of-week for a given Date object.
 */
export function getDayOfWeek(date: Date): number {
  return jsDateToDayOfWeek(date.getDay())
}

// =============================================================================
// Time helpers
// =============================================================================

/**
 * Parse "HH:MM" or "HH:MM:SS" into total minutes from midnight.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convert total minutes to "HH:MM" string.
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Format a time string to clean "HH:MM" (strips seconds if present).
 */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

/**
 * Generate an array of time-slot start times between open and close.
 *
 * MIDNIGHT CONVENTION:
 * close_time = "00:00" means midnight, i.e. end of the business day.
 * When close_time is numerically <= open_time, we treat close as 24:00 (1440 min).
 * This avoids broken slot generation around the midnight boundary.
 *
 * The LAST generated slot starts at (close − slot_duration) so it ends exactly at close.
 * Slots falling within a break window (break_start..break_end) are excluded.
 */
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotDurationMinutes: number,
  breakStart?: string | null,
  breakEnd?: string | null,
): string[] {
  const slots: string[] = []

  const openMin = timeToMinutes(openTime)
  let closeMin = timeToMinutes(closeTime)

  // Midnight / overnight: if close ≤ open numerically, treat close as 24:00
  if (closeMin <= openMin) {
    closeMin = 1440
  }

  const breakStartMin = breakStart ? timeToMinutes(breakStart) : null
  const breakEndMin = breakEnd ? timeToMinutes(breakEnd) : null

  // Last slot must END by close time, so last start = close − duration
  const lastSlotStart = closeMin - slotDurationMinutes

  for (let m = openMin; m <= lastSlotStart; m += slotDurationMinutes) {
    // Skip slots whose start falls within break
    if (breakStartMin !== null && breakEndMin !== null) {
      if (m >= breakStartMin && m < breakEndMin) continue
    }
    slots.push(minutesToTime(m))
  }

  return slots
}

// =============================================================================
// Date helpers
// =============================================================================

/**
 * Format a date in Turkish locale: "31 Mart 2026"
 */
export function formatDateTR(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Short Turkish date: "31 Mar"
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  })
}

/**
 * Format date as YYYY-MM-DD for API and database usage.
 */
export function toISODateString(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Format Turkish day name + date: "Pazartesi, 31 Mart 2026"
 */
export function formatFullDateTR(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// =============================================================================
// Currency
// =============================================================================

/**
 * Format price in Turkish Lira: "₺120" or "₺12,50"
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

// =============================================================================
// Turkish slug generation
// =============================================================================

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G',
  ı: 'i', İ: 'I', ö: 'o', Ö: 'O',
  ş: 's', Ş: 'S', ü: 'u', Ü: 'U',
}

export function slugify(text: string): string {
  return text
    .split('')
    .map((char) => TURKISH_CHAR_MAP[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// =============================================================================
// Phone formatting
// =============================================================================

/**
 * Normalize a Turkish phone number to digits-only format.
 * Accepts: "0216 519 52 21", "(0216) 519 52 21", "+90 216 519 52 21"
 * Returns: "02165195221"
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('90') && digits.length === 12) {
    return '0' + digits.slice(2)
  }
  return digits
}
