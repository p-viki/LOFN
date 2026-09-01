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
      <Link to={`/tests/${project.id}`} className="lofn-quiz-card">
        <Card hover className="lofn-quiz-card__card">
          <div className="lofn-quiz-card__body">
            <div className="lofn-quiz-card__main">
              <div className="lofn-quiz-card__header">
                {project.badge && (
                  <span
                    className={cn(
                      'lofn-quiz-card__badge',
                      project.badgeTone && `lofn-quiz-card__badge--${project.badgeTone}`
                    )}
                  >
                    {project.badge}
                  </span>
                )}
                <h3 className="lofn-quiz-card__title">{project.title}</h3>
              </div>
              <p className="lofn-quiz-card__desc">{project.description}</p>
              <div className="lofn-quiz-card__meta">
                <span className="lofn-quiz-card__meta-item">
                  <CheckCircle2 size={14} />
                  {info?.questionCount ?? '—'} 题
                </span>
                {(info?.tags ?? []).map((tag) => (
                  <span key={tag} className="lofn-quiz-card__meta-item">
                    <BarChart3 size={14} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <span className="lofn-quiz-card__action">
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
          <div className="lofn-quiz-list__header">
            <ClipboardList className="lofn-quiz-list__icon" />
            <h1 className="lofn-quiz-list__title">测试题</h1>
          </div>
          <p className="lofn-quiz-list__desc">
            选择一个测试项目进行自测，了解自己的心理状态。
          </p>

          <motion.div
            variants={variants.stagger}
            initial="hidden"
            animate="visible"
            className="lofn-quiz-list__items"
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
