import type { SmsProvider, SmsResult } from './interface'

/**
 * Mock SMS provider for development/testing.
 * Logs SMS to console instead of sending.
 */
export class MockSmsProvider implements SmsProvider {
  name = 'mock'

  async send(to: string, message: string): Promise<SmsResult> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SMS-Mock] To: ${to}`)
      console.log(`[SMS-Mock] Message: ${message}`)
      console.log(`[SMS-Mock] ---`)
    }
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    }
  }
}
