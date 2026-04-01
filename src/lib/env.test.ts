import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('env', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validateEnv', () => {
    it('returns valid when all required vars are set', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

      const { validateEnv } = await import('./env')
      const result = validateEnv()
      expect(result.valid).toBe(true)
      expect(result.missing).toEqual([])
    })

    it('returns missing vars when not set', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const { validateEnv } = await import('./env')
      const result = validateEnv()
      expect(result.valid).toBe(false)
      expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      expect(result.missing).toContain('SUPABASE_SERVICE_ROLE_KEY')
    })

    it('detects partial missing vars', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

      const { validateEnv } = await import('./env')
      const result = validateEnv()
      expect(result.valid).toBe(false)
      expect(result.missing).toEqual(['NEXT_PUBLIC_SUPABASE_ANON_KEY'])
    })
  })

  describe('env accessors', () => {
    it('env.platform.url returns fallback when not set', async () => {
      delete process.env.NEXT_PUBLIC_PLATFORM_URL

      const { env } = await import('./env')
      expect(env.platform.url()).toBe('http://localhost:3000')
    })

    it('env.platform.url returns value when set', async () => {
      process.env.NEXT_PUBLIC_PLATFORM_URL = 'https://cafepanel.com'

      const { env } = await import('./env')
      expect(env.platform.url()).toBe('https://cafepanel.com')
    })

    it('env.email.fromEmail returns fallback', async () => {
      delete process.env.FROM_EMAIL

      const { env } = await import('./env')
      expect(env.email.fromEmail()).toBe('noreply@cafepanel.com')
    })

    it('env.sms.provider defaults to mock', async () => {
      delete process.env.SMS_PROVIDER

      const { env } = await import('./env')
      expect(env.sms.provider()).toBe('mock')
    })

    it('env.supabase.url throws when not set', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const { env } = await import('./env')
      expect(() => env.supabase.url()).toThrow('Missing required environment variable')
    })
  })
})
