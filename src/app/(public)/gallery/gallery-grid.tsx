'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryItem {
  id: string
  image_url: string
  thumbnail_url: string | null
  alt_text: string | null
  caption: string | null
}

interface GalleryGridProps {
  items: GalleryItem[]
}

export function GalleryGrid({ items }: GalleryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = items

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goNext = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filtered.length)
    }
  }, [lightboxIndex, filtered.length])

  const goPrev = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length)
    }
  }, [lightboxIndex, filtered.length])

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, goNext, goPrev])

  // Prevent body scroll when lightbox open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  return (
    <>
      {/* Count */}
      <div className="text-center mb-4">
        <p className="text-sm text-brand-text-muted">{filtered.length} fotoğraf</p>
      </div>

      {/* Masonry grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 reveal-stagger">
        {filtered.map((item, i) => (
          <button
            key={item.id}
            onClick={() => openLightbox(i)}
            className="group relative break-inside-avoid rounded-card overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 reveal block w-full text-left cursor-pointer"
          >
            <div className={i % 3 === 0 ? 'aspect-[4/5]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[5/4]'}>
              <Image
                src={item.thumbnail_url || item.image_url}
                alt={item.alt_text || item.caption || 'Galeri'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {item.caption && (
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-sm text-white font-medium drop-shadow-lg">{item.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>

          {/* Prev */}
          {filtered.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev() }}
              className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Önceki"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-[90vw] max-h-[85vh] w-auto h-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filtered[lightboxIndex].image_url}
              alt={filtered[lightboxIndex].alt_text || filtered[lightboxIndex].caption || 'Galeri'}
              width={1200}
              height={800}
              className="object-contain max-h-[85vh] w-auto rounded-lg"
              priority
            />
            {filtered[lightboxIndex].caption && (
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg">
                <p className="text-white text-sm text-center">{filtered[lightboxIndex].caption}</p>
              </div>
            )}
            {/* Counter */}
            <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              {lightboxIndex + 1} / {filtered.length}
            </div>
          </div>

          {/* Next */}
          {filtered.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext() }}
              className="absolute right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Sonraki"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      )}
    </>
  )
}
