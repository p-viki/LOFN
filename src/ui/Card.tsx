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
        'lofn-card',
        'bg-bg-surface border border-border-subtle rounded-lg p-4 xs:p-5 sm:p-6 transition-all duration-300',
        hover && 'hover:border-border-default hover:shadow-hover md:hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
