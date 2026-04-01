'use client'

import { useState } from 'react'
import { useTenant } from '@/lib/tenant'
import { Container } from '@/components/ui/container'
import { Section, SectionHeader } from '@/components/ui/section'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { MapPin, Phone, Mail } from 'lucide-react'
import { useReveal } from '@/hooks/use-reveal'

export default function ContactPage() {
  const tenant = useTenant()
  const { contact } = tenant
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  useReveal()

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, message: data.message || 'Mesajınız gönderildi!' })
        setForm({ name: '', email: '', phone: '', message: '' })
      } else {
        setResult({ ok: false, message: data.error || 'Bir hata oluştu.' })
      }
    } catch {
      setResult({ ok: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section className="bg-brand-surface pt-24">
      <Container>
        <SectionHeader
          title="İletişim"
          subtitle="Bize ulaşın, sorularınızı yanıtlayalım"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto reveal-stagger">
          {/* Contact Info */}
          <div className="space-y-6 reveal">
            {contact.address && (
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-brand-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-charcoal-900 text-sm">Adres</h3>
                  <p className="text-sm text-charcoal-600">{contact.address}</p>
                  {contact.district && contact.city && (
                    <p className="text-sm text-charcoal-500">{contact.district}, {contact.city}</p>
                  )}
                </div>
              </div>
            )}

            {contact.phone && (
              <div className="flex items-start gap-3">
                <Phone size={20} className="text-brand-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-charcoal-900 text-sm">Telefon</h3>
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-sm text-charcoal-600 hover:text-brand-primary transition-colors">
                    {contact.phone}
                  </a>
                  {contact.phone_secondary && (
                    <p className="text-sm text-charcoal-500">{contact.phone_secondary}</p>
                  )}
                </div>
              </div>
            )}

            {contact.email && (
              <div className="flex items-start gap-3">
                <Mail size={20} className="text-brand-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-charcoal-900 text-sm">E-posta</h3>
                  <a href={`mailto:${contact.email}`} className="text-sm text-charcoal-600 hover:text-brand-primary transition-colors">
                    {contact.email}
                  </a>
                </div>
              </div>
            )}

            {/* Map Embed */}
            {contact.maps_embed_url && (
              <div className="aspect-video rounded-card overflow-hidden border border-brand-border">
                <iframe
                  src={contact.maps_embed_url}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Harita"
                />
              </div>
            )}
          </div>

          {/* Contact Form */}
          <Card className="reveal">
            <h3 className="font-serif text-xl font-semibold text-charcoal-900 mb-4">Mesaj Gönderin</h3>

            {result && (
              <div className={`mb-4 p-3 rounded-card text-sm ${result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {result.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Ad Soyad" required>
                <Input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  minLength={2}
                />
              </FormField>
              <FormField label="E-posta" required>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Telefon">
                <Input
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="İsteğe bağlı"
                />
              </FormField>
              <FormField label="Mesajınız" required>
                <Textarea
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  required
                  minLength={10}
                  rows={5}
                />
              </FormField>
              <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                {submitting ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
            </form>
          </Card>
        </div>
      </Container>
    </Section>
  )
}
