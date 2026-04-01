import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  description?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

function FormField({ label, htmlFor, error, description, required, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-charcoal-800"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {children}

      {description && !error && (
        <p className="text-xs text-charcoal-400">{description}</p>
      )}

      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  )
}

export { FormField }
