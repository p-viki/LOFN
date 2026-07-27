import { motion } from 'framer-motion'
import { Code2, Brain, Music } from 'lucide-react'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { variants } from '@/lib/motion'

const identities = [
  {
    icon: Code2,
    title: '前端工程',
    description: '用 React 与 TypeScript 构建高性能、可维护的 Web 应用。',
    span: 'md:col-span-2',
    accent: 'from-violet-500/10',
  },
  {
    icon: Brain,
    title: 'AI 开发',
    description: '探索大语言模型与智能应用的边界。',
    span: '',
    accent: 'from-blue-500/10',
  },
  {
    icon: Music,
    title: '音乐创作',
    description: '将声音与代码融合，创造视听共振的数字体验。',
    span: 'md:col-span-2',
    accent: 'from-pink-500/10',
  },
]

export function IdentityBento() {
  return (
    <Section spacing="lg">
      <Container size="lg">
        <motion.div
          variants={variants.stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {identities.map(({ icon: Icon, title, description, span, accent }) => (
            <motion.div
              key={title}
              variants={variants.slideUp}
              className={`group relative overflow-hidden rounded-lg border border-border-subtle bg-bg-surface p-8 ${span} hover:border-border-default transition-colors`}
            >
              {/* Accent glow on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-md bg-bg-elevated border border-border-subtle flex items-center justify-center">
                  <Icon size={24} className="text-text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-text-primary">{title}</h3>
                <p className="text-text-secondary leading-relaxed">{description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  )
}
