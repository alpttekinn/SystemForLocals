import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isAdminError } from '@/lib/api/admin-guard'
import {
  getWhatsAppConversations,
  getWhatsAppConversation,
  updateConversationStatus,
  getConversationMessages,
  createWhatsAppMessage,
  incrementMessageCount,
  getWhatsAppStats,
} from '@/lib/data/whatsapp'
import { z } from 'zod'

/**
 * GET /api/admin/whatsapp/conversations — list conversations + stats.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const conversationId = searchParams.get('id')

  // Single conversation with messages
  if (conversationId) {
    const [conversation, messages] = await Promise.all([
      getWhatsAppConversation(auth.tenantId, conversationId),
      getConversationMessages(auth.tenantId, conversationId),
    ])
    if (!conversation) {
      return NextResponse.json({ error: 'Görüşme bulunamadı' }, { status: 404 })
    }
    return NextResponse.json({ conversation, messages })
  }

  // List conversations + stats
  const [conversations, stats] = await Promise.all([
    getWhatsAppConversations(auth.tenantId, { status }),
    getWhatsAppStats(auth.tenantId),
  ])

  return NextResponse.json({ conversations, stats })
}

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'ai_replied', 'awaiting_human', 'human_replied', 'closed']),
})

const replySchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
})

/**
 * PATCH /api/admin/whatsapp/conversations — update conversation status.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const parsed = updateStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  await updateConversationStatus(auth.tenantId, parsed.data.id, parsed.data.status)
  return NextResponse.json({ success: true })
}

/**
 * POST /api/admin/whatsapp/conversations — send a human reply.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const parsed = replySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  // Verify conversation belongs to tenant
  const conversation = await getWhatsAppConversation(auth.tenantId, parsed.data.conversation_id)
  if (!conversation) {
    return NextResponse.json({ error: 'Görüşme bulunamadı' }, { status: 404 })
  }

  // Create human reply message
  const message = await createWhatsAppMessage(auth.tenantId, {
    conversation_id: parsed.data.conversation_id,
    direction: 'outbound',
    sender_type: 'human',
    content: parsed.data.content,
  })

  // Update conversation status to human_replied
  await updateConversationStatus(auth.tenantId, parsed.data.conversation_id, 'human_replied', {
    last_message_preview: parsed.data.content.slice(0, 200),
  })

  await incrementMessageCount(parsed.data.conversation_id)

  return NextResponse.json({ message }, { status: 201 })
}
