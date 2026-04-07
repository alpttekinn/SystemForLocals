'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import type { WhatsAppSettings, WhatsAppAllowedTopic } from '@/types'

const ALL_TOPICS: { key: WhatsAppAllowedTopic; label: string }[] = [
  { key: 'opening_hours', label: 'Çalışma Saatleri' },
  { key: 'address', label: 'Adres / Yol Tarifi' },
  { key: 'menu_categories', label: 'Menü Kategorileri' },
  { key: 'reservation_guidance', label: 'Rezervasyon Yönlendirmesi' },
  { key: 'event_inquiry', label: 'Etkinlik Talebi' },
  { key: 'contact_info', label: 'İletişim Bilgileri' },
  { key: 'campaign_summary', label: 'Kampanya Özeti' },
]

export default function AdminWhatsAppPage() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Partial<WhatsAppSettings>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/whatsapp/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings || {})
      }
    } catch {
      addToast('Ayarlar yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/whatsapp/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: settings.enabled ?? false,
          phone_number: settings.phone_number || null,
          cta_label: settings.cta_label || 'WhatsApp ile Yazın',
          ai_enabled: settings.ai_enabled ?? false,
          ai_business_tone: settings.ai_business_tone || '',
          ai_allowed_topics: settings.ai_allowed_topics || [],
          ai_fallback_text: settings.ai_fallback_text || '',
          ai_escalation_text: settings.ai_escalation_text || '',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        addToast((err as { error?: string }).error || 'Kayıt başarısız', 'error')
        return
      }
      addToast('WhatsApp ayarları kaydedildi', 'success')
      load()
    } catch {
      addToast('Bağlantı hatası', 'error')
    } finally {
      setSaving(false)
    }
  }

  function toggleTopic(topic: WhatsAppAllowedTopic) {
    const current = settings.ai_allowed_topics || []
    const next = current.includes(topic)
      ? current.filter(t => t !== topic)
      : [...current, topic]
    setSettings(prev => ({ ...prev, ai_allowed_topics: next }))
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal-900">WhatsApp Ayarları</h1>
          <p className="text-charcoal-500 mt-1">WhatsApp iletişim ve AI otomatik yanıt ayarlarını yönetin</p>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Genel Ayarlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled ?? false}
              onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 rounded border-charcoal-300"
            />
            <span className="text-sm font-medium text-charcoal-700">WhatsApp butonu aktif</span>
          </label>

          <FormField label="WhatsApp Numarası" description="Uluslararası format: 905XX...">
            <Input
              value={settings.phone_number || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="905551234567"
            />
          </FormField>

          <FormField label="Buton Metni">
            <Input
              value={settings.cta_label || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, cta_label: e.target.value }))}
              placeholder="WhatsApp ile Yazın"
            />
          </FormField>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>AI Otomatik Yanıt (Gemini)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ai_enabled ?? false}
              onChange={(e) => setSettings(prev => ({ ...prev, ai_enabled: e.target.checked }))}
              className="w-4 h-4 rounded border-charcoal-300"
            />
            <span className="text-sm font-medium text-charcoal-700">AI otomatik yanıtı aktif</span>
          </label>

          {settings.ai_enabled && (
            <>
              <FormField label="İşletme Tonu / Marka Sesi" description="AI'ın yanıt verirken kullanacağı üslup">
                <Textarea
                  value={settings.ai_business_tone || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, ai_business_tone: e.target.value }))}
                  placeholder="Samimi ve profesyonel bir kafe asistanı"
                  rows={2}
                />
              </FormField>

              <FormField label="İzin Verilen Konular" description="AI'ın yanıtlayabileceği konuları seçin">
                <div className="flex flex-wrap gap-2">
                  {ALL_TOPICS.map(topic => {
                    const active = (settings.ai_allowed_topics || []).includes(topic.key)
                    return (
                      <button
                        key={topic.key}
                        type="button"
                        onClick={() => toggleTopic(topic.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          active
                            ? 'bg-brand-primary text-white'
                            : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
                        }`}
                      >
                        {topic.label}
                      </button>
                    )
                  })}
                </div>
              </FormField>

              <FormField label="Yedek Yanıt Metni" description="AI yanıt veremediğinde gönderilecek mesaj">
                <Textarea
                  value={settings.ai_fallback_text || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, ai_fallback_text: e.target.value }))}
                  placeholder="Detaylı bilgi için sizi yetkilimize yönlendiriyorum..."
                  rows={2}
                />
              </FormField>

              <FormField label="Yetkiliye Yönlendirme Metni" description="AI emin olmadığında kullanacağı eskale metni">
                <Textarea
                  value={settings.ai_escalation_text || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, ai_escalation_text: e.target.value }))}
                  placeholder="Bu konuda yetkilimiz en kısa sürede sizinle iletişime geçecektir."
                  rows={2}
                />
              </FormField>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Safety Notice */}
      <Card>
        <CardHeader>
          <CardTitle>Güvenlik ve Sınırlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 space-y-2">
            <p className="font-medium">AI Otomatik Yanıt Güvenlik Kuralları:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>AI yalnızca yukarıda seçilen konularda yanıt verir</li>
              <li>Fiyat, taahhüt veya rezervasyon onayı <strong>vermez</strong></li>
              <li>Emin olmadığı durumlarda otomatik olarak yetkiliye yönlendirir</li>
              <li>Menü detayları, içerik bilgileri veya politikalar hakkında tahmin yapmaz</li>
              <li>Tüm yanıtlar izlenebilir ve görüşme geçmişinde saklanır</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <Badge variant={settings.enabled ? 'success' : 'charcoal'}>
          {settings.enabled ? 'WhatsApp Aktif' : 'WhatsApp Pasif'}
        </Badge>
        {settings.ai_enabled && (
          <Badge variant="info">AI Otomatik Yanıt Aktif</Badge>
        )}
      </div>
    </div>
  )
}
