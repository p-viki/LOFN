import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { OrbitalRing } from '@/components/orbital/OrbitalRing'
import { Button } from '@/ui/Button'
import { variants } from '@/lib/motion'

const ORBIT_WORDS = ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', '工程化', '前端']

export default function HomePage() {
  return (
    <>
      <Seo title="LOFN · Explore Yourself" description="LOFN 前端测试题库 - 探索更好的自己" />

      <div className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden px-4">
        {/* 背景光晕 */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[640px] max-h-[640px] rounded-full bg-info/10 blur-3xl" />
        </div>

        {/* 3D 环绕文字层 */}
        <OrbitalRing words={ORBIT_WORDS} />

        {/* 中心标题 */}
        <motion.div
          variants={variants.stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center"
        >
          <motion.h1
            variants={variants.slideUp}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-gradient"
          >
            LOFN
          </motion.h1>
          <motion.p
            variants={variants.slideUp}
            className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-text-secondary tracking-wide"
          >
            Explore Yourself
          </motion.p>
          <motion.div variants={variants.slideUp} className="mt-8 sm:mt-10">
            <Link to="/quiz">
              <Button size="lg">
                开始测试 <ArrowRight size={18} />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
