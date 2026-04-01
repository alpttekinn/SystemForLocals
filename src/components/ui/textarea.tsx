'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-button border bg-white px-4 py-2.5 text-sm font-sans text-charcoal-900',
          'placeholder:text-charcoal-400 transition-colors duration-200 resize-y min-h-[100px]',
          'focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600',
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

Textarea.displayName = 'Textarea'

export { Textarea, type TextareaProps }
