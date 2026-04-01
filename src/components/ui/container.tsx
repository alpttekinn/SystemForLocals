import { cn } from '@/lib/utils'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Narrow for text-heavy pages, wide for full layouts */
  size?: 'narrow' | 'default' | 'wide'
}

function Container({ size = 'default', className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        size === 'narrow' && 'max-w-3xl',
        size === 'default' && 'max-w-site',
        size === 'wide' && 'max-w-7xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Container }
