'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full rounded-button border bg-white px-4 py-2.5 text-sm font-sans text-charcoal-900',
          'placeholder:text-charcoal-400 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary',
          'disabled:bg-charcoal-50 disabled:cursor-not-allowed disabled:opacity-60',
          error
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-charcoal-200 hover:border-charcoal-300',
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input, type InputProps }
