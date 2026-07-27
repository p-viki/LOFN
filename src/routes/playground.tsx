import { motion } from 'framer-motion'
import { FlaskConical } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'
import { variants } from '@/lib/motion'

const demos = [
  {
    title: '粒子共振',
    description: 'Canvas 粒子系统响应鼠标移动。',
    tech: 'Canvas API',
  },
  {
    title: '音频可视化',
    description: '实时音频频谱可视化。',
    tech: 'Web Audio API',
  },
  {
    title: 'CSS 动画实验',
    description: '纯 CSS 实现的复杂动效组合。',
    tech: 'CSS',
  },
  {
    title: '3D 卡片悬停',
    description: '基于鼠标位置的 3D 透视变换。',
    tech: 'CSS 3D',
  },
]

export default function PlaygroundPage() {
  return (
    <>
      <Seo title="实验室" description="前端交互实验与 Demo" />
      <Section spacing="lg">
        <Container size="lg">
          <div className="flex items-center gap-3 mb-4">
            <FlaskConical size={32} className="text-text-primary" />
            <h1 className="text-display-lg font-semibold text-text-primary">实验室</h1>
          </div>
          <p className="text-text-secondary mb-12">探索前端技术的交互实验场。</p>

          <motion.div
            variants={variants.stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {demos.map((demo) => (
              <motion.div key={demo.title} variants={variants.slideUp}>
                <Card className="group cursor-pointer">
                  <div className="aspect-square rounded-md bg-bg-elevated border border-border-subtle mb-4 overflow-hidden flex items-center justify-center">
                    <span className="text-text-tertiary text-sm">Demo 预览</span>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">{demo.title}</h3>
                  <p className="text-sm text-text-secondary mb-3">{demo.description}</p>
                  <span className="text-xs font-mono text-text-tertiary">{demo.tech}</span>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
