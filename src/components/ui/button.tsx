'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'cta' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-sans font-semibold transition-all duration-200 rounded-button',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variants
          variant === 'primary' && 'bg-brand-primary text-white hover:bg-brand-primary-light active:bg-brand-primary-dark',
          variant === 'secondary' && 'border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-primary hover:text-white active:bg-brand-primary-dark active:text-white',
          variant === 'cta' && 'bg-brand-secondary text-white hover:brightness-110 hover:scale-[1.02] active:brightness-90 active:scale-[0.98] shadow-md hover:shadow-lg',
          variant === 'ghost' && 'text-brand-primary bg-transparent hover:bg-brand-surface active:bg-brand-surface-alt',
          variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
          // Sizes
          size === 'sm' && 'text-sm px-3 py-1.5 gap-1.5',
          size === 'md' && 'text-sm px-5 py-2.5 gap-2',
          size === 'lg' && 'text-base px-7 py-3 gap-2.5',
          // Full width
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize }
