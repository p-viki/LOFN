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
    'bg-gradient-signature text-white font-medium shadow-glow hover:shadow-hover active:scale-[0.98]',
  secondary:
    'bg-transparent border border-border-default text-text-primary hover:bg-bg-elevated hover:border-border-strong active:scale-[0.98]',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
  icon: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
}

// 移动端优先：默认尺寸适配触控，md 起可放大
const sizeStyles: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-sm rounded-lg min-h-[40px]',
  md: 'px-5 py-2.5 text-sm sm:text-base rounded-lg min-h-[44px]',
  lg: 'px-6 py-3 text-base rounded-lg min-h-[48px] sm:px-8 sm:py-3.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'lofn-button',
          'inline-flex items-center justify-center gap-2 transition-all duration-300 select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-info/50',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
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
