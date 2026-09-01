import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, ArrowRight, RotateCcw, Loader2, AlertCircle, ClipboardList, Wand2, Copy, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Button } from '@/ui/Button'
import { Seo } from '@/components/seo/Seo'
import { LsasQuestion } from './components/LsasQuestion'
import { LsasReport } from './report/LsasReport'
import type { LsasAnswer } from './types'
import { fetchLsasBank, type LsasBank } from './data'
import { getLsasScore } from './lib/scoring'
import { isDev } from '@/lib/dev'

export function LsasRunner() {
  const [bank, setBank] = useState<LsasBank | null>(null)
  const [answers, setAnswers] = useState<Record<number, LsasAnswer>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
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
    // 当前题已完整作答（恐惧/焦虑 + 回避 均已选择）时，自动进入下一题
    const questions = bank?.questions ?? []
    if (
      questions.length > 0 &&
      index === questions[currentIndex].id &&
      answer.fear != null &&
      answer.avoidance != null
    ) {
      setCurrentIndex((cur) => Math.min(cur + 1, questions.length - 1))
    }
  }

  const isAnswered = (answer: LsasAnswer | undefined) =>
    answer != null && answer.fear != null && answer.avoidance != null

  const handlePrev = () => setCurrentIndex((cur) => Math.max(cur - 1, 0))

  const handleNext = () => {
    const questions = bank?.questions ?? []
    const q = questions[currentIndex]
    if (q && isAnswered(answers[q.id])) {
      setCurrentIndex((cur) => Math.min(cur + 1, questions.length - 1))
    }
  }

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
    setCurrentIndex(0)
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
  const current = bank?.questions[currentIndex]

  return (
    <>
      <Seo title="LSAS 社交焦虑量表" description="Liebowitz 社交焦虑量表自评" />
      <Section spacing="sm" className="lofn-lsas">
        <Container size="md">
          <Link to="/tests" className="lofn-runner-back">
            <ArrowLeft size={18} /> 返回测试题
          </Link>

          <div className="lofn-lsas__header">
            <ClipboardList className="lofn-lsas__icon" />
            <h1 className="lofn-lsas__title">
              {bank?.meta.title ?? 'LSAS 社交焦虑量表'}
            </h1>
          </div>
          <p className="lofn-lsas__desc">
            {bank?.meta.description ??
              '评估社交恐惧与回避程度的自评量表，共 24 个场景，每个场景评估「恐惧/焦虑」与「回避」两个维度。'}
          </p>

          {/* 开发测试辅助（仅 isDev 时显示）：悬浮右下角 */}
          {isDev && !loading && !error && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleQuickAnswer}
              className="lofn-dev-tools__quick"
            >
              <Wand2 size={16} className="lofn-dev-tools__quick-icon" /> 一键答题（随机）
            </Button>
          )}

          {/* Loading / Error */}
          {loading && (
            <div className="lofn-loading">
              <Loader2 size={32} className="lofn-loading__spinner" />
              <p>加载量表中...</p>
            </div>
          )}

          {error && (
            <div className="lofn-error">
              <p className="lofn-error__text">{error}</p>
              <Button onClick={() => window.location.reload()} size="sm">
                重新加载
              </Button>
            </div>
          )}

          {!loading && !error && bank && current && (
            <>
              {/* 报告 */}
              {scoreResult && (
                <div className="lofn-lsas__report">
                  <LsasReport result={scoreResult} onReset={handleReset} />

                  {/* 开发测试辅助：复制报告数据结构 */}
                  {isDev && (
                    <div className="lofn-dev-tools__copy">
                      <Button variant="ghost" size="sm" onClick={handleCopyReport}>
                        {copied ? (
                          <>
                            <Check size={14} className="lofn-dev-tools__copy-icon--copied" /> 已复制
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
                  <div className="lofn-lsas-progress">
                    <div className="lofn-lsas-progress__meta">
                      <span className="lofn-lsas-progress__step">第 {currentIndex + 1} / {total} 个场景</span>
                      <span className="lofn-lsas-progress__count">
                        已答 {answeredCount} / {total}
                      </span>
                    </div>
                    <div className="lofn-lsas-progress__track">
                      <div
                        className="lofn-lsas-progress__fill"
                        style={{ width: `${total ? ((currentIndex + 1) / total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="lofn-lsas-progress__hint">
                      选择选项后自动进入下一题，也可通过下方按钮自由切换；每个场景请分别评估「恐惧/焦虑」和「回避」两个维度。
                    </p>
                  </div>

                  {/* 当前题目（一次一题） */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current.id}
                      className="lofn-lsas-question"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.2 }}
                    >
                      <LsasQuestion
                        scenario={`${current.id}. ${current.scenario}`}
                        subscale={current.subscale}
                        fearQuestion={current.fearQuestion}
                        fearOptions={current.fearOptions}
                        avoidanceQuestion={current.avoidanceQuestion}
                        avoidanceOptions={current.avoidanceOptions}
                        value={answers[current.id]}
                        onChange={(answer) => handleChange(current.id, answer)}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* 导航：上一题 / 下一题（需完成当前题） / 最后一题提交 */}
                  <div className="lofn-lsas-nav">
                    {submitError && (
                      <span className="lofn-lsas-nav__error">
                        <AlertCircle size={14} /> {submitError}
                      </span>
                    )}
                    <div className="lofn-lsas-nav__btns">
                      <span className="lofn-lsas-nav__btn">
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={handlePrev}
                          disabled={currentIndex === 0}
                        >
                          <ArrowLeft size={18} /> 上一题
                        </Button>
                      </span>

                      {currentIndex < total - 1 ? (
                        <span className="lofn-lsas-nav__btn">
                          <Button
                            size="lg"
                            onClick={handleNext}
                            disabled={!isAnswered(answers[current.id])}
                          >
                            下一题 <ArrowRight size={18} />
                          </Button>
                        </span>
                      ) : (
                        <span className="lofn-lsas-nav__btn">
                          <Button size="lg" onClick={handleSubmit}>
                            提交并查看结果
                          </Button>
                        </span>
                      )}
                    </div>

                    {currentIndex < total - 1 && !isAnswered(answers[current.id]) && (
                      <p className="lofn-lsas-nav__hint">完成当前场景后再继续下一题</p>
                    )}

                    <button onClick={handleReset} className="lofn-lsas-nav__reset">
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

export default LsasRunner
