/**
 * Runtime environment validation.
 * Validates required env vars early and provides typed access.
 * Import this in server-only code paths.
 */

function required(key: string): string {
  const val = process.env[key]
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return val
}

function optional(key: string, fallback?: string): string | undefined {
  return process.env[key] || fallback
}

/** Supabase — required for all environments */
export const env = {
  supabase: {
    url: () => required('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: () => required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: () => required('SUPABASE_SERVICE_ROLE_KEY'),
  },
  platform: {
    url: () => optional('NEXT_PUBLIC_PLATFORM_URL', 'http://localhost:3000')!,
    defaultTenantSlug: () => optional('NEXT_PUBLIC_DEFAULT_TENANT_SLUG', 'demo')!,
  },
  email: {
    resendApiKey: () => optional('RESEND_API_KEY'),
    fromEmail: () => optional('FROM_EMAIL', 'noreply@cafepanel.app')!,
    /** Admin email for receiving alerts (new reservations, event inquiries, etc.) */
    adminEmail: () => optional('ADMIN_NOTIFICATION_EMAIL'),
  },
  sms: {
    provider: () => optional('SMS_PROVIDER', 'mock')!,
  },
  gemini: {
    apiKey: () => optional('GEMINI_API_KEY'),
  },
  twilio: {
    accountSid: () => optional('TWILIO_ACCOUNT_SID'),
    authToken: () => optional('TWILIO_AUTH_TOKEN'),
    whatsappNumber: () => optional('TWILIO_WHATSAPP_NUMBER'),
  },
} as const

/**
 * Validate all critical env vars are set.
 * Call this once at startup or in build scripts.
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  const missing = required.filter(key => !process.env[key])
  return { valid: missing.length === 0, missing }
}
