import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface BadgeProps {
  children: ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 text-xs font-medium',
        'bg-bg-elevated border border-border-subtle text-text-secondary',
        'rounded-sm font-mono',
        className
      )}
    >
      {children}
    </span>
  )
}
