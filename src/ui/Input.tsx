import { forwardRef } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'bg-transparent border-0 border-b border-border-default',
            'px-0 py-2.5 text-text-primary placeholder:text-text-tertiary',
            'focus:outline-none focus:border-info transition-colors duration-300',
            error && 'border-error',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={4}
          className={cn(
            'bg-transparent border-0 border-b border-border-default resize-none',
            'px-0 py-2.5 text-text-primary placeholder:text-text-tertiary',
            'focus:outline-none focus:border-info transition-colors duration-300',
            error && 'border-error',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
