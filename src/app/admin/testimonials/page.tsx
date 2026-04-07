'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { FormField } from '@/components/ui/form-field'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import type { Testimonial } from '@/types'

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [saving, setSaving] = useState(false)

  const [reviewerName, setReviewerName] = useState('')
  const [quote, setQuote] = useState('')
  const [rating, setRating] = useState('')
  const [source, setSource] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublished, setIsPublished] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)
  const { addToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/testimonials')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch {
      addToast('Yorumlar yüklenemedi', 'error')
    } finally { setLoading(false) }
  }, [addToast])

  useEffect(() => { load() }, [load])

  function openForm(item?: Testimonial) {
    setEditing(item ?? null)
    setReviewerName(item?.reviewer_name || '')
    setQuote(item?.quote || '')
    setRating(item?.rating != null ? String(item.rating) : '')
    setSource(item?.source || '')
    setIsFeatured(item?.is_featured ?? false)
    setIsPublished(item?.is_published ?? true)
    setSortOrder(item?.sort_order || 0)
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    try {
      const payload = {
        reviewer_name: reviewerName,
        quote,
        rating: rating ? Number(rating) : null,
        source: source || null,
        is_featured: isFeatured,
        is_published: isPublished,
        sort_order: sortOrder,
      }
      const method = editing ? 'PATCH' : 'POST'
      const body = editing ? { id: editing.id, ...payload } : payload
      const res = await fetch('/api/admin/testimonials', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { addToast('Kayıt başarısız', 'error'); return }
      addToast('Yorum kaydedildi', 'success')
      setShowForm(false)
      load()
    } catch { addToast('Bağlantı hatası', 'error') } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) { addToast('Silme başarısız', 'error'); return }
      addToast('Yorum silindi', 'success')
      load()
    } catch { addToast('Bağlantı hatası', 'error') }
  }

  function renderStars(r: number | null) {
    if (r == null) return null
    return (
      <span className="text-amber-500">
        {'★'.repeat(r)}{'☆'.repeat(5 - r)}
      </span>
    )
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-section-heading text-charcoal-900">Yorumlar</h1>
        <Button variant="primary" onClick={() => openForm()}>Yorum Ekle</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Henuz yorum yok." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-charcoal-900">{item.reviewer_name}</span>
                    {item.source && <span className="text-xs text-charcoal-400 ml-2">({item.source})</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {item.is_featured && <Badge variant="warning">One Cikan</Badge>}
                    {!item.is_published && <Badge variant="default">Taslak</Badge>}
                  </div>
                </div>
                {item.rating != null && <div className="mb-2 text-sm">{renderStars(item.rating)}</div>}
                <p className="text-sm text-charcoal-600 line-clamp-3 italic">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex gap-1 mt-3">
                  <Button variant="ghost" size="sm" onClick={() => openForm(item)}>Duzenle</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>Sil</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Modal open={true} onClose={() => setShowForm(false)} title={editing ? 'Yorum Duzenle' : 'Yeni Yorum'}>
          <div className="space-y-4">
            <FormField label="Isim" required>
              <Input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} />
            </FormField>
            <FormField label="Yorum" required>
              <Textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={3} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Puan (1-5)">
                <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(e.target.value)} />
              </FormField>
              <FormField label="Kaynak">
                <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Google, Instagram..." />
              </FormField>
            </div>
            <FormField label="Sira">
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
            </FormField>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="rounded" />
                Yayinda
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded" />
                One Cikan
              </label>
            </div>
            <Button variant="primary" className="w-full" onClick={save} disabled={saving || !reviewerName || !quote}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
