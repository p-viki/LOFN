import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'
import { Badge } from '@/ui/Badge'
import { variants } from '@/lib/motion'
import { projects } from '@/data/projects'
import { cn } from '@/utils/cn'

const categories = [
  { value: 'all', label: '全部' },
  { value: 'frontend', label: '前端' },
  { value: 'ai', label: 'AI' },
  { value: 'music', label: '音乐' },
  { value: 'fullstack', label: '全栈' },
]

export default function ProjectsPage() {
  const [filter, setFilter] = useState('all')

  const filtered =
    filter === 'all' ? projects : projects.filter((p) => p.category === filter)

  return (
    <>
      <Seo title="项目" description="个人项目作品集" />
      <Section spacing="lg">
        <Container size="lg">
          <h1 className="text-display-lg font-semibold text-text-primary mb-4">项目</h1>
          <p className="text-text-secondary mb-12">精选个人项目，涵盖前端、AI 与音乐领域。</p>

          {/* Filter */}
          <div className="flex flex-wrap gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={cn(
                  'px-4 py-2 text-sm rounded-sm transition-all',
                  filter === cat.value
                    ? 'bg-gradient text-white'
                    : 'bg-bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <motion.div
            layout
            variants={variants.stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((project) => (
              <motion.div key={project.id} variants={variants.slideUp} layout>
                <Link to={`/projects/${project.id}`}>
                  <Card className="h-full flex flex-col gap-4 group">
                    <div className="aspect-video rounded-md bg-bg-elevated border border-border-subtle overflow-hidden">
                      <img
                        src={project.cover}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary">{project.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed flex-1">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
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
