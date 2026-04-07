'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { FormField } from '@/components/ui/form-field'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import type { FaqItem } from '@/types'

export default function AdminFaqPage() {
  const [items, setItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FaqItem | null>(null)
  const [saving, setSaving] = useState(false)

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const { addToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/faq')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch {
      addToast('SSS yüklenemedi', 'error')
    } finally { setLoading(false) }
  }, [addToast])

  useEffect(() => { load() }, [load])

  function openForm(item?: FaqItem) {
    setEditing(item ?? null)
    setQuestion(item?.question || '')
    setAnswer(item?.answer || '')
    setSortOrder(item?.sort_order || 0)
    setIsVisible(item?.is_visible ?? true)
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    try {
      const payload = { question, answer, sort_order: sortOrder, is_visible: isVisible }
      const method = editing ? 'PATCH' : 'POST'
      const body = editing ? { id: editing.id, ...payload } : payload
      const res = await fetch('/api/admin/faq', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { addToast('Kayıt başarısız', 'error'); return }
      addToast('Soru kaydedildi', 'success')
      setShowForm(false)
      load()
    } catch { addToast('Bağlantı hatası', 'error') } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch('/api/admin/faq', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) { addToast('Silme başarısız', 'error'); return }
      addToast('Silindi', 'success')
      load()
    } catch { addToast('Bağlantı hatası', 'error') }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-section-heading text-charcoal-900">SSS Yonetimi</h1>
        <Button variant="primary" onClick={() => openForm()}>Soru Ekle</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Henuz soru yok." />
      ) : (
        <div className="space-y-3">
          {items.sort((a, b) => a.sort_order - b.sort_order).map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-charcoal-900">{item.question}</h3>
                      {!item.is_visible && <Badge variant="default">Gizli</Badge>}
                    </div>
                    <p className="text-sm text-charcoal-600 line-clamp-2">{item.answer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openForm(item)}>Duzenle</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>Sil</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Modal open={true} onClose={() => setShowForm(false)} title={editing ? 'Soru Duzenle' : 'Yeni Soru'}>
          <div className="space-y-4">
            <FormField label="Soru" required>
              <Input value={question} onChange={(e) => setQuestion(e.target.value)} />
            </FormField>
            <FormField label="Cevap" required>
              <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Sira">
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
              </FormField>
              <div className="pt-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} className="rounded" />
                  Gorunur
                </label>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={save} disabled={saving || !question || !answer}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
