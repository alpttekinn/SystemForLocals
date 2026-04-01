'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Loading } from '@/components/ui/loading'
import { Modal } from '@/components/ui/modal'
import type { TenantBranding, TenantContact, TenantSeo, TenantFeatures, BusinessHours, ReservationRules, SpecialDate, BlockedSlot } from '@/types'

const DAY_NAMES = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar']
const TABS = [
  { key: 'branding', label: 'Marka' },
  { key: 'contact', label: 'Iletisim' },
  { key: 'seo', label: 'SEO' },
  { key: 'features', label: 'Ozellikler' },
  { key: 'hours', label: 'Calisma Saatleri' },
  { key: 'rules', label: 'Rezervasyon Kurallari' },
] as const

type TabKey = typeof TABS[number]['key']

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<TabKey>('branding')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Settings data
  const [branding, setBranding] = useState<Partial<TenantBranding>>({})
  const [contact, setContact] = useState<Partial<TenantContact>>({})
  const [seo, setSeo] = useState<Partial<TenantSeo>>({})
  const [features, setFeatures] = useState<Partial<TenantFeatures>>({})

  // Hours data
  const [hours, setHours] = useState<BusinessHours[]>([])
  const [rules, setRules] = useState<Partial<ReservationRules>>({})
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [showSpecialForm, setShowSpecialForm] = useState(false)
  const [showBlockedForm, setShowBlockedForm] = useState(false)

  // Special date form
  const [sdDate, setSdDate] = useState('')
  const [sdClosed, setSdClosed] = useState(true)
  const [sdOpen, setSdOpen] = useState('')
  const [sdClose, setSdClose] = useState('')
  const [sdReason, setSdReason] = useState('')

  // Blocked slot form
  const [bsDate, setBsDate] = useState('')
  const [bsType, setBsType] = useState('full_day')
  const [bsStart, setBsStart] = useState('')
  const [bsEnd, setBsEnd] = useState('')
  const [bsReason, setBsReason] = useState('')

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const [settingsRes, hoursRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/hours'),
      ])
      if (settingsRes.ok) {
        const s = await settingsRes.json()
        setBranding(s.branding || {})
        setContact(s.contact || {})
        setSeo(s.seo || {})
        setFeatures(s.features || {})
      }
      if (hoursRes.ok) {
        const h = await hoursRes.json()
        setHours(h.hours || [])
        setRules(h.rules || {})
        setSpecialDates(h.specialDates || [])
        setBlockedSlots(h.blockedSlots || [])
      }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  async function saveSection(section: string, data: unknown) {
    setSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, data }),
      })
      loadSettings()
    } catch {} finally { setSaving(false) }
  }

  async function saveHoursAction(action: string, data: unknown) {
    setSaving(true)
    try {
      await fetch('/api/admin/hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      })
      loadSettings()
    } catch {} finally { setSaving(false) }
  }

  function updateHour(idx: number, field: keyof BusinessHours, value: unknown) {
    setHours((prev) => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h))
  }

  async function addSpecialDate() {
    await saveHoursAction('add_special_date', {
      date: sdDate,
      is_closed: sdClosed,
      open_time: sdClosed ? null : sdOpen,
      close_time: sdClosed ? null : sdClose,
      reason: sdReason || null,
    })
    setShowSpecialForm(false)
    setSdDate(''); setSdReason('')
  }

  async function addBlockedSlot() {
    await saveHoursAction('add_blocked_slot', {
      date: bsDate,
      block_type: bsType,
      start_time: bsType === 'time_range' ? bsStart : null,
      end_time: bsType === 'time_range' ? bsEnd : null,
      reason: bsReason || null,
    })
    setShowBlockedForm(false)
    setBsDate(''); setBsReason('')
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <h1 className="text-section-heading text-charcoal-900">Ayarlar</h1>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 border-b border-charcoal-100 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium rounded-t transition-colors ${
              tab === t.key ? 'bg-white text-charcoal-900 border border-b-white border-charcoal-200 -mb-px' : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Branding */}
      {tab === 'branding' && (
        <Card>
          <CardHeader><CardTitle>Marka Ayarlari</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Slogan">
                <Input value={branding.tagline || ''} onChange={(e) => setBranding({ ...branding, tagline: e.target.value })} />
              </FormField>
              <FormField label="Kisa Aciklama">
                <Input value={branding.short_description || ''} onChange={(e) => setBranding({ ...branding, short_description: e.target.value })} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Hero Baslik">
                <Input value={branding.hero_title || ''} onChange={(e) => setBranding({ ...branding, hero_title: e.target.value })} />
              </FormField>
              <FormField label="Hero Alt Baslik">
                <Input value={branding.hero_subtitle || ''} onChange={(e) => setBranding({ ...branding, hero_subtitle: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Hero CTA Metni">
              <Input value={branding.hero_cta_text || ''} onChange={(e) => setBranding({ ...branding, hero_cta_text: e.target.value })} />
            </FormField>
            <FormField label="Logo URL">
              <Input value={branding.logo_url || ''} onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })} />
            </FormField>
            <FormField label="Hero Gorsel URL">
              <Input value={branding.hero_image_url || ''} onChange={(e) => setBranding({ ...branding, hero_image_url: e.target.value })} />
            </FormField>
            <FormField label="Footer Metni">
              <Textarea value={branding.footer_text || ''} onChange={(e) => setBranding({ ...branding, footer_text: e.target.value })} rows={2} />
            </FormField>
            <Button variant="primary" onClick={() => saveSection('branding', {
              tagline: branding.tagline, short_description: branding.short_description,
              hero_title: branding.hero_title, hero_subtitle: branding.hero_subtitle,
              hero_cta_text: branding.hero_cta_text, logo_url: branding.logo_url,
              hero_image_url: branding.hero_image_url, footer_text: branding.footer_text,
            })} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact */}
      {tab === 'contact' && (
        <Card>
          <CardHeader><CardTitle>Iletisim Bilgileri</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Telefon">
                <Input value={contact.phone || ''} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              </FormField>
              <FormField label="WhatsApp">
                <Input value={contact.whatsapp || ''} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} />
              </FormField>
            </div>
            <FormField label="E-posta">
              <Input type="email" value={contact.email || ''} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            </FormField>
            <FormField label="Adres">
              <Textarea value={contact.address || ''} onChange={(e) => setContact({ ...contact, address: e.target.value })} rows={2} />
            </FormField>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Sehir">
                <Input value={contact.city || ''} onChange={(e) => setContact({ ...contact, city: e.target.value })} />
              </FormField>
              <FormField label="Ilce">
                <Input value={contact.district || ''} onChange={(e) => setContact({ ...contact, district: e.target.value })} />
              </FormField>
              <FormField label="Posta Kodu">
                <Input value={contact.postal_code || ''} onChange={(e) => setContact({ ...contact, postal_code: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Harita Embed URL">
              <Input value={contact.maps_embed_url || ''} onChange={(e) => setContact({ ...contact, maps_embed_url: e.target.value })} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Instagram">
                <Input value={contact.instagram_url || ''} onChange={(e) => setContact({ ...contact, instagram_url: e.target.value })} />
              </FormField>
              <FormField label="Facebook">
                <Input value={contact.facebook_url || ''} onChange={(e) => setContact({ ...contact, facebook_url: e.target.value })} />
              </FormField>
            </div>
            <Button variant="primary" onClick={() => saveSection('contact', {
              phone: contact.phone, whatsapp: contact.whatsapp, email: contact.email,
              address: contact.address, city: contact.city, district: contact.district,
              postal_code: contact.postal_code, maps_embed_url: contact.maps_embed_url,
              instagram_url: contact.instagram_url, facebook_url: contact.facebook_url,
            })} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SEO */}
      {tab === 'seo' && (
        <Card>
          <CardHeader><CardTitle>SEO Ayarlari</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Meta Baslik Sablonu">
              <Input value={seo.meta_title_template || ''} onChange={(e) => setSeo({ ...seo, meta_title_template: e.target.value })} placeholder="%s | Restoran Adi" />
            </FormField>
            <FormField label="Meta Aciklama">
              <Textarea value={seo.meta_description || ''} onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })} rows={2} />
            </FormField>
            <FormField label="Canonical Base URL">
              <Input value={seo.canonical_base_url || ''} onChange={(e) => setSeo({ ...seo, canonical_base_url: e.target.value })} placeholder="https://example.com" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="OG Baslik">
                <Input value={seo.og_title || ''} onChange={(e) => setSeo({ ...seo, og_title: e.target.value })} />
              </FormField>
              <FormField label="OG Aciklama">
                <Input value={seo.og_description || ''} onChange={(e) => setSeo({ ...seo, og_description: e.target.value })} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Isletme Turu">
                <Input value={seo.business_type || ''} onChange={(e) => setSeo({ ...seo, business_type: e.target.value })} />
              </FormField>
              <FormField label="Fiyat Araligi">
                <Input value={seo.price_range || ''} onChange={(e) => setSeo({ ...seo, price_range: e.target.value })} placeholder="$$" />
              </FormField>
            </div>
            <Button variant="primary" onClick={() => saveSection('seo', {
              meta_title_template: seo.meta_title_template, meta_description: seo.meta_description,
              canonical_base_url: seo.canonical_base_url, og_title: seo.og_title,
              og_description: seo.og_description, business_type: seo.business_type, price_range: seo.price_range,
            })} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      {tab === 'features' && (
        <Card>
          <CardHeader><CardTitle>Ozellik Ayarlari</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              ['reservations_enabled', 'Rezervasyonlar'],
              ['events_enabled', 'Etkinlikler'],
              ['gallery_enabled', 'Galeri'],
              ['campaigns_enabled', 'Kampanyalar'],
              ['faq_enabled', 'SSS'],
              ['testimonials_enabled', 'Yorumlar'],
              ['contact_form_enabled', 'Iletisim Formu'],
              ['email_notifications_enabled', 'E-posta Bildirimleri'],
            ] as [keyof TenantFeatures, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between p-3 rounded-lg border border-charcoal-100 hover:bg-charcoal-50/50 cursor-pointer">
                <span className="text-sm font-medium text-charcoal-800">{label}</span>
                <input
                  type="checkbox"
                  checked={!!features[key]}
                  onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })}
                  className="rounded"
                />
              </label>
            ))}
            <Button variant="primary" className="mt-4" onClick={() => saveSection('features', {
              reservations_enabled: features.reservations_enabled,
              events_enabled: features.events_enabled,
              gallery_enabled: features.gallery_enabled,
              campaigns_enabled: features.campaigns_enabled,
              faq_enabled: features.faq_enabled,
              testimonials_enabled: features.testimonials_enabled,
              contact_form_enabled: features.contact_form_enabled,
              email_notifications_enabled: features.email_notifications_enabled,
            })} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Business Hours */}
      {tab === 'hours' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Calisma Saatleri</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {hours.length === 0 ? (
                <p className="text-sm text-charcoal-400">Saat verisi bulunamadi.</p>
              ) : (
                hours.sort((a, b) => a.day_of_week - b.day_of_week).map((h, idx) => (
                  <div key={h.id || idx} className="flex items-center gap-3 text-sm">
                    <span className="w-24 font-medium text-charcoal-800">{DAY_NAMES[h.day_of_week] || `Gun ${h.day_of_week}`}</span>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={h.is_open} onChange={(e) => updateHour(idx, 'is_open', e.target.checked)} className="rounded" />
                      Acik
                    </label>
                    {h.is_open && (
                      <>
                        <Input type="time" value={h.open_time?.slice(0, 5) || ''} onChange={(e) => updateHour(idx, 'open_time', e.target.value)} className="w-28" />
                        <span className="text-charcoal-400">-</span>
                        <Input type="time" value={h.close_time?.slice(0, 5) || ''} onChange={(e) => updateHour(idx, 'close_time', e.target.value)} className="w-28" />
                      </>
                    )}
                  </div>
                ))
              )}
              {hours.length > 0 && (
                <Button variant="primary" className="mt-3" disabled={saving} onClick={async () => {
                  for (const h of hours) {
                    await saveHoursAction('update_hours', {
                      day_of_week: h.day_of_week,
                      is_open: h.is_open,
                      open_time: h.open_time,
                      close_time: h.close_time,
                    })
                  }
                }}>
                  {saving ? 'Kaydediliyor...' : 'Saatleri Kaydet'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Special Dates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ozel Gunler</CardTitle>
                <Button variant="secondary" size="sm" onClick={() => setShowSpecialForm(true)}>Ekle</Button>
              </div>
            </CardHeader>
            <CardContent>
              {specialDates.length === 0 ? (
                <p className="text-sm text-charcoal-400">Ozel gun tanimlanmamis.</p>
              ) : (
                <div className="space-y-2">
                  {specialDates.map((sd) => (
                    <div key={sd.id} className="flex items-center justify-between text-sm p-2 rounded bg-charcoal-50/50">
                      <div>
                        <span className="font-medium">{sd.date}</span>
                        {sd.reason && <span className="text-charcoal-500 ml-2">({sd.reason})</span>}
                        {sd.is_closed ? <Badge variant="error" className="ml-2">Kapali</Badge> : <Badge variant="success" className="ml-2">Acik {sd.open_time?.slice(0,5)}-{sd.close_time?.slice(0,5)}</Badge>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => saveHoursAction('delete_special_date', { id: sd.id })}>Sil</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocked Slots */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bloklu Slotlar</CardTitle>
                <Button variant="secondary" size="sm" onClick={() => setShowBlockedForm(true)}>Ekle</Button>
              </div>
            </CardHeader>
            <CardContent>
              {blockedSlots.length === 0 ? (
                <p className="text-sm text-charcoal-400">Bloklu slot yok.</p>
              ) : (
                <div className="space-y-2">
                  {blockedSlots.map((bs) => (
                    <div key={bs.id} className="flex items-center justify-between text-sm p-2 rounded bg-charcoal-50/50">
                      <div>
                        <span className="font-medium">{bs.date}</span>
                        <Badge variant="default" className="ml-2">{bs.block_type === 'full_day' ? 'Tam Gun' : `${bs.start_time?.slice(0,5)}-${bs.end_time?.slice(0,5)}`}</Badge>
                        {bs.reason && <span className="text-charcoal-500 ml-2">{bs.reason}</span>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => saveHoursAction('delete_blocked_slot', { id: bs.id })}>Sil</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reservation Rules */}
      {tab === 'rules' && (
        <Card>
          <CardHeader><CardTitle>Rezervasyon Kurallari</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Slot Suresi (dk)">
                <Input type="number" value={rules.slot_duration_minutes || 30} onChange={(e) => setRules({ ...rules, slot_duration_minutes: Number(e.target.value) })} />
              </FormField>
              <FormField label="Slot Kapasitesi">
                <Input type="number" value={rules.default_slot_capacity || 10} onChange={(e) => setRules({ ...rules, default_slot_capacity: Number(e.target.value) })} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Min Kisi Sayisi">
                <Input type="number" value={rules.min_party_size || 1} onChange={(e) => setRules({ ...rules, min_party_size: Number(e.target.value) })} />
              </FormField>
              <FormField label="Max Kisi Sayisi">
                <Input type="number" value={rules.max_party_size || 20} onChange={(e) => setRules({ ...rules, max_party_size: Number(e.target.value) })} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Grup Sorgu Esigi">
                <Input type="number" value={rules.group_inquiry_threshold || 8} onChange={(e) => setRules({ ...rules, group_inquiry_threshold: Number(e.target.value) })} />
              </FormField>
              <FormField label="Lead Time (saat)">
                <Input type="number" value={rules.lead_time_hours || 2} onChange={(e) => setRules({ ...rules, lead_time_hours: Number(e.target.value) })} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Max Gun Ileride">
                <Input type="number" value={rules.max_days_ahead || 30} onChange={(e) => setRules({ ...rules, max_days_ahead: Number(e.target.value) })} />
              </FormField>
              <div className="pt-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!rules.auto_confirm} onChange={(e) => setRules({ ...rules, auto_confirm: e.target.checked })} className="rounded" />
                  Otomatik Onayla
                </label>
              </div>
            </div>
            <Button variant="primary" onClick={() => saveHoursAction('update_rules', {
              slot_duration_minutes: rules.slot_duration_minutes,
              default_slot_capacity: rules.default_slot_capacity,
              min_party_size: rules.min_party_size,
              max_party_size: rules.max_party_size,
              group_inquiry_threshold: rules.group_inquiry_threshold,
              lead_time_hours: rules.lead_time_hours,
              max_days_ahead: rules.max_days_ahead,
              auto_confirm: rules.auto_confirm,
            })} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Special Date Modal */}
      {showSpecialForm && (
        <Modal open={true} onClose={() => setShowSpecialForm(false)} title="Ozel Gun Ekle">
          <div className="space-y-4">
            <FormField label="Tarih" required>
              <Input type="date" value={sdDate} onChange={(e) => setSdDate(e.target.value)} />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sdClosed} onChange={(e) => setSdClosed(e.target.checked)} className="rounded" />
              Kapali
            </label>
            {!sdClosed && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Acilis">
                  <Input type="time" value={sdOpen} onChange={(e) => setSdOpen(e.target.value)} />
                </FormField>
                <FormField label="Kapanis">
                  <Input type="time" value={sdClose} onChange={(e) => setSdClose(e.target.value)} />
                </FormField>
              </div>
            )}
            <FormField label="Sebep">
              <Input value={sdReason} onChange={(e) => setSdReason(e.target.value)} placeholder="Bayram, bakım vb." />
            </FormField>
            <Button variant="primary" className="w-full" onClick={addSpecialDate} disabled={saving || !sdDate}>
              {saving ? 'Kaydediliyor...' : 'Ekle'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Blocked Slot Modal */}
      {showBlockedForm && (
        <Modal open={true} onClose={() => setShowBlockedForm(false)} title="Bloklu Slot Ekle">
          <div className="space-y-4">
            <FormField label="Tarih" required>
              <Input type="date" value={bsDate} onChange={(e) => setBsDate(e.target.value)} />
            </FormField>
            <FormField label="Tur">
              <Select
                value={bsType}
                onChange={(e) => setBsType(e.target.value)}
                options={[
                  { value: 'full_day', label: 'Tam Gun' },
                  { value: 'time_range', label: 'Zaman Araligi' },
                  { value: 'reduced_capacity', label: 'Dusuk Kapasite' },
                ]}
              />
            </FormField>
            {bsType === 'time_range' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Baslangic">
                  <Input type="time" value={bsStart} onChange={(e) => setBsStart(e.target.value)} />
                </FormField>
                <FormField label="Bitis">
                  <Input type="time" value={bsEnd} onChange={(e) => setBsEnd(e.target.value)} />
                </FormField>
              </div>
            )}
            <FormField label="Sebep">
              <Input value={bsReason} onChange={(e) => setBsReason(e.target.value)} />
            </FormField>
            <Button variant="primary" className="w-full" onClick={addBlockedSlot} disabled={saving || !bsDate}>
              {saving ? 'Kaydediliyor...' : 'Ekle'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
