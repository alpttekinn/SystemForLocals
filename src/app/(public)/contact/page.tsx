'use client'

import { useState } from 'react'
import { useTenant } from '@/lib/tenant'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { MapPin, Phone, Mail, MessageCircle, Navigation, Clock, Instagram } from 'lucide-react'
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

  // Build quick action cards
  const quickActions = [
    contact.phone && {
      icon: Phone,
      label: 'Hemen Arayın',
      detail: contact.phone,
      href: `tel:${contact.phone.replace(/\s/g, '')}`,
      color: 'bg-green-50 text-green-700',
      iconColor: 'text-green-600',
    },
    contact.whatsapp && {
      icon: MessageCircle,
      label: 'WhatsApp',
      detail: 'Mesaj gönderin',
      href: `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`,
      target: '_blank',
      color: 'bg-emerald-50 text-emerald-700',
      iconColor: 'text-emerald-600',
    },
    contact.maps_url && {
      icon: Navigation,
      label: 'Yol Tarifi',
      detail: 'Google Maps ile açın',
      href: contact.maps_url,
      target: '_blank',
      color: 'bg-blue-50 text-blue-700',
      iconColor: 'text-blue-600',
    },
    contact.email && {
      icon: Mail,
      label: 'E-posta',
      detail: contact.email,
      href: `mailto:${contact.email}`,
      color: 'bg-purple-50 text-purple-700',
      iconColor: 'text-purple-600',
    },
  ].filter(Boolean) as { icon: typeof Phone; label: string; detail: string; href: string; target?: string; color: string; iconColor: string }[]

  return (
    <>
      {/* Hero banner */}
      <section className="bg-brand-gradient text-white pt-28 pb-12">
        <Container className="text-center">
          <h1 className="text-heading text-white mb-3">İletişim</h1>
          <p className="text-body-lg text-white/70 max-w-xl mx-auto">Bize ulaşın, sorularınızı yanıtlayalım</p>
          <div className="gold-divider mt-6" />
        </Container>
      </section>

      {/* Quick action cards */}
      {quickActions.length > 0 && (
        <Section compact className="bg-brand-surface -mt-6">
          <Container>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto reveal-stagger">
              {quickActions.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  target={action.target}
                  rel={action.target === '_blank' ? 'noopener noreferrer' : undefined}
                  className="flex flex-col items-center gap-2 p-4 rounded-card bg-white border border-brand-primary/5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 reveal"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${action.color}`}>
                    <action.icon size={20} className={action.iconColor} />
                  </div>
                  <span className="text-sm font-semibold text-brand-text">{action.label}</span>
                  <span className="text-[10px] text-brand-text-muted text-center line-clamp-1">{action.detail}</span>
                </a>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section className="bg-brand-gradient-subtle">
        <Container>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto reveal-stagger">
          {/* Contact Info */}
          <div className="space-y-6 reveal">
            <Card>
              <h3 className="font-serif text-lg font-semibold text-brand-text mb-4">Bizi Ziyaret Edin</h3>
              <div className="space-y-4">
                {contact.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-text">{contact.address}</p>
                      {contact.district && contact.city && (
                        <p className="text-xs text-brand-text-muted mt-0.5">{contact.district}, {contact.city}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text">Çalışma Saatleri</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">Her gün 09:00 - 23:00</p>
                  </div>
                </div>

                {contact.instagram_url && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                      <Instagram size={16} className="text-brand-primary" />
                    </div>
                    <div>
                      <a href={contact.instagram_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-text hover:text-brand-primary transition-colors">
                        Instagram&apos;da Takip Edin
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Map Embed */}
            {contact.maps_embed_url && (
              <div className="aspect-video rounded-card overflow-hidden border border-brand-primary/10 shadow-card">
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
            <h3 className="font-serif text-xl font-semibold text-brand-text mb-2">Mesaj Gönderin</h3>
            <p className="text-sm text-brand-text-muted mb-5">En kısa sürede size dönüş yapacağız.</p>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
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
                {submitting ? 'Gönderiliyor...' : 'Mesajı Gönder'}
              </Button>
            </form>
          </Card>
        </div>
      </Container>
    </Section>
    </>
  )
}
