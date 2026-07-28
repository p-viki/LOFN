import { Code2, Brain, Music, Sparkles } from 'lucide-react'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { CardCarousel } from './CardCarousel'

const identities = [
  {
    id: 'frontend',
    icon: Code2,
    title: '前端工程',
    description: '用 React 与 TypeScript 构建高性能、可维护的 Web 应用。',
  },
  {
    id: 'ai',
    icon: Brain,
    title: 'AI 开发',
    description: '探索大语言模型与智能应用的边界。',
  },
  {
    id: 'music',
    icon: Music,
    title: '音乐创作',
    description: '将声音与代码融合，创造视听共振的数字体验。',
  },
  {
    id: 'fusion',
    icon: Sparkles,
    title: '跨界融合',
    description: '把技术、艺术与想象力编织成下一代数字体验。',
  },
]

export function IdentityBento() {
  return (
    <Section spacing="lg">
      <Container size="lg">
        <CardCarousel items={identities} />
      </Container>
    </Section>
  )
}
