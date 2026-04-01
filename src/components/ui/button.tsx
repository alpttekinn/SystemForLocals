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
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variants
          variant === 'primary' && 'bg-forest-800 text-cream-50 hover:bg-forest-700 active:bg-forest-900',
          variant === 'secondary' && 'border-2 border-forest-800 text-forest-800 bg-transparent hover:bg-forest-800 hover:text-cream-50 active:bg-forest-900 active:text-cream-50',
          variant === 'cta' && 'bg-burgundy-700 text-cream-50 hover:bg-burgundy-500 hover:scale-[1.02] active:bg-burgundy-900 active:scale-[0.98] border-b-2 border-gold-600 shadow-md hover:shadow-lg',
          variant === 'ghost' && 'text-forest-800 bg-transparent hover:bg-forest-50 active:bg-forest-100',
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
