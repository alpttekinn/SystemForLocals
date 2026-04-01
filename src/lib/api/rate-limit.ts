import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple in-memory rate limiter for public API endpoints.
 * Production-scale: replace with Redis or Vercel KV.
 *
 * Each window tracks IP + route hits within the time window.
 * Stale entries are cleaned up lazily.
 */

interface RateEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateEntry>()

// Lazy cleanup every 60s
let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}

/**
 * Check rate limit. Returns null if allowed, or a NextResponse 429 if exceeded.
 *
 * @param request   The incoming request (uses IP for keying)
 * @param route     A label for the route (e.g. "reservations")
 * @param maxHits   Maximum hits in the window
 * @param windowMs  Window size in milliseconds (default: 60s)
 */
export function rateLimit(
  request: NextRequest,
  route: string,
  maxHits: number = 10,
  windowMs: number = 60_000,
): NextResponse | null {
  cleanup()

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  const key = `${ip}:${route}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  entry.count++

  if (entry.count > maxHits) {
    return NextResponse.json(
      { error: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
        },
      },
    )
  }

  return null
}
