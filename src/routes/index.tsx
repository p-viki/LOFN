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

      <div className="lofn-home">
        {/* 背景光晕 */}
        <div aria-hidden className="lofn-home-glow">
          <div className="lofn-home-glow__blob" />
        </div>

        {/* 中心标题 */}
        <motion.div
          variants={variants.stagger}
          initial="hidden"
          animate="visible"
          className="lofn-home-hero"
        >
          {/* 3D 环绕文字：仅环绕标题区域 */}
          <OrbitalRing words={ORBIT_WORDS} radius="clamp(100px, 26vw, 180px)" duration={32} />

          <motion.h1 variants={variants.slideUp} className="lofn-home-title">
            LOFN
          </motion.h1>
          <motion.p variants={variants.slideUp} className="lofn-home-subtitle">
            Explore Yourself
          </motion.p>
        </motion.div>

        {/* 一级模块入口 */}
        <motion.div
          variants={variants.stagger}
          initial="hidden"
          animate="visible"
          className="lofn-home-modules"
        >
          {MODULES.map((module) => {
            const Icon = module.icon
            if (module.available) {
              return (
                <motion.div key={module.key} variants={variants.slideUp}>
                  <Link to={module.to} className="lofn-home-module">
                    <Card hover className="lofn-home-module__card">
                      <span className="lofn-home-module__icon">
                        <Icon size={22} />
                      </span>
                      <div className="lofn-home-module__content">
                        <h2 className="lofn-home-module__title">{module.title}</h2>
                        <p className="lofn-home-module__desc">{module.description}</p>
                      </div>
                      <ArrowRight size={18} className="lofn-home-module__arrow" />
                    </Card>
                  </Link>
                </motion.div>
              )
            }
            return (
              <motion.div key={module.key} variants={variants.slideUp}>
                <Card hover={false} className="lofn-home-module__card lofn-home-module__card--disabled">
                  <span className="lofn-home-module__icon lofn-home-module__icon--disabled">
                    <Icon size={22} />
                  </span>
                  <div className="lofn-home-module__content">
                    <h2 className="lofn-home-module__title">{module.title}</h2>
                    <p className="lofn-home-module__desc">{module.description}</p>
                  </div>
                  <span className="lofn-home-module__badge">敬请期待</span>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </>
  )
}
