'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import type { EventInquiry } from '@/types'

const statusLabels: Record<string, string> = {
  new: 'Yeni', contacted: 'İletişime Geçildi', confirmed: 'Onaylandı',
  completed: 'Tamamlandı', declined: 'Reddedildi',
}
const statusVariants: Record<string, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
  new: 'warning', contacted: 'info', confirmed: 'success',
  completed: 'success', declined: 'error',
}
const eventTypeLabels: Record<string, string> = {
  birthday: 'Doğum Günü', corporate: 'Kurumsal', wedding: 'Düğün',
  private_dining: 'Özel Yemek', group: 'Grup', other: 'Diğer',
}

export default function AdminEventsPage() {
  const [inquiries, setInquiries] = useState<EventInquiry[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EventInquiry | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/events?limit=50')
      if (res.ok) {
        const data = await res.json()
        setInquiries(data.data || [])
        setCount(data.count || 0)
      }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openDetail(item: EventInquiry) {
    setSelected(item)
    setNewStatus(item.status)
    setAdminNotes(item.admin_notes || '')
    setShowModal(true)
  }

  async function handleUpdate() {
    if (!selected) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/events/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, admin_notes: adminNotes }),
      })
      if (res.ok) {
        setShowModal(false)
        load()
      }
    } catch {} finally { setUpdating(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-section-heading text-charcoal-900">Etkinlik Talepleri</h1>
        <p className="text-body text-charcoal-500 mt-1">Toplam: {count}</p>
      </div>

      {loading ? <Loading /> : inquiries.length === 0 ? (
        <EmptyState title="Etkinlik talebi bulunamadı." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-charcoal-100 text-left bg-charcoal-50/50">
                    <th className="p-3 font-medium text-charcoal-500">İsim</th>
                    <th className="p-3 font-medium text-charcoal-500">Tür</th>
                    <th className="p-3 font-medium text-charcoal-500">Kişi</th>
                    <th className="p-3 font-medium text-charcoal-500">Tarih Tercihi</th>
                    <th className="p-3 font-medium text-charcoal-500">Durum</th>
                    <th className="p-3 font-medium text-charcoal-500">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((item) => (
                    <tr key={item.id} className="border-b border-charcoal-50 hover:bg-charcoal-50/30">
                      <td className="p-3 text-charcoal-900 font-medium">{item.guest_name}</td>
                      <td className="p-3 text-charcoal-600">{eventTypeLabels[item.event_type] || item.event_type}</td>
                      <td className="p-3 text-charcoal-600">{item.estimated_guests}</td>
                      <td className="p-3 text-charcoal-600">{item.preferred_date || '—'}</td>
                      <td className="p-3">
                        <Badge variant={statusVariants[item.status] || 'default'}>
                          {statusLabels[item.status] || item.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(item)}>Detay</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {showModal && selected && (
        <Modal title="Etkinlik Talebi Detayı" open={showModal} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-charcoal-500">İsim:</span> <strong>{selected.guest_name}</strong></div>
              <div><span className="text-charcoal-500">Telefon:</span> {selected.guest_phone}</div>
              <div><span className="text-charcoal-500">E-posta:</span> {selected.guest_email}</div>
              <div><span className="text-charcoal-500">Tür:</span> {eventTypeLabels[selected.event_type]}</div>
              <div><span className="text-charcoal-500">Kişi:</span> {selected.estimated_guests}</div>
              <div><span className="text-charcoal-500">Tarih:</span> {selected.preferred_date || '—'}</div>
            </div>
            {selected.message && (
              <div className="text-sm">
                <span className="text-charcoal-500">Mesaj:</span>
                <p className="mt-1 text-charcoal-700 whitespace-pre-line">{selected.message}</p>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-charcoal-700">Durum</label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                options={Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-charcoal-700">Admin Notları</label>
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} />
            </div>
            <Button variant="primary" onClick={handleUpdate} disabled={updating} className="w-full">
              {updating ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
