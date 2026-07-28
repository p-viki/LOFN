import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useMotionValue, useSpring, animate, useTransform } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CarouselItem {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

interface CardCarouselProps {
  items: CarouselItem[]
}

/**
 * A 3D orbital carousel.
 * Cards are distributed around a circle with CSS 3D transforms.
 * Supports drag-to-spin, previous/next buttons, auto-rotation, and click-to-center.
 */
export function CardCarousel({ items }: CardCarouselProps) {
  const count = items.length
  const angleStep = 360 / count
  const radius = 320 // distance from center in px

  const [activeIndex, setActiveIndex] = useState(0)
  const rotation = useMotionValue(0)
  const smoothRotation = useSpring(rotation, { stiffness: 80, damping: 22, mass: 0.8 })

  // Drag state
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ x: number; rotation: number } | null>(null)
  const autoPlayRef = useRef<ReturnType<typeof animate> | null>(null)

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      autoPlayRef.current.stop()
      autoPlayRef.current = null
    }
  }, [])

  const startAutoPlay = useCallback(() => {
    stopAutoPlay()
    autoPlayRef.current = animate(rotation, rotation.get() - 360, {
      duration: 40,
      repeat: Infinity,
      ease: 'linear',
      onUpdate: (v) => rotation.set(v),
    })
  }, [rotation, stopAutoPlay])

  // Snap to nearest card
  const snapTo = useCallback(
    (targetIndex: number) => {
      stopAutoPlay()
      const targetAngle = -targetIndex * angleStep
      // choose shortest direction
      const current = rotation.get()
      const diff = targetAngle - current
      const full = Math.round(diff / 360) * 360
      const final = current + diff - full
      animate(rotation, final, {
        type: 'spring',
        stiffness: 90,
        damping: 20,
        onUpdate: (v) => rotation.set(v),
      })
      setActiveIndex(((targetIndex % count) + count) % count)
      // resume auto-play after interaction
      setTimeout(startAutoPlay, 3000)
    },
    [angleStep, count, rotation, startAutoPlay, stopAutoPlay]
  )

  const goNext = useCallback(() => snapTo(activeIndex + 1), [activeIndex, snapTo])
  const goPrev = useCallback(() => snapTo(activeIndex - 1), [activeIndex, snapTo])

  // Pointer drag handlers
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      stopAutoPlay()
      dragStart.current = { x: e.clientX, rotation: rotation.get() }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [rotation, stopAutoPlay]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current) return
      const dx = e.clientX - dragStart.current.x
      const deg = dx * 0.25
      rotation.set(dragStart.current.rotation + deg)
    },
    [rotation]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current) return
      dragStart.current = null
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      // Snap to nearest card
      const current = rotation.get()
      const normalized = ((current % 360) + 360) % 360
      const nearest = Math.round((360 - normalized) / angleStep) % count
      snapTo(nearest)
    },
    [angleStep, count, rotation, snapTo]
  )

  // Start auto-play on mount
  useEffect(() => {
    startAutoPlay()
    return () => stopAutoPlay()
  }, [startAutoPlay, stopAutoPlay])

  // Normalize active index while auto-rotating
  useEffect(() => {
    return smoothRotation.on('change', (v) => {
      const normalized = ((v % 360) + 360) % 360
      const idx = Math.round(normalized / angleStep) % count
      setActiveIndex(idx)
    })
  }, [smoothRotation, angleStep, count])

  // Spotlight follows rotation center (subtle)
  const glowOpacity = useTransform(
    smoothRotation,
    (v) => {
      const normalized = ((v % 360) + 360) % 360
      return 0.6 + 0.4 * Math.cos((normalized * Math.PI) / 180)
    }
  )

  return (
    <div className="relative w-full py-12 md:py-20 flex flex-col items-center gap-8">
      {/* 3D stage */}
      <div
        ref={containerRef}
        className="relative w-full h-[420px] md:h-[460px] flex items-center justify-center cursor-grab active:cursor-grabbing perspective-2000"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Ground glow under the carousel */}
        <motion.div
          className="absolute bottom-8 w-[500px] h-[120px] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none"
          style={{ opacity: glowOpacity }}
        />

        {/* Orbital ring */}
        <div className="absolute w-[640px] h-[640px] rounded-full border border-cyan-300/10 pointer-events-none" />
        <div className="absolute w-[640px] h-[640px] rounded-full border border-dashed border-cyan-300/5 pointer-events-none animate-spin-slow" />

        {/* Rotating carousel group */}
        <motion.div
          className="relative w-0 h-0 transform-style-3d will-change-transform"
          style={{ rotateY: smoothRotation }}
        >
          {items.map((item, i) => {
            const theta = i * angleStep
            const Icon = item.icon
            const isActive = i === activeIndex

            return (
              <motion.div
                key={item.id}
                className="absolute top-1/2 left-1/2 w-[240px] md:w-[260px]"
                style={{
                  transform: `translate(-50%, -50%) rotateY(${theta}deg) translateZ(${radius}px) rotateY(${-theta}deg)`,
                  transformStyle: 'preserve-3d',
                }}
                onClick={() => snapTo(i)}
              >
                <div
                  className={cn(
                    'relative flex flex-col items-center gap-4 p-6 md:p-7 rounded-2xl border backdrop-blur-md transition-all duration-500',
                    'bg-gradient-to-b from-cyan-950/25 to-slate-950/50',
                    isActive
                      ? 'border-cyan-300/40 shadow-[0_0_40px_rgba(34,211,238,0.18)] scale-105 z-10'
                      : 'border-cyan-300/10 opacity-70 scale-95'
                  )}
                >
                  {/* Icon ring */}
                  <div
                    className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center border transition-colors duration-500',
                      isActive
                        ? 'bg-cyan-950/40 border-cyan-300/40 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                        : 'bg-cyan-950/20 border-cyan-300/15'
                    )}
                  >
                    <Icon size={26} className={isActive ? 'text-cyan-200' : 'text-cyan-300/70'} />
                  </div>

                  <div className="text-center">
                    <h3 className="text-base md:text-lg font-semibold text-text-primary tracking-wide mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Active corner accent */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl pointer-events-none border border-cyan-300/20 opacity-50" />
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 z-10">
        <button
          onClick={goPrev}
          className="p-2 rounded-full border border-cyan-300/20 text-cyan-200/70 hover:text-cyan-200 hover:border-cyan-300/40 hover:bg-cyan-950/30 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => snapTo(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                i === activeIndex ? 'bg-cyan-300 w-5' : 'bg-cyan-300/25 hover:bg-cyan-300/50'
              )}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          className="p-2 rounded-full border border-cyan-300/20 text-cyan-200/70 hover:text-cyan-200 hover:border-cyan-300/40 hover:bg-cyan-950/30 transition-colors"
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
