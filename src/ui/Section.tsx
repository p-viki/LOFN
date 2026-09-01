import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface SectionProps {
  children: ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
}

export function Section({ children, className, spacing = 'md' }: SectionProps) {
  return (
    <section className={cn('lofn-section', `lofn-section--${spacing}`, className)}>
      {children}
    </section>
  )
}
