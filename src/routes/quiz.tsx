import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, ArrowRight, CheckCircle2, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'
import { variants } from '@/lib/motion'
import { fetchQuizBank, fetchLsasBank, type QuizBankMeta } from '@/data/quizBank'
import { cn } from '@/utils/cn'

export default function QuizPage() {
  const [meta, setMeta] = useState<QuizBankMeta | null>(null)
  const [count, setCount] = useState(0)
  const [lsasCount, setLsasCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchQuizBank()
      .then((data) => {
        if (!cancelled) {
          setMeta(data.meta)
          setCount(data.questions.length)
        }
      })
      .catch(() => {
        /* 加载失败时保留占位信息 */
      })
    fetchLsasBank()
      .then((data) => {
        if (!cancelled) setLsasCount(data.questions.length)
      })
      .catch(() => {
        /* 忽略 */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const modeLabel = meta?.scoring.mode === 'weighted' ? '按选项分值' : '全对全错'
  const passScore = meta?.scoring.passScore ?? 60

  return (
    <>
      <Seo title="测试题" description="前端测试题库，一套 demo 题库供练习自测" />
      <Section spacing="lg">
        <Container size="md">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8 text-text-primary shrink-0" />
            <h1 className="text-display-md md:text-display-lg font-semibold text-text-primary">
              测试题
            </h1>
          </div>
          <p className="text-sm sm:text-base text-text-secondary mb-8 md:mb-12">
            选择一个题库进行自测练习。
          </p>

          <motion.div
            variants={variants.stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3.5"
          >
            {/* Demo 题库 */}
            <motion.div variants={variants.slideUp}>
              <Link to="/quiz-demo" className="block group">
                <Card hover className="p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-info/10 text-info border border-info/20">
                          Demo
                        </span>
                        <h3 className="text-lg sm:text-xl font-semibold text-text-primary">
                          {meta?.title ?? '前端综合测试'}
                        </h3>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed mb-4">
                        {meta?.description ?? 'HTML / CSS / JavaScript / TypeScript / React / Vue 综合测试'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-text-tertiary">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-info" />
                          {count || '—'} 题
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BarChart3 size={14} className="text-info" />
                          计分：{modeLabel}
                        </span>
                        <span className="flex items-center gap-1.5">
                          及格线 {passScore} 分
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 flex items-center gap-1 text-sm text-info transition-transform duration-300 group-hover:translate-x-1 mt-1'
                      )}
                    >
                      开始 <ArrowRight size={16} />
                    </span>
                  </div>
                </Card>
              </Link>
            </motion.div>

            {/* LSAS 量表 */}
            <motion.div variants={variants.slideUp}>
              <Link to="/lsas" className="block group">
                <Card hover className="p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                          量表
                        </span>
                        <h3 className="text-lg sm:text-xl font-semibold text-text-primary">
                          LSAS 社交焦虑量表
                        </h3>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed mb-4">
                        Liebowitz Social Anxiety Scale 自评量表，评估社交恐惧与回避程度，适合自我了解。
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-text-tertiary">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-purple-400" />
                          {lsasCount || '—'} 个场景
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BarChart3 size={14} className="text-purple-400" />
                          计分：量表求和
                        </span>
                        <span className="flex items-center gap-1.5">
                          四级解读
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 flex items-center gap-1 text-sm text-info transition-transform duration-300 group-hover:translate-x-1 mt-1'
                      )}
                    >
                      开始 <ArrowRight size={16} />
                    </span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
