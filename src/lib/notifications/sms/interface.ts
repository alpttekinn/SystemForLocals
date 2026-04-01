/**
 * SMS provider interface — all providers must implement this contract.
 */
export interface SmsProvider {
  name: string
  send(to: string, message: string): Promise<SmsResult>
}

export interface SmsResult {
  success: boolean
  messageId?: string
  error?: string
}
