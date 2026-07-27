import { cn } from '@/utils/cn'

interface DividerProps {
  className?: string
  gradient?: boolean
}

export function Divider({ className, gradient = false }: DividerProps) {
  return (
    <hr
      className={cn(
        'border-0 h-px',
        gradient
          ? 'bg-gradient-to-r from-transparent via-border-default to-transparent'
          : 'bg-border-subtle',
        className
      )}
    />
  )
}
