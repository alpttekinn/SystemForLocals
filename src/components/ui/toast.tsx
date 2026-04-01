'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Toast Types ---

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void
  removeToast: (id: string) => void
}

// --- Context ---

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// --- Provider ---

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const toast: Toast = { id, message, variant, duration }
      setToasts((prev) => [...prev, toast])

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
      }
    },
    [removeToast],
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// --- Toast Container ---

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[]
  onRemove: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

// --- Single Toast ---

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-emerald-500 bg-emerald-50 text-emerald-900',
  error: 'border-red-500 bg-red-50 text-red-900',
  warning: 'border-amber-500 bg-amber-50 text-amber-900',
  info: 'border-blue-500 bg-blue-50 text-blue-900',
}

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = VARIANT_ICONS[toast.variant]

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-button border-l-4 p-4 shadow-card animate-slide-up',
        VARIANT_STYLES[toast.variant],
      )}
      role="alert"
    >
      <Icon size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm font-sans flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-0.5 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Bildirimi kapat"
      >
        <X size={14} />
      </button>
    </div>
  )
}
