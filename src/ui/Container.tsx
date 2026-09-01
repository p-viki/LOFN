import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
}

export function Container({ children, className, size = 'lg' }: ContainerProps) {
  return (
    <div className={cn('lofn-container', `lofn-container--${size}`, className)}>
      {children}
    </div>
  )
}
