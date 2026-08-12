import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ClipboardList, Gamepad2, BookOpen, ArrowRight } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { OrbitalRing } from '@/components/orbital/OrbitalRing'
import { Card } from '@/ui/Card'
import { variants } from '@/lib/motion'

const ORBIT_WORDS = ['心理', '测试', '探索', '自我', '量表', '成长', '认知', '情绪']

interface ModuleEntry {
  key: string
  title: string
  description: string
  icon: typeof ClipboardList
  to: string
  available: boolean
}

const MODULES: ModuleEntry[] = [
  {
    key: 'tests',
    title: '测试题',
    description: '心理量表与自测题库，从科学评估开始了解自己',
    icon: ClipboardList,
    to: '/tests',
    available: true,
  },
  {
    key: 'games',
    title: '心理游戏',
    description: '互动式心理小游戏，在体验中认识自己',
    icon: Gamepad2,
    to: '/games',
    available: false,
  },
  {
    key: 'articles',
    title: '文章',
    description: '心理学知识文章，获取专业内容支持',
    icon: BookOpen,
    to: '/articles',
    available: false,
  },
]

export default function HomePage() {
  return (
    <>
      <Seo title="LOFN · Explore Yourself" description="心理学测试、游戏与文章 - 探索更好的自己" />

      <div className="lofn-home relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden px-4 py-16">
        {/* 背景光晕 */}
        <div aria-hidden className="lofn-home-glow absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[640px] max-h-[640px] rounded-full bg-info/10 blur-3xl" />
        </div>

        {/* 中心标题 */}
        <motion.div
          variants={variants.stagger}
          initial="hidden"
          animate="visible"
          className="lofn-home-hero relative z-10 text-center mt-8 sm:mt-10"
        >
          {/* 3D 环绕文字：仅环绕标题区域 */}
          <OrbitalRing words={ORBIT_WORDS} radius="clamp(100px, 26vw, 180px)" duration={32} />

          <motion.h1
            variants={variants.slideUp}
            className="lofn-home-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-gradient"
          >
            LOFN
          </motion.h1>
          <motion.p
            variants={variants.slideUp}
            className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-text-secondary tracking-wide"
          >
            Explore Yourself
          </motion.p>
        </motion.div>

        {/* 一级模块入口 */}
        <motion.div
          variants={variants.stagger}
          initial="hidden"
          animate="visible"
          className="lofn-home-modules relative z-10 w-full max-w-2xl mt-12 sm:mt-16 space-y-3"
        >
          {MODULES.map((module) => {
            const Icon = module.icon
            if (module.available) {
              return (
                <motion.div key={module.key} variants={variants.slideUp}>
                  <Link to={module.to} className="block group">
                    <Card hover className="flex items-center gap-4 p-4 sm:p-5">
                      <span className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg bg-info/10 text-info">
                        <Icon size={22} />
                      </span>
                      <div className="flex-1 text-left">
                        <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                          {module.title}
                        </h2>
                        <p className="text-sm text-text-secondary">{module.description}</p>
                      </div>
                      <ArrowRight
                        size={18}
                        className="shrink-0 text-info transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </Card>
                  </Link>
                </motion.div>
              )
            }
            return (
              <motion.div key={module.key} variants={variants.slideUp}>
                <Card className="flex items-center gap-4 p-4 sm:p-5 opacity-60">
                  <span className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg bg-bg-elevated text-text-tertiary">
                    <Icon size={22} />
                  </span>
                  <div className="flex-1 text-left">
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                      {module.title}
                    </h2>
                    <p className="text-sm text-text-secondary">{module.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-text-tertiary border border-border-subtle rounded-md px-2 py-0.5">
                    敬请期待
                  </span>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </>
  )
}
