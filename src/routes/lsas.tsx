import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, RotateCcw, Loader2, AlertCircle, ClipboardList, Wand2, Copy, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Button } from '@/ui/Button'
import { Seo } from '@/components/seo/Seo'
import { LsasQuestion, LsasReport } from '@/components/quiz'
import type { LsasAnswer } from '@/components/quiz'
import { fetchLsasBank } from '@/data/quizBank'
import type { LsasBank } from '@/data/quizBank'
import { getLsasScore } from '@/lib/scoring-lsas'
import { isDev } from '@/lib/dev'

export default function LsasPage() {
  const [bank, setBank] = useState<LsasBank | null>(null)
  const [answers, setAnswers] = useState<Record<number, LsasAnswer>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchLsasBank()
      .then((data) => {
        if (!cancelled) {
          setBank(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载题库失败')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (index: number, answer: LsasAnswer) => {
    setAnswers((prev) => ({ ...prev, [index]: answer }))
    setSubmitError(null)
  }

  const isAnswered = (answer: LsasAnswer | undefined) =>
    answer != null && answer.fear != null && answer.avoidance != null

  const answeredCount = useMemo(() => {
    if (!bank) return 0
    return bank.questions.filter((q) => isAnswered(answers[q.id])).length
  }, [bank, answers])

  const handleSubmit = () => {
    if (!bank) return
    const unanswered = bank.questions.filter((q) => !isAnswered(answers[q.id]))
    if (unanswered.length > 0) {
      setSubmitError(`还有 ${unanswered.length} 个场景未完成作答（每题需选择「恐惧/焦虑」和「回避」两个维度）`)
      return
    }
    setSubmitted(true)
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setSubmitError(null)
    setCopied(false)
  }

  // ==== 开发测试辅助（仅 ?isDev=true 时生效） ====

  const [copied, setCopied] = useState(false)

  /** 一键答题：每题从选项列表中随机选择一个，并自动提交生成报告 */
  const handleQuickAnswer = () => {
    if (!bank) return
    const random: Record<number, LsasAnswer> = {}
    bank.questions.forEach((q) => {
      const fearIdx = Math.floor(Math.random() * q.fearOptions.length)
      const avoidanceIdx = Math.floor(Math.random() * q.avoidanceOptions.length)
      random[q.id] = {
        fear: q.fearOptions[fearIdx].value,
        avoidance: q.avoidanceOptions[avoidanceIdx].value,
      }
    })
    setAnswers(random)
    setSubmitError(null)
    setSubmitted(true)
  }

  /** 复制报告数据结构到剪贴板 */
  const handleCopyReport = async () => {
    if (!scoreResult) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(scoreResult, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const scoreResult = useMemo(() => {
    if (!bank || !submitted) return null
    return getLsasScore(bank.questions, answers)
  }, [bank, submitted, answers])

  const total = bank?.questions.length ?? 0

  return (
    <>
      <Seo title="LSAS 社交焦虑量表" description="Liebowitz 社交焦虑量表自评" />
      <Section spacing="lg">
        <Container size="md">
          <Link
            to="/quiz"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4 md:mb-6"
          >
            <ArrowLeft size={18} /> 返回测试题
          </Link>

          <div className="flex items-center gap-2.5 mb-2">
            <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-info shrink-0" />
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">
              {bank?.meta.title ?? 'LSAS 社交焦虑量表'}
            </h1>
          </div>
          <p className="text-sm text-text-secondary mb-5 md:mb-8 max-w-2xl leading-relaxed">
            {bank?.meta.description ??
              '评估社交恐惧与回避程度的自评量表，共 24 个场景，每个场景评估「恐惧/焦虑」与「回避」两个维度。'}
          </p>

          {/* 开发测试辅助（仅 isDev 时显示）：悬浮右下角 */}
          {isDev && !loading && !error && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleQuickAnswer}
              className="fixed bottom-6 right-6 z-50 gap-1.5 shadow-lg glow-border bg-bg-surface/90 backdrop-blur"
            >
              <Wand2 size={16} className="text-warning" /> 一键答题（随机）
            </Button>
          )}

          {/* Loading / Error */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
              <Loader2 size={32} className="animate-spin mb-3" />
              <p>加载量表中...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error/5 border border-error/20 text-center">
              <p className="text-error mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} size="sm">
                重新加载
              </Button>
            </div>
          )}

          {!loading && !error && bank && (
            <>
              {/* 报告 */}
              {scoreResult && (
                <div className="mb-6 md:mb-8">
                  <LsasReport result={scoreResult} onReset={handleReset} />

                  {/* 开发测试辅助：复制报告数据结构 */}
                  {isDev && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyReport}
                        className="gap-1.5"
                      >
                        {copied ? (
                          <>
                            <Check size={14} className="text-success" /> 已复制
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> 复制报告数据
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {!scoreResult && (
                <>
                  {/* 进度 */}
                  <div className="mb-5 md:mb-8 p-3.5 sm:p-4 rounded-lg bg-bg-elevated border border-border-subtle">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-text-secondary">作答进度</span>
                      <span className="text-sm font-mono text-text-primary">
                        {answeredCount} / {total}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-surface overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient rounded-full transition-all duration-500"
                        style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-tertiary">
                      每个场景请分别评估「恐惧/焦虑」和「回避」两个维度。
                    </p>
                  </div>

                  {/* 题目列表 */}
                  <div className="space-y-4 md:space-y-6">
                    {bank.questions.map((q) => (
                      <LsasQuestion
                        key={q.id}
                        scenario={`${q.id}. ${q.scenario}`}
                        subscale={q.subscale}
                        fearQuestion={q.fearQuestion}
                        fearOptions={q.fearOptions}
                        avoidanceQuestion={q.avoidanceQuestion}
                        avoidanceOptions={q.avoidanceOptions}
                        value={answers[q.id]}
                        onChange={(answer) => handleChange(q.id, answer)}
                      />
                    ))}
                  </div>

                  {/* 提交 */}
                  <div className="mt-8 flex flex-col items-center gap-3">
                    {submitError && (
                      <span className="flex items-center gap-1.5 text-sm text-error">
                        <AlertCircle size={14} /> {submitError}
                      </span>
                    )}
                    <Button size="lg" onClick={handleSubmit} className="w-full sm:w-auto">
                      提交并查看结果
                    </Button>
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors min-h-[44px] px-2"
                    >
                      <RotateCcw size={14} /> 清空重答
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  )
}
