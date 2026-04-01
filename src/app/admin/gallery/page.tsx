'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { FormField } from '@/components/ui/form-field'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import type { GalleryItem } from '@/types'

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form state
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [altText, setAltText] = useState('')
  const [isCover, setIsCover] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/gallery')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openForm(item?: GalleryItem) {
    setEditing(item ?? null)
    setImageUrl(item?.image_url || '')
    setCaption(item?.caption || '')
    setAltText(item?.alt_text || '')
    setIsCover(item?.is_cover ?? false)
    setIsVisible(item?.is_visible ?? true)
    setSortOrder(item?.sort_order || 0)
    setShowForm(true)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const data = await res.json()
        setImageUrl(data.url)
        if (!altText) setAltText(file.name.replace(/\.[^.]+$/, ''))
      }
    } catch {} finally { setUploading(false) }
  }

  async function save() {
    setSaving(true)
    try {
      const payload = {
        image_url: imageUrl,
        caption: caption || null,
        alt_text: altText,
        is_cover: isCover,
        is_visible: isVisible,
        sort_order: sortOrder,
      }
      if (editing) {
        await fetch('/api/admin/gallery', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...payload }),
        })
      } else {
        await fetch('/api/admin/gallery', {
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
    await fetch('/api/admin/gallery', {
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
        <h1 className="text-section-heading text-charcoal-900">Galeri Yonetimi</h1>
        <Button variant="primary" onClick={() => openForm()}>Gorsel Ekle</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Henuz gorsel yok." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="relative aspect-square bg-charcoal-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image_url} alt={item.alt_text} className="w-full h-full object-cover" />
                {item.is_cover && (
                  <Badge variant="warning" className="absolute top-2 left-2">Kapak</Badge>
                )}
                {!item.is_visible && (
                  <Badge variant="default" className="absolute top-2 right-2">Gizli</Badge>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openForm(item)}>Duzenle</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleDelete(item.id)}>Sil</Button>
                  </div>
                </div>
              </div>
              {item.caption && (
                <CardContent className="p-2">
                  <p className="text-xs text-charcoal-600 truncate">{item.caption}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Modal open={true} onClose={() => setShowForm(false)} title={editing ? 'Gorsel Duzenle' : 'Yeni Gorsel'}>
          <div className="space-y-4">
            <FormField label="Gorsel URL" required>
              <div className="flex gap-2">
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="flex-1" />
                <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Yukleniyor...' : 'Yukle'}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
            </FormField>
            {imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={imageUrl} alt="Onizleme" className="w-full h-32 object-cover rounded" />
            )}
            <FormField label="Alt Metin" required>
              <Input value={altText} onChange={(e) => setAltText(e.target.value)} />
            </FormField>
            <FormField label="Aciklama">
              <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Sira">
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
              </FormField>
              <div className="flex flex-col gap-2 pt-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isCover} onChange={(e) => setIsCover(e.target.checked)} className="rounded" />
                  Kapak Gorseli
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} className="rounded" />
                  Gorunur
                </label>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={save} disabled={saving || !imageUrl || !altText}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
