'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { FormField } from '@/components/ui/form-field'
import { ImageUpload } from '@/components/ui/image-upload'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { Select } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import type { MenuCategory, MenuItem } from '@/types'

type EditMode = null | { type: 'category'; item?: MenuCategory } | { type: 'item'; item?: MenuItem }

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { addToast } = useToast()

  // Category form
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catSortOrder, setCatSortOrder] = useState(0)
  const [catVisible, setCatVisible] = useState(true)

  // Item form
  const [itemName, setItemName] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemCategoryId, setItemCategoryId] = useState('')
  const [itemImageUrl, setItemImageUrl] = useState('')
  const [itemSortOrder, setItemSortOrder] = useState(0)
  const [itemVisible, setItemVisible] = useState(true)
  const [itemFeatured, setItemFeatured] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/menu')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
        setItems(data.items || [])
      }
    } catch {
      addToast('Menü yüklenemedi', 'error')
    } finally { setLoading(false) }
  }, [addToast])

  useEffect(() => { load() }, [load])

  function openCategoryForm(cat?: MenuCategory) {
    setCatName(cat?.name || '')
    setCatSlug(cat?.slug || '')
    setCatSortOrder(cat?.sort_order || 0)
    setCatVisible(cat?.is_visible ?? true)
    setEditMode({ type: 'category', item: cat })
  }

  function openItemForm(item?: MenuItem) {
    setItemName(item?.name || '')
    setItemDesc(item?.description || '')
    setItemPrice(item ? String(item.price) : '')
    setItemCategoryId(item?.category_id || categories[0]?.id || '')
    setItemImageUrl(item?.image_url || '')
    setItemSortOrder(item?.sort_order || 0)
    setItemVisible(item?.is_visible ?? true)
    setItemFeatured(item?.is_featured ?? false)
    setEditMode({ type: 'item', item: item })
  }

  async function saveCategory() {
    setSaving(true)
    try {
      const payload = { name: catName, slug: catSlug, sort_order: catSortOrder, is_visible: catVisible }
      const method = editMode?.type === 'category' && editMode.item ? 'PATCH' : 'POST'
      const body = editMode?.type === 'category' && editMode.item
        ? { type: 'category', id: editMode.item.id, data: payload }
        : { type: 'category', data: payload }
      const res = await fetch('/api/admin/menu', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { addToast('Kategori kaydedilemedi', 'error'); return }
      addToast('Kategori kaydedildi', 'success')
      setEditMode(null)
      load()
    } catch { addToast('Bağlantı hatası', 'error') } finally { setSaving(false) }
  }

  async function saveItem() {
    setSaving(true)
    try {
      const payload = {
        name: itemName,
        description: itemDesc || null,
        price: parseFloat(itemPrice) || 0,
        category_id: itemCategoryId,
        image_url: itemImageUrl || null,
        sort_order: itemSortOrder,
        is_visible: itemVisible,
        is_featured: itemFeatured,
      }
      const method = editMode?.type === 'item' && editMode.item ? 'PATCH' : 'POST'
      const body = editMode?.type === 'item' && editMode.item
        ? { type: 'item', id: editMode.item.id, data: payload }
        : { type: 'item', data: payload }
      const res = await fetch('/api/admin/menu', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { addToast('Ürün kaydedilemedi', 'error'); return }
      addToast('Ürün kaydedildi', 'success')
      setEditMode(null)
      load()
    } catch { addToast('Bağlantı hatası', 'error') } finally { setSaving(false) }
  }

  async function handleDelete(type: 'category' | 'item', id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      })
      if (!res.ok) { addToast('Silme başarısız', 'error'); return }
      addToast('Silindi', 'success')
      load()
    } catch { addToast('Bağlantı hatası', 'error') } finally { setDeleting(null) }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-section-heading text-charcoal-900">Menu Yonetimi</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openCategoryForm()}>Kategori Ekle</Button>
          <Button variant="primary" onClick={() => openItemForm()}>Urun Ekle</Button>
        </div>
      </div>

      {/* Categories */}
      {categories.length === 0 ? (
        <EmptyState title="Henuz kategori yok." />
      ) : (
        categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          return (
            <Card key={cat.id}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal-100 bg-charcoal-50/50">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-charcoal-900">{cat.name}</h2>
                  {!cat.is_visible && <Badge variant="default">Gizli</Badge>}
                  <span className="text-xs text-charcoal-400">({catItems.length} urun)</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openCategoryForm(cat)}>Duzenle</Button>
                  <Button variant="ghost" size="sm" disabled={deleting === cat.id} onClick={() => handleDelete('category', cat.id)}>Sil</Button>
                </div>
              </div>
              <CardContent className="p-0">
                {catItems.length === 0 ? (
                  <p className="p-4 text-sm text-charcoal-400">Bu kategoride urun yok.</p>
                ) : (
                  <div className="divide-y divide-charcoal-50">
                    {catItems.sort((a, b) => a.sort_order - b.sort_order).map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-charcoal-900">{item.name}</span>
                            {item.is_featured && <Badge variant="warning">One Cikan</Badge>}
                            {!item.is_visible && <Badge variant="default">Gizli</Badge>}
                          </div>
                          {item.description && (
                            <p className="text-xs text-charcoal-500 truncate mt-0.5">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className="font-semibold text-charcoal-800">{formatPrice(item.price)}</span>
                          <Button variant="ghost" size="sm" onClick={() => openItemForm(item)}>Duzenle</Button>
                          <Button variant="ghost" size="sm" disabled={deleting === item.id} onClick={() => handleDelete('item', item.id)}>Sil</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      )}

      {/* Category Modal */}
      {editMode?.type === 'category' && (
        <Modal open={true} onClose={() => setEditMode(null)} title={editMode.item ? 'Kategori Duzenle' : 'Yeni Kategori'}>
          <div className="space-y-4">
            <FormField label="Kategori Adi" required>
              <Input value={catName} onChange={(e) => { setCatName(e.target.value); if (!editMode.item) setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')) }} />
            </FormField>
            <FormField label="Slug">
              <Input value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
            </FormField>
            <FormField label="Sira">
              <Input type="number" value={catSortOrder} onChange={(e) => setCatSortOrder(Number(e.target.value))} />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={catVisible} onChange={(e) => setCatVisible(e.target.checked)} className="rounded" />
              Gorunur
            </label>
            <Button variant="primary" className="w-full" onClick={saveCategory} disabled={saving || !catName}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Item Modal */}
      {editMode?.type === 'item' && (
        <Modal open={true} onClose={() => setEditMode(null)} title={editMode.item ? 'Urun Duzenle' : 'Yeni Urun'} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Urun Adi" required>
                <Input value={itemName} onChange={(e) => setItemName(e.target.value)} />
              </FormField>
              <FormField label="Kategori" required>
                <Select
                  value={itemCategoryId}
                  onChange={(e) => setItemCategoryId(e.target.value)}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              </FormField>
            </div>
            <FormField label="Açıklama">
              <Textarea value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} rows={2} />
            </FormField>
            <FormField label="Ürün Görseli">
              <ImageUpload
                value={itemImageUrl}
                onChange={setItemImageUrl}
                folder="menu"
                label="Görsel Yükle"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Fiyat (TL)" required>
                <Input type="number" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
              </FormField>
              <FormField label="Sira">
                <Input type="number" value={itemSortOrder} onChange={(e) => setItemSortOrder(Number(e.target.value))} />
              </FormField>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={itemVisible} onChange={(e) => setItemVisible(e.target.checked)} className="rounded" />
                Gorunur
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={itemFeatured} onChange={(e) => setItemFeatured(e.target.checked)} className="rounded" />
                One Cikan
              </label>
            </div>
            <Button variant="primary" className="w-full" onClick={saveItem} disabled={saving || !itemName || !itemPrice}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
