import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'icon'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gradient-signature text-white font-medium shadow-glow hover:shadow-hover hover:scale-[1.02]',
  secondary:
    'bg-transparent border border-border-default text-text-primary hover:bg-bg-elevated hover:border-border-strong',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
  icon: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated p-2',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-sm',
  md: 'px-6 py-3 text-base rounded-sm',
  lg: 'px-8 py-4 text-lg rounded-md',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-300',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-info/50',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
