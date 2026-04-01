'use client'

import { useState } from 'react'
import { useTenant } from '@/lib/tenant'
import { Container } from '@/components/ui/container'
import { Section, SectionHeader } from '@/components/ui/section'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'

const EVENT_TYPES = [
  { value: 'birthday', label: 'Doğum Günü' },
  { value: 'corporate', label: 'Kurumsal Etkinlik' },
  { value: 'wedding', label: 'Düğün / Nişan' },
  { value: 'private_dining', label: 'Özel Yemek' },
  { value: 'group', label: 'Grup Rezervasyonu' },
  { value: 'other', label: 'Diğer' },
]

export default function EventsPage() {
  useTenant()
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
    <Section className="bg-brand-surface pt-24">
      <Container size="narrow">
        <SectionHeader
          title="Özel Etkinlik Talebi"
          subtitle="Doğum günleri, kurumsal etkinlikler, özel yemekler ve daha fazlası"
        />

        <Card>
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
      </Container>
    </Section>
  )
}
