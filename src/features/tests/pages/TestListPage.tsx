import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, ArrowRight, CheckCircle2, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'
import { variants } from '@/lib/motion'
import { TEST_PROJECTS } from '../registry'
import type { TestProject, TestProjectInfo } from '../types'
import { cn } from '@/utils/cn'

function TestCard({ project }: { project: TestProject }) {
  const [info, setInfo] = useState<TestProjectInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    project.loadInfo?.()
      .then((data) => {
        if (!cancelled) setInfo(data)
      })
      .catch(() => {
        /* 加载失败时保留占位信息 */
      })
    return () => {
      cancelled = true
    }
  }, [project])

  return (
    <motion.div variants={variants.slideUp}>
      <Link to={`/tests/${project.id}`} className="lofn-quiz-card block group">
        <Card hover className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {project.badge && (
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-md border',
                      project.badgeClassName
                    )}
                  >
                    {project.badge}
                  </span>
                )}
                <h3 className="text-lg sm:text-xl font-semibold text-text-primary">
                  {project.title}
                </h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {project.description}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-text-tertiary">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-info" />
                  {info?.questionCount ?? '—'} 题
                </span>
                {(info?.tags ?? []).map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5">
                    <BarChart3 size={14} className="text-info" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <span className="shrink-0 flex items-center gap-1 text-sm text-info transition-transform duration-300 group-hover:translate-x-1 mt-1">
              开始 <ArrowRight size={16} />
            </span>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}

export default function TestListPage() {
  return (
    <>
      <Seo title="测试题" description="多套心理量表与自测题库，探索更好的自己" />
      <Section spacing="lg" className="lofn-quiz-list">
        <Container size="md">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8 text-text-primary shrink-0" />
            <h1 className="text-display-md md:text-display-lg font-semibold text-text-primary">
              测试题
            </h1>
          </div>
          <p className="text-sm sm:text-base text-text-secondary mb-8 md:mb-12">
            选择一个测试项目进行自测，了解自己的心理状态。
          </p>

          <motion.div
            variants={variants.stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3.5"
          >
            {TEST_PROJECTS.map((project) => (
              <TestCard key={project.id} project={project} />
            ))}
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
