'use client'

import { useState, useCallback } from 'react'
import { useTenant } from '@/lib/tenant'
import { Container } from '@/components/ui/container'
import { Section, SectionHeader } from '@/components/ui/section'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { FormField } from '@/components/ui/form-field'
import type { DayAvailability, TimeSlot } from '@/types'
import { toISODateString } from '@/lib/utils'

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
    <Section className="bg-brand-surface pt-24">
      <Container size="narrow">
        <SectionHeader
          title="Rezervasyon"
          subtitle={`${businessName}'da yerinizi ayırtın`}
        />

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8" role="navigation" aria-label="Rezervasyon adımları">
          {(['date', 'slot', 'form', 'confirm'] as BookingStep[]).map((s, i) => {
            const labels = ['Tarih', 'Saat', 'Bilgiler', 'Onay']
            const isActive = s === step
            const isPast = ['date', 'slot', 'form', 'confirm'].indexOf(s) < ['date', 'slot', 'form', 'confirm'].indexOf(step)
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-primary text-white'
                    : isPast
                      ? 'bg-brand-primary/20 text-brand-primary'
                      : 'bg-charcoal-100 text-charcoal-400'
                }`}>
                  {isPast ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:inline ${isActive ? 'font-semibold text-charcoal-900' : 'text-charcoal-400'}`}>
                  {labels[i]}
                </span>
                {i < 3 && <div className="w-6 h-px bg-charcoal-200 hidden sm:block" />}
              </div>
            )
          })}
        </div>

        {/* STEP 1: Date Selection */}
        {step === 'date' && (
          <Card>
            <h3 className="font-serif text-lg font-semibold text-charcoal-900 mb-4">Tarih Seçin</h3>
            <FormField label="Rezervasyon Tarihi">
              <Input
                type="date"
                min={today}
                max={maxDate}
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
              />
            </FormField>
          </Card>
        )}

        {/* STEP 2: Slot Selection */}
        {step === 'slot' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-charcoal-900">
                Saat Seçin
              </h3>
              <button onClick={() => setStep('date')} className="text-sm text-brand-primary hover:underline">
                Tarihi Değiştir
              </button>
            </div>
            <p className="text-sm text-charcoal-500 mb-4">{formatDate(selectedDate)}</p>

            {loadingSlots ? (
              <Loading />
            ) : !availability ? (
              <p className="text-sm text-charcoal-500">Müsaitlik bilgisi yüklenemedi.</p>
            ) : !availability.is_open ? (
              <div className="text-center py-6">
                <p className="text-charcoal-500">{availability.reason || 'Bu gün kapalıyız.'}</p>
                <Button variant="secondary" className="mt-4" onClick={() => setStep('date')}>
                  Başka Tarih Seçin
                </Button>
              </div>
            ) : availability.slots.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-charcoal-500">Bu tarihte müsait saat bulunamadı.</p>
                <Button variant="secondary" className="mt-4" onClick={() => setStep('date')}>
                  Başka Tarih Seçin
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availability.slots.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => handleSlotSelect(slot)}
                    className={`p-3 rounded-card text-sm font-medium border transition-all ${
                      slot.available
                        ? 'border-brand-border hover:border-brand-primary hover:bg-brand-primary/5 text-charcoal-900 cursor-pointer'
                        : 'border-charcoal-100 bg-charcoal-50 text-charcoal-300 cursor-not-allowed'
                    } ${selectedSlot?.time === slot.time ? 'border-brand-primary bg-brand-primary/10 ring-2 ring-brand-primary/20' : ''}`}
                    aria-label={`${slot.time} - ${slot.available ? `${slot.remaining} kişilik yer var` : 'Dolu'}`}
                  >
                    <div>{slot.time}</div>
                    <div className="text-[10px] mt-0.5">
                      {slot.available ? (
                        <span className="text-green-600">{slot.remaining} kişi</span>
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
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-charcoal-900">Bilgileriniz</h3>
              <button onClick={() => setStep('slot')} className="text-sm text-brand-primary hover:underline">
                Saati Değiştir
              </button>
            </div>

            <div className="flex gap-3 mb-6 p-3 bg-brand-surface rounded-card">
              <Badge variant="info">{formatDate(selectedDate)}</Badge>
              <Badge variant="gold">{selectedSlot.time}</Badge>
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
          <Card className="text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-serif text-xl font-semibold text-charcoal-900 mb-2">
              Rezervasyonunuz Alındı!
            </h3>
            <p className="text-sm text-charcoal-600 mb-6">
              {businessName} sizi ağırlamaktan mutluluk duyacak.
            </p>

            <div className="bg-brand-surface rounded-card p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">Tarih:</span>
                <span className="font-medium text-charcoal-900">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">Saat:</span>
                <span className="font-medium text-charcoal-900">{selectedSlot?.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">Kişi:</span>
                <span className="font-medium text-charcoal-900">{form.party_size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">Ad Soyad:</span>
                <span className="font-medium text-charcoal-900">{form.guest_name}</span>
              </div>
            </div>

            <Button variant="secondary" onClick={reset}>
              Yeni Rezervasyon Yap
            </Button>
          </Card>
        )}
      </Container>
    </Section>
  )
}
