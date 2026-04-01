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
        variant === 'default' && 'bg-charcoal-100 text-charcoal-700',
        variant === 'forest' && 'bg-forest-100 text-forest-800',
        variant === 'burgundy' && 'bg-burgundy-100 text-burgundy-700',
        variant === 'gold' && 'bg-amber-100 text-amber-800',
        variant === 'charcoal' && 'bg-charcoal-100 text-charcoal-600',
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
