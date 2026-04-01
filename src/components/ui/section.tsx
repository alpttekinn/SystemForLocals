import { cn } from '@/lib/utils'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div'
  /** Compact vertical padding */
  compact?: boolean
}

function Section({ as: Tag = 'section', compact, className, children, ...props }: SectionProps) {
  return (
    <Tag
      className={cn(compact ? 'section-padding-sm' : 'section-padding', className)}
      {...props}
    >
      {children}
    </Tag>
  )
}

interface SectionHeaderProps {
  title: string
  subtitle?: string
  centered?: boolean
  className?: string
}

function SectionHeader({ title, subtitle, centered = true, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-8 md:mb-12', centered && 'text-center', className)}>
      <h2 className="text-section-heading text-brand-text">{title}</h2>
      {subtitle && (
        <p className="mt-3 text-body-lg text-brand-text-muted max-w-2xl mx-auto">{subtitle}</p>
      )}
      <div className="gold-divider mt-4" />
    </div>
  )
}

export { Section, SectionHeader }
