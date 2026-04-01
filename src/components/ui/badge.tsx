import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'forest' | 'burgundy' | 'gold' | 'charcoal' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variant === 'default' && 'bg-brand-surface-alt text-brand-text-muted',
        variant === 'forest' && 'bg-brand-surface-alt text-brand-primary',
        variant === 'burgundy' && 'bg-brand-surface-alt text-brand-secondary',
        variant === 'gold' && 'bg-amber-100 text-amber-800',
        variant === 'charcoal' && 'bg-gray-100 text-gray-600',
        variant === 'success' && 'bg-emerald-100 text-emerald-800',
        variant === 'warning' && 'bg-amber-100 text-amber-800',
        variant === 'error' && 'bg-red-100 text-red-800',
        variant === 'info' && 'bg-blue-100 text-blue-800',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge, type BadgeVariant }
