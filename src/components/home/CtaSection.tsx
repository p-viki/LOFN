import { useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Button } from '@/ui/Button'
import { variants } from '@/lib/motion'

export function CtaSection() {
  const rafRef = useRef(0)
  const pending = useRef({ x: 0.5, y: 0.5 })

  const mx = useSpring(useMotionValue(0.5), { stiffness: 150, damping: 20 })
  const my = useSpring(useMotionValue(0.5), { stiffness: 150, damping: 20 })

  // Spotlight via translated div position (cheaper than string template)
  const spotX = useTransform(mx, [0, 1], ['-20%', '120%'])
  const spotY = useTransform(my, [0, 1], ['-20%', '120%'])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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
    <Section spacing="lg">
      <Container size="md">
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          variants={variants.slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative overflow-hidden rounded-xl border border-border-subtle bg-bg-surface px-8 py-16 md:py-24 text-center"
        >
          {/* Static ambient glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] bg-gradient-signature opacity-[0.06] blur-[100px] rounded-full" />
          </div>

          {/* Spotlight - a translated div instead of per-frame gradient string */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full pointer-events-none will-change-transform"
            style={{
              left: spotX,
              top: spotY,
              x: '-50%',
              y: '-50%',
              background: 'radial-gradient(circle, rgba(34,211,238,0.12), transparent 70%)',
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-6">
            <h2 className="text-display-lg font-semibold text-text-primary">
              有想法？一起聊聊。
            </h2>
            <p className="text-lg text-text-secondary max-w-md">
              无论是项目合作、技术交流还是随便聊聊，都欢迎联系我。
            </p>
            <Link to="/contact">
              <Button variant="primary" size="lg">
                发起对话
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}
