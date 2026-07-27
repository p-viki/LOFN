import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface SectionProps {
  children: ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
}

const spacingStyles = {
  sm: 'py-16 md:py-20',
  md: 'py-20 md:py-28',
  lg: 'py-24 md:py-32',
}

export function Section({ children, className, spacing = 'md' }: SectionProps) {
  return <section className={cn(spacingStyles[spacing], className)}>{children}</section>
}
