'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'
import { MessageCircle, Bot, User, Phone, Clock, ArrowLeft } from 'lucide-react'
import type { WhatsAppConversation, WhatsAppMessage, WhatsAppConversationStatus } from '@/types'

const STATUS_CONFIG: Record<WhatsAppConversationStatus, { label: string; variant: 'charcoal' | 'info' | 'warning' | 'success' | 'gold' }> = {
  new: { label: 'Yeni', variant: 'info' },
  ai_replied: { label: 'AI Yanıtladı', variant: 'info' },
  awaiting_human: { label: 'Yanıt Bekliyor', variant: 'warning' },
  human_replied: { label: 'Yanıtlandı', variant: 'success' },
  closed: { label: 'Kapatıldı', variant: 'charcoal' },
}

export default function AdminConversationsPage() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [stats, setStats] = useState({ totalConversations: 0, activeConversations: 0, aiAssistedConversations: 0 })
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Detail view
  const [selectedConv, setSelectedConv] = useState<WhatsAppConversation | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterStatus ? `?status=${filterStatus}` : ''
      const res = await fetch(`/api/admin/whatsapp/conversations${params}`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
        setStats(data.stats || { totalConversations: 0, activeConversations: 0, aiAssistedConversations: 0 })
      }
    } catch {
      addToast('Görüşmeler yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, filterStatus])

  useEffect(() => { loadList() }, [loadList])

  async function openConversation(conv: WhatsAppConversation) {
    setSelectedConv(conv)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations?id=${conv.id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch {
      addToast('Mesajlar yüklenemedi', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  async function sendReply() {
    if (!selectedConv || !replyText.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/whatsapp/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedConv.id, content: replyText.trim() }),
      })
      if (res.ok) {
        addToast('Yanıt gönderildi', 'success')
        setReplyText('')
        openConversation(selectedConv) // Refresh messages
        loadList() // Refresh list
      } else {
        const err = await res.json().catch(() => ({}))
        addToast((err as { error?: string }).error || 'Gönderilemedi', 'error')
      }
    } catch {
      addToast('Bağlantı hatası', 'error')
    } finally {
      setSending(false)
    }
  }

  async function updateStatus(convId: string, status: WhatsAppConversationStatus) {
    try {
      const res = await fetch('/api/admin/whatsapp/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: convId, status }),
      })
      if (res.ok) {
        addToast('Durum güncellendi', 'success')
        loadList()
        if (selectedConv?.id === convId) {
          setSelectedConv(prev => prev ? { ...prev, status } : null)
        }
      }
    } catch {
      addToast('Güncellenemedi', 'error')
    }
  }

  if (loading) return <Loading />

  // Detail view
  if (selectedConv) {
    const sc = STATUS_CONFIG[selectedConv.status]
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSelectedConv(null); setMessages([]) }}
          className="flex items-center gap-2 text-sm text-charcoal-500 hover:text-charcoal-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Görüşmelere Dön
        </button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Phone size={18} className="text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {selectedConv.customer_name || selectedConv.customer_phone || 'Anonim Ziyaretçi'}
                  </CardTitle>
                  {selectedConv.customer_phone && (
                    <p className="text-xs text-charcoal-400">{selectedConv.customer_phone}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={sc.variant}>{sc.label}</Badge>
                {selectedConv.ai_used && <Badge variant="info">AI</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Messages */}
            {loadingDetail ? (
              <Loading />
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${
                        msg.direction === 'outbound'
                          ? msg.sender_type === 'ai'
                            ? 'bg-blue-50 text-blue-900 border border-blue-100'
                            : 'bg-brand-primary text-white'
                          : 'bg-charcoal-100 text-charcoal-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {msg.sender_type === 'ai' && <Bot size={12} />}
                        {msg.sender_type === 'human' && <User size={12} />}
                        {msg.sender_type === 'customer' && <MessageCircle size={12} />}
                        <span className="text-[10px] opacity-70">
                          {msg.sender_type === 'ai' ? 'AI' : msg.sender_type === 'human' ? 'Siz' : 'Müşteri'}
                          {' · '}
                          {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.ai_escalated && (
                          <span className="text-[10px] text-amber-600 font-medium ml-1">⚠ Eskale</span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-center text-charcoal-400 text-sm py-8">Henüz mesaj yok</p>
                )}
              </div>
            )}

            {/* Reply box */}
            {selectedConv.status !== 'closed' && (
              <div className="border-t pt-3 space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Yanıtınızı yazın..."
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => updateStatus(selectedConv.id, 'closed')}>
                      Kapat
                    </Button>
                  </div>
                  <Button onClick={sendReply} disabled={sending || !replyText.trim()} size="sm">
                    {sending ? 'Gönderiliyor...' : 'Yanıtla'}
                  </Button>
                </div>
                <p className="text-xs text-charcoal-400">
                  Not: Yanıtlar şu an sistem içinde kaydedilir. Gerçek WhatsApp gönderimi için provider entegrasyonu gereklidir.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-charcoal-900">WhatsApp Görüşmeleri</h1>
        <p className="text-charcoal-500 mt-1">Müşteri görüşmelerini görüntüleyin ve yanıtlayın</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-charcoal-500">Toplam Görüşme</p>
            <p className="text-2xl font-bold text-charcoal-900">{stats.totalConversations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-charcoal-500">Aktif Görüşme</p>
            <p className="text-2xl font-bold text-amber-600">{stats.activeConversations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-charcoal-500">AI Destekli</p>
            <p className="text-2xl font-bold text-blue-600">{stats.aiAssistedConversations}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Tümü' },
          { value: 'new', label: 'Yeni' },
          { value: 'awaiting_human', label: 'Yanıt Bekliyor' },
          { value: 'ai_replied', label: 'AI Yanıtladı' },
          { value: 'human_replied', label: 'Yanıtlandı' },
          { value: 'closed', label: 'Kapatıldı' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === f.value
                ? 'bg-brand-primary text-white'
                : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Conversation List */}
      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={40} className="text-charcoal-300" />}
          title="Henüz görüşme yok"
          description="WhatsApp üzerinden gelen müşteri mesajları burada görünecektir."
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const sc = STATUS_CONFIG[conv.status]
            return (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className="w-full text-left bg-white border border-charcoal-200 rounded-xl p-4 hover:border-brand-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <MessageCircle size={16} className="text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-charcoal-900 text-sm truncate">
                        {conv.customer_name || conv.customer_phone || 'Anonim Ziyaretçi'}
                      </p>
                      {conv.last_message_preview && (
                        <p className="text-xs text-charcoal-400 truncate mt-0.5">{conv.last_message_preview}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                    <span className="text-[10px] text-charcoal-400 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(conv.updated_at).toLocaleDateString('tr-TR')}
                    </span>
                    {conv.ai_used && <Badge variant="info">AI</Badge>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
