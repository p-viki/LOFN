import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface SectionProps {
  children: ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
}

// 移动端优先：小屏紧凑间距，md 起放宽
const spacingStyles = {
  sm: 'py-8 md:py-16',
  md: 'py-12 md:py-20',
  lg: 'py-16 md:py-24',
}

export function Section({ children, className, spacing = 'md' }: SectionProps) {
  return <section className={cn(spacingStyles[spacing], className)}>{children}</section>
}
