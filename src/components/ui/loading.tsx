import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function Loading({ message = 'Yükleniyor...', size = 'md', className }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <Loader2
        className={cn(
          'animate-spin text-forest-700',
          size === 'sm' && 'h-5 w-5',
          size === 'md' && 'h-8 w-8',
          size === 'lg' && 'h-12 w-12',
        )}
      />
      {message && (
        <p className="text-sm text-charcoal-500 font-sans">{message}</p>
      )}
    </div>
  )
}

/**
 * Full-page loading state for route transitions or initial data fetch.
 */
function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loading size="lg" />
    </div>
  )
}

export { Loading, PageLoading }
