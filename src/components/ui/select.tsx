'use client'

import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full appearance-none rounded-button border bg-white px-4 py-2.5 pr-10 text-sm font-sans text-charcoal-900',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary',
            'disabled:bg-charcoal-50 disabled:cursor-not-allowed disabled:opacity-60',
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-charcoal-200 hover:border-charcoal-300',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400"
          aria-hidden="true"
        />
      </div>
    )
  },
)

Select.displayName = 'Select'

export { Select, type SelectProps }
