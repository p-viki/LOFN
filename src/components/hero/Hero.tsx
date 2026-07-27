import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { Container } from '@/ui/Container'
import { Button } from '@/ui/Button'
import { Typewriter } from './Typewriter'
import { variants } from '@/lib/motion'
import { profile } from '@/data/profile'

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-gradient-signature opacity-[0.07] blur-[120px] rounded-full" />
      </div>

      <Container size="md" className="relative z-10">
        <motion.div
          variants={variants.stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center gap-6"
        >
          {/* Name */}
          <motion.h1
            variants={variants.slideUp}
            className="text-display-2xl md:text-display-xl font-semibold tracking-tight text-text-primary"
          >
            {profile.name}
          </motion.h1>

          {/* Rotating roles */}
          <motion.div variants={variants.slideUp} className="text-xl md:text-2xl h-8">
            <Typewriter words={profile.roles} />
          </motion.div>

          {/* Bio */}
          <motion.p
            variants={variants.slideUp}
            className="text-lg text-text-secondary max-w-xl leading-relaxed"
          >
            {profile.bio}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={variants.slideUp} className="flex items-center gap-4 mt-4">
            <Link to="/projects">
              <Button variant="primary" size="md">
                查看作品
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="secondary" size="md">
                联系我
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </Container>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-tertiary"
      >
        <span className="text-xs">向下滚动</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  )
}
