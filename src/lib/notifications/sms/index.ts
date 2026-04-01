import type { SmsProvider } from './interface'
import { MockSmsProvider } from './mock'

/**
 * SMS provider factory.
 * Returns the configured SMS provider based on environment.
 * Phase 2+: add real providers (Netgsm, Twilio, etc.)
 */
export function createSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER || 'mock'

  switch (provider) {
    // Phase 2: real providers
    // case 'netgsm':
    //   return new NetgsmProvider()
    // case 'twilio':
    //   return new TwilioProvider()
    case 'mock':
    default:
      return new MockSmsProvider()
  }
}

export type { SmsProvider, SmsResult } from './interface'
