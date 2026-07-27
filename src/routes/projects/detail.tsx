import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink, Github } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { variants } from '@/lib/motion'
import { projects } from '@/data/projects'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const project = projects.find((p) => p.id === id)

  if (!project) {
    return (
      <Section spacing="lg">
        <Container size="md">
          <div className="text-center">
            <h1 className="text-2xl text-text-primary mb-4">项目不存在</h1>
            <Link to="/projects">
              <Button variant="secondary">返回项目列表</Button>
            </Link>
          </div>
        </Container>
      </Section>
    )
  }

  return (
    <>
      <Seo title={project.title} description={project.description} type="article" />
      <Section spacing="lg">
        <Container size="md">
          {/* Back */}
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            返回项目列表
          </Link>

          {/* Header */}
          <motion.div
            variants={variants.slideUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4 mb-8"
          >
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <h1 className="text-display-md font-semibold text-text-primary">{project.title}</h1>
            <p className="text-lg text-text-secondary">{project.description}</p>
            <div className="flex gap-3 mt-2">
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" size="sm">
                    <ExternalLink size={14} />
                    在线 Demo
                  </Button>
                </a>
              )}
              {project.repoUrl && (
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">
                    <Github size={14} />
                    源码
                  </Button>
                </a>
              )}
            </div>
          </motion.div>

          {/* Cover */}
          <motion.div
            variants={variants.slideUp}
            initial="hidden"
            animate="visible"
            className="aspect-video rounded-lg bg-bg-elevated border border-border-subtle overflow-hidden mb-12"
          >
            <img src={project.cover} alt={project.title} className="w-full h-full object-cover" />
          </motion.div>

          {/* Content placeholder */}
          <motion.div
            variants={variants.slideUp}
            initial="hidden"
            animate="visible"
            className="prose prose-invert max-w-none"
          >
            <p className="text-text-secondary leading-relaxed">
              项目详细内容待补充。此处将在后续接入 Markdown 渲染，展示项目背景、技术架构、核心难点与解决方案。
            </p>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
