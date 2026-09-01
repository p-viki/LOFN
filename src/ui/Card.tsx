import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
}

export function Card({ children, hover = true, className, ...props }: CardProps) {
  return (
    <div
      className={cn('lofn-card', hover && 'lofn-card--hoverable', className)}
      data-hover={hover || undefined}
      {...props}
    >
      {children}
    </div>
  )
}
