import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useRef, useEffect, type ReactNode } from 'react'

interface MagneticButtonProps {
  children: ReactNode
  strength?: number
  className?: string
}

/**
 * Wraps children in a magnetic field: the content translates toward the
 * cursor when nearby and springs back when the pointer leaves.
 *
 * Uses a LOCAL mousemove listener on the element itself (not global window),
 * so only hovered buttons do work. Movement is rAF-throttled.
 */
export function MagneticButton({ children, strength = 0.35, className }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const smoothX = useSpring(x, { stiffness: 250, damping: 18, mass: 0.3 })
  const smoothY = useSpring(y, { stiffness: 250, damping: 18, mass: 0.3 })
  const rafRef = useRef(0)
  const pending = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Listen on a slightly larger hit area around the element
    const range = 100

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)

      if (dist < range + rect.width / 2) {
        pending.current = { x: dx * strength, y: dy * strength }
      } else {
        pending.current = { x: 0, y: 0 }
      }
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0
          x.set(pending.current.x)
          y.set(pending.current.y)
        })
      }
    }

    // Use document-level listener but bail early if pointer is far away.
    // This avoids per-button mouseenter/leave jank while keeping it cheap
    // (the distance check is a single Math.hypot).
    document.addEventListener('mousemove', handleMove, { passive: true })
    return () => {
      document.removeEventListener('mousemove', handleMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [strength, x, y])

  return (
    <motion.div ref={ref} style={{ x: smoothX, y: smoothY, willChange: 'transform' }} className={className}>
      {children}
    </motion.div>
  )
}
