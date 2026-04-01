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
import { slugify } from '@/lib/utils'
import type { Campaign } from '@/types'

export default function AdminCampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/campaigns')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openForm(item?: Campaign) {
    setEditing(item ?? null)
    setTitle(item?.title || '')
    setSlug(item?.slug || '')
    setDescription(item?.description || '')
    setContent(item?.content || '')
    setImageUrl(item?.image_url || '')
    setStartDate(item?.start_date || '')
    setEndDate(item?.end_date || '')
    setIsActive(item?.is_active ?? true)
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    try {
      const payload = {
        title,
        slug: slug || slugify(title),
        description: description || null,
        content: content || null,
        image_url: imageUrl || null,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: isActive,
      }
      if (editing) {
        await fetch('/api/admin/campaigns', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...payload }),
        })
      } else {
        await fetch('/api/admin/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setShowForm(false)
      load()
    } catch {} finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Silmek istediginize emin misiniz?')) return
    await fetch('/api/admin/campaigns', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-section-heading text-charcoal-900">Kampanyalar</h1>
        <Button variant="primary" onClick={() => openForm()}>Kampanya Ekle</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Henuz kampanya yok." />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-charcoal-900">{item.title}</h3>
                      {item.is_active ? <Badge variant="success">Aktif</Badge> : <Badge variant="default">Pasif</Badge>}
                    </div>
                    {item.description && <p className="text-sm text-charcoal-600 line-clamp-2">{item.description}</p>}
                    <div className="flex gap-3 mt-2 text-xs text-charcoal-400">
                      {item.start_date && <span>Baslangic: {item.start_date}</span>}
                      {item.end_date && <span>Bitis: {item.end_date}</span>}
                    </div>
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
        <Modal open={true} onClose={() => setShowForm(false)} title={editing ? 'Kampanya Duzenle' : 'Yeni Kampanya'} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Baslik" required>
                <Input value={title} onChange={(e) => { setTitle(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }} />
              </FormField>
              <FormField label="Slug">
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Kisa Aciklama">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </FormField>
            <FormField label="Icerik">
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
            </FormField>
            <FormField label="Gorsel URL">
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Baslangic Tarihi">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </FormField>
              <FormField label="Bitis Tarihi">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </FormField>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
              Aktif
            </label>
            <Button variant="primary" className="w-full" onClick={save} disabled={saving || !title}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
