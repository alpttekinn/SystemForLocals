'use client'

import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  /** Show URL input alongside upload button */
  showUrlInput?: boolean
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  folder = 'gallery',
  label = 'Görsel Yükle',
  showUrlInput = false,
  className = '',
}: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const { addToast } = useToast()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      addToast('Dosya boyutu 5MB\'ı geçemez.', 'error')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        addToast((err as { error?: string }).error || 'Yükleme başarısız', 'error')
        return
      }
      const data = await res.json()
      onChange(data.url)
      addToast('Görsel yüklendi', 'success')
    } catch {
      addToast('Yükleme sırasında hata oluştu', 'error')
    } finally {
      setUploading(false)
      // Reset file input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      {/* Preview */}
      {value && (
        <div className="relative mb-2 rounded-lg overflow-hidden border border-charcoal-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Önizleme" className="w-full h-32 object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            aria-label="Görseli kaldır"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {showUrlInput && (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="flex-1"
          />
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={showUrlInput ? '' : 'w-full'}
        >
          <Upload size={14} className="mr-1.5" />
          {uploading ? 'Yükleniyor...' : label}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  )
}
