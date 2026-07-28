import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { type ReactNode, type MouseEvent, useRef, useCallback } from 'react'
import { cn } from '@/utils/cn'

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Max tilt angle in degrees */
  maxTilt?: number
  /** Show glare overlay on hover */
  glare?: boolean
}

const tiltSpring = { stiffness: 250, damping: 20 }

/**
 * A card that tilts in 3D toward the cursor.
 * Uses a single rAF-throttled mousemove handler and a static CSS glare
 * (no per-frame string templates) for smooth 60fps interaction.
 */
export function TiltCard({ children, className, maxTilt = 10, glare = true }: TiltCardProps) {
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(my, [0, 1], [maxTilt, -maxTilt]), tiltSpring)
  const rotateY = useSpring(useTransform(mx, [0, 1], [-maxTilt, maxTilt]), tiltSpring)
  const rafRef = useRef(0)
  const pending = useRef({ x: 0.5, y: 0.5 })

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    pending.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    }
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        mx.set(pending.current.x)
        my.set(pending.current.y)
      })
    }
  }, [mx, my])

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    mx.set(0.5)
    my.set(0.5)
  }, [mx, my])

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', willChange: 'transform' }}
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border-subtle bg-bg-surface transition-colors hover:border-border-default',
        className
      )}
    >
      {/* Static CSS glare - opacity-driven on hover, no per-frame string calc */}
      {glare && (
        <div className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-cyan-200/[0.06] to-cyan-100/[0.12]" />
      )}
      <div style={{ transformStyle: 'preserve-3d' }} className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}
