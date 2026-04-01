import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      <div className="mb-4 text-charcoal-300">
        {icon || <Inbox size={48} strokeWidth={1.5} />}
      </div>
      <h3 className="font-serif text-lg font-semibold text-charcoal-700">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-charcoal-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export { EmptyState }
