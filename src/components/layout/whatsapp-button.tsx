'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, ExternalLink, ChevronDown } from 'lucide-react'
import { useTenant } from '@/lib/tenant'
import { useTrack } from '@/hooks/use-track'

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text: string
  ts: number
}

/**
 * In-site chat widget. Opens a chat panel on click.
 * Messages are processed via /api/whatsapp/chat with AI.
 * If AI escalates, shows a "Continue on WhatsApp" button.
 */
export function WhatsAppButton() {
  const tenant = useTenant()
  const { track } = useTrack()
  const { contact, features } = tenant

  const isEnabled = features.whatsapp_enabled && contact.whatsapp

  const [open, setOpen] = useState(false)
  const [ctaLabel, setCtaLabel] = useState('Size nasıl yardımcı olabiliriz?')
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)
  const [escalated, setEscalated] = useState(false)
  const [waNumber, setWaNumber] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEnabled) return
    fetch('/api/whatsapp/config')
      .then(r => r.ok ? r.json() : null)
      .then(cfg => { if (cfg?.cta_label) setCtaLabel(cfg.cta_label) })
      .catch(() => {})
  }, [isEnabled])

  // Show tooltip after 3s
  useEffect(() => {
    if (!isEnabled || open) return
    const t1 = setTimeout(() => setTooltipVisible(true), 3000)
    const t2 = setTimeout(() => setTooltipVisible(false), 9000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [isEnabled, open])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      track('whatsapp_click', { source: 'chat_widget_open' })
    }
  }, [open, track])

  if (!isEnabled || dismissed) return null

  const waLink = `https://wa.me/${contact.whatsapp!.replace(/[^0-9]/g, '')}`

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/whatsapp/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversation_id: convId || undefined }),
      })
      const data = await res.json()

      if (res.ok) {
        if (!convId) setConvId(data.conversation_id)
        const aiMsg: ChatMessage = { id: crypto.randomUUID(), role: 'ai', text: data.reply, ts: Date.now() }
        setMessages(prev => [...prev, aiMsg])
        if (data.escalated) {
          setEscalated(true)
          setWaNumber(data.whatsapp_number)
        }
      } else {
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'ai',
          text: 'Şu an yanıt veremiyorum, lütfen tekrar deneyin.',
          ts: Date.now(),
        }
        setMessages(prev => [...prev, errMsg])
      }
    } catch {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: 'Bağlantı hatası, lütfen tekrar deneyin.',
        ts: Date.now(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const whatsappRedirectNumber = waNumber || contact.whatsapp!
  const waRedirectLink = `https://wa.me/${whatsappRedirectNumber.replace(/[^0-9]/g, '')}`

  return (
    <>
      {/* Desktop */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:flex flex-col items-end gap-2">
        {/* Chat panel */}
        {open && (
          <div className="w-80 bg-white rounded-2xl shadow-2xl border border-charcoal-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ height: 440 }}>
            {/* Header */}
            <div className="bg-[#128C7E] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">{tenant.tenant.name || 'Destek'}</p>
                  <p className="text-white/70 text-xs">Genellikle hemen yanıtlar</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp'ta aç"
                  className="p-1.5 text-white/70 hover:text-white transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
                <button onClick={() => setOpen(false)} className="p-1.5 text-white/70 hover:text-white transition-colors">
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#ECE5DD]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
              {messages.length === 0 && (
                <div className="flex justify-center">
                  <div className="bg-[#ffffffcc] rounded-lg px-3 py-2 text-xs text-charcoal-500 text-center max-w-56">
                    Merhaba! Size nasıl yardımcı olabiliriz?
                  </div>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[#DCF8C6] text-charcoal-900 rounded-tr-none'
                      : 'bg-white text-charcoal-800 rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-[10px] text-charcoal-400 text-right mt-0.5">
                      {new Date(msg.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white px-3 py-2.5 rounded-xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-charcoal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-charcoal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-charcoal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              {escalated && (
                <div className="flex justify-start">
                  <a
                    href={waRedirectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] text-white text-xs font-medium px-3 py-2 rounded-xl shadow-sm hover:bg-[#20b95a] transition-colors"
                  >
                    <ExternalLink size={12} />
                    WhatsApp'ta devam et
                  </a>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-2 bg-[#F0F0F0] border-t border-charcoal-100 flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mesajınızı yazın..."
                disabled={loading}
                className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-charcoal-800 outline-none border border-charcoal-200 focus:border-[#128C7E] transition-colors placeholder:text-charcoal-400 disabled:opacity-60"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-full bg-[#128C7E] text-white flex items-center justify-center hover:bg-[#0e7268] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Gönder"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Tooltip */}
        {tooltipVisible && !open && !dismissed && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-xl shadow-lg border border-charcoal-200 px-4 py-2.5 max-w-60">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-charcoal-800">{ctaLabel}</p>
                <button
                  onClick={() => { setTooltipVisible(false); setDismissed(true) }}
                  className="text-charcoal-400 hover:text-charcoal-600 transition-colors"
                  aria-label="Kapat"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => { setOpen(o => !o); setTooltipVisible(false) }}
          className="group relative w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          aria-label="Sohbet başlat"
        >
          {open
            ? <ChevronDown size={24} className="text-white" />
            : <MessageCircle size={26} className="fill-white stroke-[#25D366] group-hover:scale-110 transition-transform" />
          }
          {!open && <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />}
        </button>
      </div>

      {/* Mobile: full-screen chat or redirect to WhatsApp */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        {open && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white">
            {/* Mobile header */}
            <div className="bg-[#128C7E] px-4 py-3 flex items-center justify-between pt-safe">
              <div className="flex items-center gap-2">
                <button onClick={() => setOpen(false)} className="p-1 text-white">
                  <X size={20} />
                </button>
                <p className="text-white font-semibold">{tenant.tenant.name || 'Destek'}</p>
              </div>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-white/80">
                <ExternalLink size={18} />
              </a>
            </div>
            {/* Mobile messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#ECE5DD]">
              {messages.length === 0 && (
                <div className="flex justify-center">
                  <div className="bg-[#ffffffcc] rounded-lg px-3 py-2 text-xs text-charcoal-500 text-center">
                    Size nasıl yardımcı olabiliriz?
                  </div>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[#DCF8C6] text-charcoal-900 rounded-tr-none'
                      : 'bg-white text-charcoal-800 rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white px-3 py-2.5 rounded-xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-charcoal-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-charcoal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-charcoal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              {escalated && (
                <div className="flex justify-start">
                  <a
                    href={waRedirectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm"
                  >
                    <ExternalLink size={14} />
                    WhatsApp'ta devam et
                  </a>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Mobile input */}
            <div className="px-3 py-2 bg-[#F0F0F0] flex items-center gap-2 pb-safe">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mesajınızı yazın..."
                disabled={loading}
                className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-charcoal-800 outline-none border border-charcoal-200 focus:border-[#128C7E]"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full bg-[#128C7E] text-white flex items-center justify-center disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen(o => !o)}
          className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg"
          aria-label="Sohbet başlat"
        >
          {open
            ? <X size={20} className="text-white" />
            : <MessageCircle size={22} className="fill-white stroke-[#25D366]" />
          }
        </button>
      </div>
    </>
  )
}
