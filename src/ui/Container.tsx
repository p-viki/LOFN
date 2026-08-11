import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
}

// 移动端优先：小屏紧凑内边距，md 起放宽
const sizeStyles = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  full: 'max-w-none',
}

export function Container({ children, className, size = 'lg' }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4 xs:px-5 sm:px-6 md:px-8', sizeStyles[size], className)}>
      {children}
    </div>
  )
}
