import { motion } from 'framer-motion'
import { ClipboardList } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'
import { variants } from '@/lib/motion'

const categories = [
  {
    title: 'HTML & CSS',
    description: '布局、选择器、动画、响应式等基础题。',
    count: 20,
  },
  {
    title: 'JavaScript',
    description: '作用域、闭包、原型链、异步、ES6+。',
    count: 30,
  },
  {
    title: 'TypeScript',
    description: '类型系统、泛型、工具类型、类型体操。',
    count: 15,
  },
  {
    title: 'React',
    description: 'Hooks、状态管理、渲染优化、路由。',
    count: 25,
  },
  {
    title: 'Vue',
    description: '响应式原理、组合式 API、生态工具。',
    count: 15,
  },
  {
    title: '工程化',
    description: '构建工具、CI/CD、性能优化、测试。',
    count: 18,
  },
]

export default function QuizPage() {
  return (
    <>
      <Seo title="测试题" description="前端面试题与自测练习" />
      <Section spacing="lg">
        <Container size="lg">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardList size={32} className="text-text-primary" />
            <h1 className="text-display-lg font-semibold text-text-primary">测试题</h1>
          </div>
          <p className="text-text-secondary mb-12">前端知识自测与面试题库练习。</p>

          <motion.div
            variants={variants.stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {categories.map((cat) => (
              <motion.div key={cat.title} variants={variants.slideUp}>
                <Card className="group cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-text-primary">{cat.title}</h3>
                    <span className="text-xs font-mono text-text-tertiary px-2 py-1 rounded-sm bg-bg-elevated border border-border-subtle">
                      {cat.count} 题
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{cat.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
