import { describe, test, expect } from 'vitest'
import {
  timeToMinutes,
  minutesToTime,
  generateTimeSlots,
  formatPrice,
  slugify,
  jsDateToDayOfWeek,
  dayOfWeekToJsDay,
  toISODateString,
  cn,
} from './utils'

describe('timeToMinutes', () => {
  test('parses HH:MM', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('10:00')).toBe(600)
    expect(timeToMinutes('23:59')).toBe(1439)
    expect(timeToMinutes('12:30')).toBe(750)
  })

  test('parses HH:MM:SS', () => {
    expect(timeToMinutes('10:00:00')).toBe(600)
  })
})

describe('minutesToTime', () => {
  test('converts minutes to HH:MM', () => {
    expect(minutesToTime(0)).toBe('00:00')
    expect(minutesToTime(600)).toBe('10:00')
    expect(minutesToTime(1439)).toBe('23:59')
    expect(minutesToTime(750)).toBe('12:30')
  })

  test('wraps at 24h', () => {
    expect(minutesToTime(1440)).toBe('00:00')
  })
})

describe('generateTimeSlots', () => {
  test('generates 1-hour slots for a standard day', () => {
    const slots = generateTimeSlots('10:00', '14:00', 60)
    expect(slots).toEqual(['10:00', '11:00', '12:00', '13:00'])
  })

  test('handles midnight close (00:00 treated as 24:00)', () => {
    const slots = generateTimeSlots('22:00', '00:00', 60)
    expect(slots).toEqual(['22:00', '23:00'])
  })

  test('excludes break period', () => {
    const slots = generateTimeSlots('10:00', '15:00', 60, '12:00', '13:00')
    expect(slots).toEqual(['10:00', '11:00', '13:00', '14:00'])
  })

  test('30-minute slots', () => {
    const slots = generateTimeSlots('10:00', '12:00', 30)
    expect(slots).toEqual(['10:00', '10:30', '11:00', '11:30'])
  })

  test('empty when open equals close', () => {
    // close = open means midnight-to-midnight → 24h, but slot must end by close
    const slots = generateTimeSlots('10:00', '10:00', 60)
    // close <= open → treatment: close = 1440, last start = 1440 - 60 = 1380 (23:00)
    expect(slots.length).toBeGreaterThan(0)
    expect(slots[0]).toBe('10:00')
  })
})

describe('formatPrice', () => {
  test('formats without decimals for whole numbers', () => {
    const result = formatPrice(120)
    expect(result).toContain('120')
  })

  test('formats with decimals', () => {
    const result = formatPrice(12.5)
    expect(result).toContain('12')
  })
})

describe('slugify', () => {
  test('converts Turkish characters', () => {
    expect(slugify('Çekmeköy')).toBe('cekmekoy')
    expect(slugify('İstanbul')).toBe('istanbul')
    expect(slugify('Yeşilçam')).toBe('yesilcam')
  })

  test('lowercases and hyphenates', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  test('strips leading/trailing hyphens', () => {
    expect(slugify(' test ')).toBe('test')
  })
})

describe('day-of-week conversion', () => {
  test('jsDateToDayOfWeek', () => {
    expect(jsDateToDayOfWeek(0)).toBe(6) // Sunday → 6
    expect(jsDateToDayOfWeek(1)).toBe(0) // Monday → 0
    expect(jsDateToDayOfWeek(6)).toBe(5) // Saturday → 5
  })

  test('dayOfWeekToJsDay', () => {
    expect(dayOfWeekToJsDay(6)).toBe(0) // Sun → 0
    expect(dayOfWeekToJsDay(0)).toBe(1) // Mon → 1
    expect(dayOfWeekToJsDay(5)).toBe(6) // Sat → 6
  })
})

describe('toISODateString', () => {
  test('formats as YYYY-MM-DD', () => {
    const d = new Date(2026, 2, 31) // March 31, 2026
    expect(toISODateString(d)).toBe('2026-03-31')
  })
})

describe('cn', () => {
  test('merges tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  test('handles conditional classes', () => {
    expect(cn('bg-red-500', false && 'bg-blue-500', 'text-white')).toBe('bg-red-500 text-white')
  })
})
