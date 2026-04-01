import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width class or style */
  width?: string
  /** Height class or style */
  height?: string
}

function Skeleton({ className, width, height, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-button bg-cream-200',
        width,
        height,
        className,
      )}
      {...props}
    />
  )
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-cream-50 rounded-card shadow-card p-5 space-y-4', className)}>
      <Skeleton className="h-40 w-full rounded-card" />
      <Skeleton className="h-5 w-3/4" />
      <SkeletonText lines={2} />
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard }
