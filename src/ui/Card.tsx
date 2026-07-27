import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
}

export function Card({ children, hover = true, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-subtle rounded-lg p-6 transition-all duration-400',
        hover && 'hover:-translate-y-1 hover:border-border-default hover:shadow-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
