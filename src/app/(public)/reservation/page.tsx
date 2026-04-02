'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useTenant } from '@/lib/tenant'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loading } from '@/components/ui/loading'
import { FormField } from '@/components/ui/form-field'
import type { DayAvailability, TimeSlot } from '@/types'
import { toISODateString } from '@/lib/utils'
import { CalendarCheck, Clock, Users, CheckCircle } from 'lucide-react'

type BookingStep = 'date' | 'slot' | 'form' | 'confirm'

export default function ReservationPage() {
  const tenant = useTenant()
  const businessName = tenant.tenant.name

  // Booking state
  const [step, setStep] = useState<BookingStep>('date')
  const [selectedDate, setSelectedDate] = useState('')
  const [availability, setAvailability] = useState<DayAvailability | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Rules from server
  const [rules, setRules] = useState({
    max_days_ahead: 30,
    min_party_size: 1,
    max_party_size: 50,
    group_inquiry_threshold: 8,
    auto_confirm: false,
  })

  // Form state
  const [form, setForm] = useState({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    party_size: 2,
    special_requests: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string; id?: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  // Minimum date: today; maximum: today + max_days_ahead
  const today = toISODateString(new Date())
  const maxDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + rules.max_days_ahead)
    return toISODateString(d)
  })()

  const fetchAvailability = useCallback(async (date: string) => {
    setLoadingSlots(true)
    setAvailability(null)
    setSelectedSlot(null)
    try {
      const res = await fetch(`/api/reservations/availability?date=${date}`)
      const data = await res.json()
      setAvailability(data as DayAvailability)
      if (data.rules) {
        setRules(data.rules)
      }
    } catch {
      setAvailability(null)
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  function handleDateSelect(date: string) {
    setSelectedDate(date)
    setStep('slot')
    fetchAvailability(date)
  }

  function handleSlotSelect(slot: TimeSlot) {
    setSelectedSlot(slot)
    setStep('form')
    setErrors({})
    setResult(null)
  }

  function update(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) return

    setSubmitting(true)
    setResult(null)
    setErrors({})

    try {
      const body = {
        guest_name: form.guest_name,
        guest_phone: form.guest_phone,
        guest_email: form.guest_email,
        party_size: Number(form.party_size),
        reservation_date: selectedDate,
        reservation_time: selectedSlot.time,
        special_requests: form.special_requests || null,
      }

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          ok: true,
          message: 'Rezervasyonunuz başarıyla oluşturuldu!',
          id: data.id,
        })
        setStep('confirm')
      } else if (data.code === 'GROUP_REDIRECT') {
        setResult({ ok: false, message: data.error })
      } else if (data.details) {
        setErrors(data.details)
      } else {
        setResult({ ok: false, message: data.error || 'Bir hata oluştu.' })
      }
    } catch {
      setResult({ ok: false, message: 'Bağlantı hatası.' })
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep('date')
    setSelectedDate('')
    setAvailability(null)
    setSelectedSlot(null)
    setForm({ guest_name: '', guest_phone: '', guest_email: '', party_size: 2, special_requests: '' })
    setResult(null)
    setErrors({})
  }

  // Format date for display  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <>
      <section className="bg-brand-gradient text-white pt-28 pb-12">
        <Container className="text-center">
          <h1 className="text-heading text-white mb-3">Rezervasyon</h1>
          <p className="text-body-lg text-white/70 max-w-xl mx-auto">{businessName}&apos;da yerinizi ayırtın</p>
          <div className="gold-divider mt-6" />
        </Container>
      </section>

      <Section className="bg-brand-gradient-subtle">
        <Container size="narrow">

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-10" role="navigation" aria-label="Rezervasyon adımları">
          {(['date', 'slot', 'form', 'confirm'] as BookingStep[]).map((s, i) => {
            const labels = ['Tarih Seçin', 'Saat Seçin', 'Bilgileriniz', 'Onay']
            const icons = [CalendarCheck, Clock, Users, CheckCircle]
            const Icon = icons[i]
            const isActive = s === step
            const isPast = ['date', 'slot', 'form', 'confirm'].indexOf(s) < ['date', 'slot', 'form', 'confirm'].indexOf(step)
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-110'
                      : isPast
                        ? 'bg-brand-primary/20 text-brand-primary'
                        : 'bg-brand-surface text-brand-text-muted border border-brand-primary/10'
                  }`}>
                    {isPast ? <CheckCircle size={18} /> : <Icon size={18} />}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${isActive ? 'text-brand-primary font-semibold' : 'text-brand-text-muted'}`}>
                    {labels[i]}
                  </span>
                </div>
                {i < 3 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 mb-5 rounded-full transition-colors ${isPast ? 'bg-brand-primary/30' : 'bg-brand-surface-alt'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* STEP 1: Date Selection */}
        {step === 'date' && (
          <Card className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <CalendarCheck size={24} className="text-brand-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-brand-text">Tarih Seçin</h3>
              <p className="text-sm text-brand-text-muted mt-1">Ziyaret etmek istediğiniz tarihi seçin</p>
            </div>
            <FormField label="Rezervasyon Tarihi">
              <Input
                type="date"
                min={today}
                max={maxDate}
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                className="text-center text-lg"
              />
            </FormField>
          </Card>
        )}

        {/* STEP 2: Slot Selection */}
        {step === 'slot' && (
          <Card className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Clock size={18} className="text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-brand-text">Saat Seçin</h3>
                  <p className="text-xs text-brand-text-muted">{formatDate(selectedDate)}</p>
                </div>
              </div>
              <button onClick={() => setStep('date')} className="text-sm text-brand-primary hover:underline font-medium">
                Değiştir
              </button>
            </div>

            {loadingSlots ? (
              <Loading />
            ) : !availability ? (
              <p className="text-sm text-brand-text-muted">Müsaitlik bilgisi yüklenemedi.</p>
            ) : !availability.is_open ? (
              <div className="text-center py-6">
                <p className="text-brand-text-muted">{availability.reason || 'Bu gün kapalıyız.'}</p>
                <Button variant="secondary" className="mt-4" onClick={() => setStep('date')}>
                  Başka Tarih Seçin
                </Button>
              </div>
            ) : availability.slots.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-brand-text-muted">Bu tarihte müsait saat bulunamadı.</p>
                <Button variant="secondary" className="mt-4" onClick={() => setStep('date')}>
                  Başka Tarih Seçin
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                {availability.slots.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => handleSlotSelect(slot)}
                    className={`p-3 rounded-card text-sm font-medium border-2 transition-all duration-200 ${
                      slot.available
                        ? 'border-brand-primary/10 hover:border-brand-primary hover:bg-brand-primary/5 text-brand-text cursor-pointer hover:shadow-card'
                        : 'border-brand-surface bg-brand-surface text-brand-text-muted/50 cursor-not-allowed line-through'
                    } ${selectedSlot?.time === slot.time ? 'border-brand-primary bg-brand-primary/10 ring-2 ring-brand-primary/20 shadow-card' : ''}`}
                    aria-label={`${slot.time} - ${slot.available ? `${slot.remaining} kişilik yer var` : 'Dolu'}`}
                  >
                    <div className="font-semibold">{slot.time}</div>
                    <div className="text-[10px] mt-1">
                      {slot.available ? (
                        <span className="text-green-600 font-medium">{slot.remaining} kişi müsait</span>
                      ) : (
                        <span className="text-red-400">Dolu</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* STEP 3: Guest Form */}
        {step === 'form' && selectedSlot && (
          <Card className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Users size={18} className="text-brand-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-brand-text">Bilgileriniz</h3>
              </div>
              <button onClick={() => setStep('slot')} className="text-sm text-brand-primary hover:underline font-medium">
                Saati Değiştir
              </button>
            </div>

            {/* Selected summary */}
            <div className="flex gap-3 mb-6 p-4 bg-brand-gradient-subtle rounded-card border border-brand-primary/10">
              <div className="flex items-center gap-2">
                <CalendarCheck size={14} className="text-brand-primary" />
                <span className="text-sm font-medium text-brand-text">{formatDate(selectedDate)}</span>
              </div>
              <div className="w-px bg-brand-primary/20" />
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-brand-primary" />
                <span className="text-sm font-medium text-brand-text">{selectedSlot.time}</span>
              </div>
            </div>

            {result && !result.ok && (
              <div className="mb-4 p-3 rounded-card text-sm bg-red-50 text-red-700 border border-red-200">
                {result.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Ad Soyad" required error={errors.guest_name?.[0]}>
                <Input
                  value={form.guest_name}
                  onChange={(e) => update('guest_name', e.target.value)}
                  required
                  minLength={2}
                  error={!!errors.guest_name}
                />
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Telefon" required error={errors.guest_phone?.[0]}>
                  <Input
                    value={form.guest_phone}
                    onChange={(e) => update('guest_phone', e.target.value)}
                    required
                    placeholder="0532 000 0000"
                    error={!!errors.guest_phone}
                  />
                </FormField>
                <FormField label="E-posta" required error={errors.guest_email?.[0]}>
                  <Input
                    type="email"
                    value={form.guest_email}
                    onChange={(e) => update('guest_email', e.target.value)}
                    required
                    error={!!errors.guest_email}
                  />
                </FormField>
              </div>
              <FormField label="Kişi Sayısı" required error={errors.party_size?.[0]}>
                <Input
                  type="number"
                  min={rules.min_party_size}
                  max={rules.max_party_size}
                  value={form.party_size}
                  onChange={(e) => update('party_size', Number(e.target.value))}
                  required
                  error={!!errors.party_size}
                />
              </FormField>
              {form.party_size >= rules.group_inquiry_threshold && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                  {rules.group_inquiry_threshold}+ kişilik rezervasyonlar için lütfen{' '}
                  <a href="/events" className="underline font-medium">etkinlik talebi</a> oluşturun.
                </div>
              )}
              <FormField label="Özel İstekler">
                <Textarea
                  value={form.special_requests}
                  onChange={(e) => update('special_requests', e.target.value)}
                  rows={3}
                  placeholder="Alerjiler, özel tarih, tercih edilen masa vb."
                />
              </FormField>
              <Button type="submit" variant="cta" className="w-full" disabled={submitting}>
                {submitting ? 'Oluşturuluyor...' : 'Rezervasyonu Tamamla'}
              </Button>
            </form>
          </Card>
        )}

        {/* STEP 4: Confirmation */}
        {step === 'confirm' && result?.ok && (
          <Card className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-brand-text mb-2">
              Rezervasyonunuz Alındı!
            </h3>
            <p className="text-sm text-brand-text-muted mb-6">
              {businessName} sizi ağırlamaktan mutluluk duyacak.
            </p>

            <div className="bg-brand-gradient-subtle rounded-card p-5 mb-6 text-left space-y-3 border border-brand-primary/10">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted flex items-center gap-2"><CalendarCheck size={14} /> Tarih</span>
                <span className="font-semibold text-brand-text">{formatDate(selectedDate)}</span>
              </div>
              <div className="h-px bg-brand-primary/5" />
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted flex items-center gap-2"><Clock size={14} /> Saat</span>
                <span className="font-semibold text-brand-text">{selectedSlot?.time}</span>
              </div>
              <div className="h-px bg-brand-primary/5" />
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted flex items-center gap-2"><Users size={14} /> Kişi Sayısı</span>
                <span className="font-semibold text-brand-text">{form.party_size}</span>
              </div>
              <div className="h-px bg-brand-primary/5" />
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">Ad Soyad</span>
                <span className="font-semibold text-brand-text">{form.guest_name}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="primary" onClick={reset}>
                Yeni Rezervasyon Yap
              </Button>
              <Link href="/" className="text-sm text-brand-text-muted hover:text-brand-primary transition-colors">
                Ana Sayfaya Dön
              </Link>
            </div>
          </Card>
        )}
      </Container>
    </Section>
    </>
  )
}
