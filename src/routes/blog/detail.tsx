import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Badge } from '@/ui/Badge'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import { variants } from '@/lib/motion'

// 占位文章（后续从 content/blog/ 读取并 Markdown 渲染）
const postContent = {
  title: '使用 Vite 搭建 React 项目',
  description: '从零开始构建一个高性能的 React + TypeScript 项目。',
  date: '2024-06-15',
  tags: ['Vite', 'React', 'TypeScript'],
  body: '文章正文将在后续接入 Markdown 渲染。此处将展示 react-markdown + rehype-highlight 的完整渲染结果，包含代码高亮、目录、阅读进度等功能。',
}

export default function BlogDetailPage() {
  const { slug: _slug } = useParams()
  const progress = useScrollProgress()

  return (
    <>
      <Seo title={postContent.title} description={postContent.description} type="article" />

      {/* Reading progress bar */}
      <div className="fixed top-16 left-0 right-0 h-0.5 bg-border-subtle z-40">
        <div
          className="h-full bg-gradient transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Section spacing="lg">
        <Container size="sm">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            返回博客
          </Link>

          <motion.div variants={variants.slideUp} initial="hidden" animate="visible">
            <div className="flex flex-wrap gap-2 mb-4">
              {postContent.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <h1 className="text-display-md font-semibold text-text-primary mb-4">
              {postContent.title}
            </h1>
            <p className="text-text-tertiary font-mono text-sm mb-12">{postContent.date}</p>

            <div className="text-text-secondary leading-relaxed text-lg">
              {postContent.body}
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
