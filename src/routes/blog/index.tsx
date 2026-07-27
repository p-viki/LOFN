import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'
import { Badge } from '@/ui/Badge'
import { variants } from '@/lib/motion'

// 占位文章数据（后续从 content/blog/ 读取）
const posts = [
  {
    slug: 'getting-started',
    title: '使用 Vite 搭建 React 项目',
    description: '从零开始构建一个高性能的 React + TypeScript 项目。',
    date: '2024-06-15',
    tags: ['Vite', 'React', 'TypeScript'],
  },
  {
    slug: 'tailwind-design-system',
    title: '用 Tailwind 构建设计系统',
    description: '将设计 Token 映射为 Tailwind 配置的实践方法。',
    date: '2024-05-20',
    tags: ['Tailwind', 'Design System'],
  },
  {
    slug: 'ai-frontend',
    title: 'AI 时代的前端开发',
    description: 'AI 工具如何改变前端的开发方式与效率。',
    date: '2024-04-10',
    tags: ['AI', 'Frontend'],
  },
]

export default function BlogPage() {
  return (
    <>
      <Seo title="博客" description="技术博客 - 前端、AI 与创意" />
      <Section spacing="lg">
        <Container size="md">
          <h1 className="text-display-lg font-semibold text-text-primary mb-4">博客</h1>
          <p className="text-text-secondary mb-12">记录技术思考与学习笔记。</p>

          <motion.div
            variants={variants.stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {posts.map((post) => (
              <motion.div key={post.slug} variants={variants.slideUp}>
                <Link to={`/blog/${post.slug}`}>
                  <Card className="group">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-text-primary group-hover:text-gradient transition-all mb-2">
                          {post.title}
                        </h2>
                        <p className="text-text-secondary mb-3">{post.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-text-tertiary font-mono whitespace-nowrap">
                        {post.date}
                      </span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
