import { createAdminClient } from '@/lib/supabase/admin'
import type { WhatsAppSettings, WhatsAppConversation, WhatsAppMessage } from '@/types'

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getWhatsAppSettings(tenantId: string): Promise<WhatsAppSettings | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('whatsapp_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single<WhatsAppSettings>()
  return data
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export async function getWhatsAppConversations(
  tenantId: string,
  opts?: { status?: string; limit?: number },
): Promise<WhatsAppConversation[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })
    .limit(opts?.limit ?? 50)

  if (opts?.status) {
    query = query.eq('status', opts.status)
  }

  const { data } = await query
  return (data as WhatsAppConversation[]) || []
}

export async function getWhatsAppConversation(
  tenantId: string,
  conversationId: string,
): Promise<WhatsAppConversation | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('tenant_id', tenantId)
    .single<WhatsAppConversation>()
  return data
}

export async function createWhatsAppConversation(
  tenantId: string,
  input: {
    customer_phone?: string
    customer_name?: string
    source?: string
    metadata?: Record<string, unknown>
  },
): Promise<WhatsAppConversation | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('whatsapp_conversations')
    .insert({
      tenant_id: tenantId,
      customer_phone: input.customer_phone || null,
      customer_name: input.customer_name || null,
      source: input.source || 'website_button',
      metadata: input.metadata || {},
    })
    .select('*')
    .single<WhatsAppConversation>()
  return data
}

export async function updateConversationStatus(
  tenantId: string,
  conversationId: string,
  status: string,
  extra?: { last_message_preview?: string; ai_used?: boolean },
): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('whatsapp_conversations')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(extra?.last_message_preview !== undefined && { last_message_preview: extra.last_message_preview }),
      ...(extra?.ai_used !== undefined && { ai_used: extra.ai_used }),
    })
    .eq('id', conversationId)
    .eq('tenant_id', tenantId)
}

export async function incrementMessageCount(
  conversationId: string,
): Promise<void> {
  const supabase = createAdminClient()
  // Use RPC-style increment since we can't use raw SQL
  const { data } = await supabase
    .from('whatsapp_conversations')
    .select('message_count')
    .eq('id', conversationId)
    .single()
  if (data) {
    await supabase
      .from('whatsapp_conversations')
      .update({ message_count: (data.message_count || 0) + 1 })
      .eq('id', conversationId)
  }
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function getConversationMessages(
  tenantId: string,
  conversationId: string,
): Promise<WhatsAppMessage[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })
  return (data as WhatsAppMessage[]) || []
}

export async function createWhatsAppMessage(
  tenantId: string,
  input: {
    conversation_id: string
    direction: 'inbound' | 'outbound'
    sender_type: 'customer' | 'ai' | 'human'
    content: string
    ai_model?: string
    ai_confidence?: number
    ai_escalated?: boolean
    provider_message_id?: string
  },
): Promise<WhatsAppMessage | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('whatsapp_messages')
    .insert({
      tenant_id: tenantId,
      conversation_id: input.conversation_id,
      direction: input.direction,
      sender_type: input.sender_type,
      content: input.content,
      ai_model: input.ai_model || null,
      ai_confidence: input.ai_confidence ?? null,
      ai_escalated: input.ai_escalated ?? false,
      provider_message_id: input.provider_message_id || null,
    })
    .select('*')
    .single<WhatsAppMessage>()
  return data
}

// ---------------------------------------------------------------------------
// Conversation stats (for admin dashboard)
// ---------------------------------------------------------------------------

export async function getWhatsAppStats(tenantId: string) {
  const supabase = createAdminClient()

  const [total, active, aiReplied] = await Promise.all([
    supabase.from('whatsapp_conversations').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('whatsapp_conversations').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('status', ['new', 'ai_replied', 'awaiting_human']),
    supabase.from('whatsapp_conversations').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('ai_used', true),
  ])

  return {
    totalConversations: total.count ?? 0,
    activeConversations: active.count ?? 0,
    aiAssistedConversations: aiReplied.count ?? 0,
  }
}
