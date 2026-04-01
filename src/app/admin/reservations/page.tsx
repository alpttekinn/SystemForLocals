'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import type { Reservation } from '@/types'

const STATUS_OPTIONS = [
  { value: '', label: 'Tüm Durumlar' },
  { value: 'pending', label: 'Bekliyor' },
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'rejected', label: 'Reddedildi' },
  { value: 'cancelled', label: 'İptal' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'no_show', label: 'Gelmedi' },
]

const STATUS_TRANSITIONS: Record<string, { value: string; label: string }[]> = {
  pending: [
    { value: 'confirmed', label: 'Onayla' },
    { value: 'rejected', label: 'Reddet' },
  ],
  confirmed: [
    { value: 'completed', label: 'Tamamlandı' },
    { value: 'no_show', label: 'Gelmedi' },
    { value: 'cancelled', label: 'İptal Et' },
  ],
}

const statusLabels: Record<string, string> = {
  pending: 'Bekliyor', confirmed: 'Onaylandı', rejected: 'Reddedildi',
  cancelled: 'İptal', completed: 'Tamamlandı', no_show: 'Gelmedi',
}
const statusVariants: Record<string, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
  pending: 'warning', confirmed: 'success', rejected: 'error',
  cancelled: 'error', completed: 'info', no_show: 'default',
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [statusNotes, setStatusNotes] = useState('')

  const loadReservations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterDate) params.set('date', filterDate)
      if (filterStatus) params.set('status', filterStatus)
      params.set('limit', '50')

      const res = await fetch(`/api/reservations?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReservations(data.data || [])
        setCount(data.count || 0)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterStatus])

  useEffect(() => { loadReservations() }, [loadReservations])

  async function updateStatus(newStatus: string) {
    if (!selectedRes) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/reservations/${selectedRes.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, admin_notes: statusNotes || undefined }),
      })
      if (res.ok) {
        setShowModal(false)
        setStatusNotes('')
        loadReservations()
      }
    } catch {
      // Fail silently
    } finally {
      setUpdating(false)
    }
  }

  function openDetails(r: Reservation) {
    setSelectedRes(r)
    setShowModal(true)
    setStatusNotes(r.admin_notes || '')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-section-heading text-charcoal-900">Rezervasyonlar</h1>
        <p className="text-body text-charcoal-500 mt-1">Toplam: {count}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-auto"
        />
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={STATUS_OPTIONS}
          className="w-auto"
        />
        <Button variant="secondary" onClick={() => { setFilterDate(''); setFilterStatus('') }}>
          Temizle
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : reservations.length === 0 ? (
        <EmptyState title="Rezervasyon bulunamadı." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-charcoal-100 text-left bg-charcoal-50/50">
                    <th className="p-3 font-medium text-charcoal-500">Misafir</th>
                    <th className="p-3 font-medium text-charcoal-500">Telefon</th>
                    <th className="p-3 font-medium text-charcoal-500">Tarih</th>
                    <th className="p-3 font-medium text-charcoal-500">Saat</th>
                    <th className="p-3 font-medium text-charcoal-500">Kişi</th>
                    <th className="p-3 font-medium text-charcoal-500">Durum</th>
                    <th className="p-3 font-medium text-charcoal-500">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} className="border-b border-charcoal-50 hover:bg-charcoal-50/30">
                      <td className="p-3 text-charcoal-900 font-medium">{r.guest_name}</td>
                      <td className="p-3 text-charcoal-600">{r.guest_phone}</td>
                      <td className="p-3 text-charcoal-600">{r.reservation_date}</td>
                      <td className="p-3 text-charcoal-600">{r.reservation_time?.slice(0, 5)}</td>
                      <td className="p-3 text-charcoal-600">{r.party_size}</td>
                      <td className="p-3">
                        <Badge variant={statusVariants[r.status] || 'default'}>
                          {statusLabels[r.status] || r.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" onClick={() => openDetails(r)}>
                          Detay
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail / Status Update Modal */}
      {showModal && selectedRes && (
        <Modal
          title="Rezervasyon Detayı"
          open={showModal}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-charcoal-500">Misafir:</span> <strong>{selectedRes.guest_name}</strong></div>
              <div><span className="text-charcoal-500">Telefon:</span> {selectedRes.guest_phone}</div>
              <div><span className="text-charcoal-500">E-posta:</span> {selectedRes.guest_email}</div>
              <div><span className="text-charcoal-500">Kişi:</span> {selectedRes.party_size}</div>
              <div><span className="text-charcoal-500">Tarih:</span> {selectedRes.reservation_date}</div>
              <div><span className="text-charcoal-500">Saat:</span> {selectedRes.reservation_time?.slice(0, 5)}</div>
            </div>

            {selectedRes.special_requests && (
              <div className="text-sm">
                <span className="text-charcoal-500">Özel İstekler:</span>
                <p className="mt-1 text-charcoal-700">{selectedRes.special_requests}</p>
              </div>
            )}

            <div className="text-sm">
              <span className="text-charcoal-500">Mevcut Durum:</span>{' '}
              <Badge variant={statusVariants[selectedRes.status] || 'default'}>
                {statusLabels[selectedRes.status] || selectedRes.status}
              </Badge>
            </div>

            <Textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              rows={2}
              placeholder="Admin notları (isteğe bağlı)..."
            />

            {/* Status transition buttons */}
            {STATUS_TRANSITIONS[selectedRes.status] && (
              <div className="flex flex-wrap gap-2">
                {STATUS_TRANSITIONS[selectedRes.status].map((t) => (
                  <Button
                    key={t.value}
                    variant={t.value === 'confirmed' ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={updating}
                    onClick={() => updateStatus(t.value)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
