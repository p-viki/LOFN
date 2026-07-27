import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { variants } from '@/lib/motion'
import { projects } from '@/data/projects'

export function FeaturedProjects() {
  const featured = projects.filter((p) => p.featured).slice(0, 3)

  return (
    <Section spacing="md">
      <Container size="lg">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-display-md font-semibold text-text-primary">精选项目</h2>
          <Link to="/projects">
            <Button variant="ghost" size="sm">
              全部项目 →
            </Button>
          </Link>
        </div>

        <motion.div
          variants={variants.stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {featured.map((project) => (
            <motion.div key={project.id} variants={variants.slideUp}>
              <Card className="h-full flex flex-col gap-4">
                {/* Cover */}
                <div className="aspect-video rounded-md bg-bg-elevated border border-border-subtle mb-2 overflow-hidden">
                  <img
                    src={project.cover}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-text-primary">{project.title}</h3>

                {/* Description */}
                <p className="text-sm text-text-secondary leading-relaxed flex-1">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  )
}
