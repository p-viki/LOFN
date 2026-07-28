import { useRef, useCallback } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { Container } from '@/ui/Container'
import { MagneticButton } from '@/ui/MagneticButton'
import { Typewriter } from './Typewriter'
import { MythVisual } from './MythVisual'
import { OrbitalText } from './OrbitalText'
import { variants } from '@/lib/motion'
import { profile } from '@/data/profile'

const spring = { stiffness: 120, damping: 22, mass: 0.55 }

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const rafRef = useRef(0)
  const pending = useRef({ x: 0, y: 0 })

  const mx = useSpring(useMotionValue(0), spring)
  const my = useSpring(useMotionValue(0), spring)

  const rotateY = useTransform(mx, [-0.5, 0.5], [5, -5])
  const rotateX = useTransform(my, [-0.5, 0.5], [-4, 4])
  const contentX = useTransform(mx, [-0.5, 0.5], [8, -8])
  const contentY = useTransform(my, [-0.5, 0.5], [5, -5])

  const spotX = useTransform(mx, [-0.5, 0.5], ['-30%', '130%'])
  const spotY = useTransform(my, [-0.5, 0.5], ['-30%', '130%'])
  const spotBg = useMotionTemplate`radial-gradient(700px circle at ${spotX} ${spotY}, rgba(34,211,238,0.08), transparent 65%)`

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = sectionRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    pending.current = {
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
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
    mx.set(0)
    my.set(0)
  }, [mx, my])

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* Ambient vertical beam */}
      <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-1/3 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent pointer-events-none" />

      {/* Soft ground glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-cyan-500/[0.06] to-transparent pointer-events-none" />

      {/* Cursor spotlight */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: spotBg }}
      />

      <Container size="xl" className="relative z-10 w-full py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[70vh]">
          {/* Left: text content */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d', x: contentX, y: contentY }}
            variants={variants.stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start gap-6 lg:gap-8"
          >
            {/* Small subtitle */}
            <motion.div
              variants={variants.slideUp}
              className="flex items-center gap-3 text-cyan-300/80 text-xs md:text-sm tracking-[0.2em] uppercase font-medium"
            >
              <span className="w-6 h-[1px] bg-cyan-300/60" />
              <span>AI Music · Inspired by Myth</span>
            </motion.div>

            {/* Main title - 3D orbital text */}
            <motion.div variants={variants.slideUp} className="py-4">
              <OrbitalText
                text="LOFN"
                radius={120}
                duration={12}
                axis="y"
                // reverse={true}
                direction="ccw"
                tiltX={10}
                tiltZ={0}
                billboard={true}
                charClassName="text-6xl md:text-7xl font-bold tracking-[0.2em] text-cyan-50"
              >
                <div className="w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
              </OrbitalText>
            </motion.div>

            {/* Role typewriter */}
            <motion.div
              variants={variants.slideUp}
              className="text-lg md:text-xl text-cyan-200/90 h-8"
            >
              <Typewriter words={profile.roles} />
            </motion.div>

            {/* Bio */}
            <motion.p
              variants={variants.slideUp}
              className="text-base md:text-lg text-text-secondary max-w-lg leading-relaxed"
            >
              {profile.bio}
            </motion.p>

            {/* CTA pill button with cyan glow */}
            <motion.div variants={variants.slideUp} className="mt-2">
              <MagneticButton strength={0.3}>
                <Link
                  to="/projects"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-cyan-300/30 bg-cyan-950/20 text-cyan-50 text-sm tracking-wide uppercase font-medium backdrop-blur-sm transition-all duration-300 hover:border-cyan-300/60 hover:bg-cyan-900/20 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]"
                >
                  <span>Enter the Realm</span>
                  <ArrowUpRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </MagneticButton>
            </motion.div>
          </motion.div>

          {/* Right: myth visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            <MythVisual />
          </motion.div>
        </div>
      </Container>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cyan-200/50 z-10"
      >
        <span className="text-[10px] tracking-widest uppercase">Scroll to Explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  )
}
