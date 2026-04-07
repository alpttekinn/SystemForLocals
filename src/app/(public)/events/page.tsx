'use client'

import { useState } from 'react'
import { useTenant } from '@/lib/tenant'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { Cake, Briefcase, Heart, Utensils, Users, HelpCircle, CheckCircle, Phone } from 'lucide-react'
import { useReveal } from '@/hooks/use-reveal'
import { useTrack } from '@/hooks/use-track'

const EVENT_TYPES = [
  { value: 'birthday', label: 'Doğum Günü' },
  { value: 'corporate', label: 'Kurumsal Etkinlik' },
  { value: 'wedding', label: 'Düğün / Nişan' },
  { value: 'private_dining', label: 'Özel Yemek' },
  { value: 'group', label: 'Grup Rezervasyonu' },
  { value: 'other', label: 'Diğer' },
]

const EVENT_SHOWCASES = [
  { icon: Cake, title: 'Doğum Günü', desc: 'Özel süsleme, pasta organizasyonu ve eğlenceli bir kutlama ortamı sunuyoruz.', color: 'text-pink-500', bg: 'bg-pink-50' },
  { icon: Briefcase, title: 'Kurumsal Etkinlik', desc: 'Firma toplantıları, lansman ve iş yemekleri için profesyonel alan.', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Heart, title: 'Düğün / Nişan', desc: 'Romantik ve zarif bir atmosferde unutulmaz anlar yaratın.', color: 'text-red-500', bg: 'bg-red-50' },
  { icon: Utensils, title: 'Özel Yemek', desc: 'Özel menü tasarımı ile VIP yemek deneyimi.', color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: Users, title: 'Grup Rezervasyonu', desc: 'Büyük gruplar için özel alan ve menü seçenekleri.', color: 'text-green-600', bg: 'bg-green-50' },
  { icon: HelpCircle, title: 'Diğer', desc: 'Farklı bir etkinlik planınız mı var? Bize yazın, birlikte planlayalım.', color: 'text-purple-500', bg: 'bg-purple-50' },
]

export default function EventsPage() {
  const tenant = useTenant()
  const { contact } = tenant
  const [form, setForm] = useState({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    event_type: 'birthday',
    estimated_guests: 10,
    preferred_date: '',
    preferred_time: '',
    alternative_date: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  useReveal()
  const { track } = useTrack()

  function update(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)

    try {
      const body = {
        ...form,
        estimated_guests: Number(form.estimated_guests),
        preferred_date: form.preferred_date || null,
        preferred_time: form.preferred_time || null,
        alternative_date: form.alternative_date || null,
        message: form.message || null,
      }
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, message: 'Etkinlik talebiniz alındı! En kısa sürede sizinle iletişime geçeceğiz.' })
        track('event_inquiry_submit', { event_type: form.event_type })
        setForm({
          guest_name: '', guest_phone: '', guest_email: '',
          event_type: 'birthday', estimated_guests: 10,
          preferred_date: '', preferred_time: '', alternative_date: '', message: '',
        })
      } else {
        setResult({ ok: false, message: data.error || 'Bir hata oluştu.' })
      }
    } catch {
      setResult({ ok: false, message: 'Bağlantı hatası.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="bg-brand-gradient text-white pt-28 pb-12">
        <Container className="text-center">
          <h1 className="text-heading text-white mb-3">Özel Etkinlikler</h1>
          <p className="text-body-lg text-white/70 max-w-xl mx-auto">Doğum günleri, kurumsal etkinlikler, özel yemekler ve daha fazlası</p>
          <div className="gold-divider mt-6" />
        </Container>
      </section>

      {/* Event type showcases */}
      <Section className="bg-brand-gradient-subtle">
        <Container>
          <div className="text-center mb-8 reveal">
            <h2 className="text-section-title text-brand-text">Nasıl Bir Etkinlik Planlıyorsunuz?</h2>
            <p className="text-brand-text-muted mt-2">Mekanımız her türlü özel anınız için hazır.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto reveal-stagger">
            {EVENT_SHOWCASES.map((item) => (
              <Card key={item.title} className="group hover:-translate-y-1 transition-all duration-300 reveal">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon size={20} className={item.color} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-text text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-brand-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Trust banner */}
          <div className="mt-8 text-center reveal">
            <div className="inline-flex items-center gap-6 text-sm text-brand-text-muted">
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Ücretsiz keşif görüşmesi</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Özel menü tasarımı</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Profesyonel organizasyon</span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Form section */}
      <Section>
        <Container size="narrow">
          <div className="text-center mb-6 reveal">
            <h2 className="text-section-title text-brand-text">Etkinlik Talebi Oluşturun</h2>
            <p className="text-brand-text-muted mt-2">Formu doldurun, ekibimiz en kısa sürede sizinle iletişime geçsin.</p>
          </div>

          <Card className="reveal">
            {result && (
              <div className={`mb-4 p-3 rounded-card text-sm ${result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {result.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Ad Soyad" required>
                  <Input
                    value={form.guest_name}
                    onChange={(e) => update('guest_name', e.target.value)}
                    required
                    minLength={2}
                  />
                </FormField>
                <FormField label="Telefon" required>
                  <Input
                    value={form.guest_phone}
                    onChange={(e) => update('guest_phone', e.target.value)}
                    required
                    placeholder="0532 000 0000"
                  />
                </FormField>
              </div>
              <FormField label="E-posta" required>
                <Input
                  type="email"
                  value={form.guest_email}
                  onChange={(e) => update('guest_email', e.target.value)}
                  required
                />
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Etkinlik Türü">
                  <Select
                    value={form.event_type}
                    onChange={(e) => update('event_type', e.target.value)}
                    options={EVENT_TYPES}
                  />
                </FormField>
                <FormField label="Tahmini Kişi Sayısı" required>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={form.estimated_guests}
                    onChange={(e) => update('estimated_guests', Number(e.target.value))}
                    required
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Tercih Edilen Tarih">
                  <Input
                    type="date"
                    value={form.preferred_date}
                    onChange={(e) => update('preferred_date', e.target.value)}
                  />
                </FormField>
                <FormField label="Tercih Edilen Saat">
                  <Input
                    type="time"
                    value={form.preferred_time}
                    onChange={(e) => update('preferred_time', e.target.value)}
                  />
                </FormField>
                <FormField label="Alternatif Tarih">
                  <Input
                    type="date"
                    value={form.alternative_date}
                    onChange={(e) => update('alternative_date', e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Notlar / Özel İstekler">
                <Textarea
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  rows={4}
                  placeholder="Etkinliğiniz hakkında detayları paylaşın..."
                />
              </FormField>
              <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                {submitting ? 'Gönderiliyor...' : 'Talep Gönder'}
              </Button>
            </form>
          </Card>

          {/* Quick contact */}
          {contact.phone && (
            <div className="text-center mt-6 reveal">
              <p className="text-sm text-brand-text-muted mb-2">Hızlı bilgi almak için bizi arayabilirsiniz:</p>
              <a
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 text-brand-primary font-semibold hover:underline"
              >
                <Phone size={16} />
                {contact.phone}
              </a>
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
