import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Button } from '@/ui/Button'
import { Seo } from '@/components/seo/Seo'
import {
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  OrderingQuestion,
  ScoreResult,
} from '../../components'
import { fetchQuizBank, type QuizBankMeta } from './data'
import { calculateBankScore, isFullyCorrect, type QuizAnswer } from '../../lib/scoring'
import type { QuizQuestion } from '../../types'

type SingleAnswer = string | null
type MultipleAnswer = string[]
type OrderingAnswer = string[]
type BatchAnswer = SingleAnswer | MultipleAnswer | OrderingAnswer

function isBatchQuestion(q: QuizQuestion) {
  return q.submissionMode !== 'single'
}

function isBatchAnswered(answer: BatchAnswer | undefined, type: QuizQuestion['type']): boolean {
  if (answer === undefined) return false
  if (type === 'single') return Boolean(answer as SingleAnswer)
  if (type === 'multiple') return (answer as MultipleAnswer).length > 0
  return Array.isArray(answer) && answer.length > 0
}

export function QuizDemoRunner() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [bankMeta, setBankMeta] = useState<QuizBankMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [singleAnswers, setSingleAnswers] = useState<Record<number, QuizAnswer>>({})
  const [batchAnswers, setBatchAnswers] = useState<Record<number, BatchAnswer>>({})
  const [batchSubmitted, setBatchSubmitted] = useState(false)
  const [showAllAnswers, setShowAllAnswers] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)

  const loadBank = () => {
    setLoading(true)
    setError(null)
    return fetchQuizBank()
      .then((data) => {
        setQuestions(data.questions)
        setBankMeta(data.meta)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '加载题库失败')
        setLoading(false)
      })
  }

  useEffect(() => {
    let cancelled = false
    fetchQuizBank()
      .then((data) => {
        if (!cancelled) {
          setQuestions(data.questions)
          setBankMeta(data.meta)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载题库失败')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  const { batchQuestions, singleQuestions } = useMemo(() => {
    const batch: number[] = []
    const single: number[] = []
    questions.forEach((q, index) => {
      if (isBatchQuestion(q)) batch.push(index)
      else single.push(index)
    })
    return { batchQuestions: batch, singleQuestions: single }
  }, [questions])

  const handleSingleSubmit = (index: number, answer: string | string[]) => {
    setSingleAnswers((prev) => ({ ...prev, [index]: answer }))
  }

  const handleBatchChange = (index: number, answer: BatchAnswer) => {
    setBatchAnswers((prev) => ({
      ...prev,
      [index]: answer,
    }))
    setBatchError(null)
  }

  const handleBatchSubmit = () => {
    const unanswered = batchQuestions.filter((index) => {
      const q = questions[index]
      return !isBatchAnswered(batchAnswers[index], q.type)
    })

    if (unanswered.length > 0) {
      setBatchError(`还有 ${unanswered.length} 道批量提交题目未作答`)
      return
    }

    setBatchSubmitted(true)
    setBatchError(null)
  }

  const handleReset = () => {
    setSingleAnswers({})
    setBatchAnswers({})
    setBatchSubmitted(false)
    setShowAllAnswers(false)
    setBatchError(null)
  }

  const handleRetry = () => loadBank()

  // 所有已提交的答案（单题模式 + 批量模式）
  const allAnswers = useMemo(() => {
    const answers: Record<number, QuizAnswer | undefined> = { ...singleAnswers }
    if (batchSubmitted) {
      batchQuestions.forEach((index) => {
        answers[index] = batchAnswers[index] as QuizAnswer | undefined
      })
    }
    return answers
  }, [singleAnswers, batchAnswers, batchSubmitted, batchQuestions])

  // 进度统计（答对题数 / 已答题数）
  const { correctCount, submittedCount } = useMemo(() => {
    let correct = 0
    let submitted = 0

    singleQuestions.forEach((index) => {
      if (singleAnswers[index] !== undefined) {
        submitted += 1
        if (isFullyCorrect(questions[index], singleAnswers[index]!)) correct += 1
      }
    })

    if (batchSubmitted) {
      batchQuestions.forEach((index) => {
        submitted += 1
        if (isFullyCorrect(questions[index], batchAnswers[index]!)) correct += 1
      })
    }

    return { correctCount: correct, submittedCount: submitted }
  }, [singleAnswers, batchAnswers, batchSubmitted, questions, singleQuestions, batchQuestions])

  const allFinished = singleQuestions.every((i) => singleAnswers[i] !== undefined) &&
    (batchQuestions.length === 0 || batchSubmitted)

  // 最终计分结果（百分制）
  const scoreResult = useMemo(() => {
    if (!allFinished || !bankMeta) return null
    return calculateBankScore(questions, allAnswers, bankMeta.scoring)
  }, [allFinished, bankMeta, questions, allAnswers])

  const renderQuestion = (q: QuizQuestion, index: number) => {
    const key = `q-${index}`
    const isBatch = isBatchQuestion(q)
    const showCorrect = showAllAnswers || (isBatch && batchSubmitted) || (!isBatch && singleAnswers[index] !== undefined)

    switch (q.type) {
      case 'single':
        return (
          <SingleChoiceQuestion
            key={key}
            question={`${index + 1}. ${q.question}`}
            options={q.options}
            correctOptionId={q.correctOptionId}
            submissionMode={q.submissionMode}
            points={q.points}
            value={isBatch ? (batchAnswers[index] as SingleAnswer ?? null) : undefined}
            onChange={isBatch ? (id) => handleBatchChange(index, id) : undefined}
            onSubmit={!isBatch ? (answer) => handleSingleSubmit(index, answer) : undefined}
            showCorrectAnswer={showCorrect}
          />
        )
      case 'multiple':
        return (
          <MultipleChoiceQuestion
            key={key}
            question={`${index + 1}. ${q.question}`}
            options={q.options}
            correctOptionIds={q.correctOptionIds}
            submissionMode={q.submissionMode}
            points={q.points}
            value={isBatch ? (batchAnswers[index] as MultipleAnswer ?? []) : undefined}
            onChange={isBatch ? (ids) => handleBatchChange(index, ids) : undefined}
            onSubmit={!isBatch ? (answer) => handleSingleSubmit(index, answer) : undefined}
            showCorrectAnswer={showCorrect}
          />
        )
      case 'ordering':
        return (
          <OrderingQuestion
            key={key}
            question={`${index + 1}. ${q.question}`}
            items={q.items}
            correctOrder={q.correctOrder}
            submissionMode={q.submissionMode}
            points={q.points}
            value={isBatch ? (batchAnswers[index] as OrderingAnswer ?? q.items.map((i) => i.id)) : undefined}
            onChange={isBatch ? (order) => handleBatchChange(index, order) : undefined}
            onSubmit={!isBatch ? (answer) => handleSingleSubmit(index, answer) : undefined}
            showCorrectAnswer={showCorrect}
          />
        )
    }
  }

  return (
    <>
      <Seo title="题库测试" description="测试题组件用例展示" />
      <Section spacing="lg" className="lofn-quiz-demo">
        <Container size="md">
          <Link
            to="/tests"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4 md:mb-6"
          >
            <ArrowLeft size={18} /> 返回测试题
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 md:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-text-primary mb-1">
                {bankMeta?.title ?? '题库测试'}
              </h1>
              <p className="text-sm text-text-secondary">
                {bankMeta?.description ?? '单选 / 多选 / 排序 题型组件用例'}，共 {questions.length} 题
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAllAnswers((v) => !v)}
                className="flex-1 sm:flex-none"
              >
                {showAllAnswers ? '隐藏答案' : '显示全部答案'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 flex-1 sm:flex-none"
              >
                <RotateCcw size={14} /> 重置
              </Button>
            </div>
          </div>

          {/* Loading / Error */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
              <Loader2 size={32} className="animate-spin mb-3" />
              <p>加载题库中...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 md:mb-8 p-4 md:p-6 rounded-lg bg-error/5 border border-error/20 text-center">
              <p className="text-error mb-4">{error}</p>
              <Button onClick={handleRetry} size="sm">重新加载</Button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* 最终得分 */}
              {scoreResult && (
                <div className="mb-6 md:mb-8">
                  <ScoreResult result={scoreResult} onReset={handleReset} />
                </div>
              )}

              {/* Progress summary */}
              {!scoreResult && (
                <div className="lofn-quiz-demo-progress mb-5 md:mb-8 p-3.5 sm:p-4 rounded-lg bg-bg-elevated border border-border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">答题进度</span>
                    <span className="text-sm font-mono text-text-primary">
                      {submittedCount} / {questions.length}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-surface overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient rounded-full transition-all duration-500"
                      style={{ width: `${questions.length ? (submittedCount / questions.length) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="flex items-center gap-1.5 text-success">
                      <CheckCircle size={16} /> {correctCount} 正确
                    </span>
                    <span className="flex items-center gap-1.5 text-error">
                      <XCircle size={16} /> {submittedCount - correctCount} 错误
                    </span>
                    <span className="ml-auto text-sm font-medium text-text-tertiary">
                      计分方式：
                      {bankMeta?.scoring.mode === 'weighted' ? '按选项分值' : '全对全错'}
                    </span>
                  </div>
                </div>
              )}

              {/* Batch submit */}
              {batchQuestions.length > 0 && !batchSubmitted && !showAllAnswers && (
                <div className="lofn-quiz-demo-batch mb-5 md:mb-8 p-3.5 sm:p-4 rounded-lg border border-border-subtle bg-bg-elevated/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-text-primary font-medium mb-1">批量提交题目</p>
                      <p className="text-xs text-text-secondary">
                        已作答 {batchQuestions.filter((i) => isBatchAnswered(batchAnswers[i], questions[i].type)).length} / {batchQuestions.length} 题
                      </p>
                    </div>
                    <div className="flex flex-col items-stretch sm:items-end gap-2">
                      {batchError && (
                        <span className="flex items-center gap-1.5 text-xs text-error">
                          <AlertCircle size={14} /> {batchError}
                        </span>
                      )}
                      <Button onClick={handleBatchSubmit} size="sm">
                        提交所有批量题目
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions */}
              <div className="lofn-quiz-demo-questions space-y-4 md:space-y-6">
                {questions.map((q, index) => renderQuestion(q, index))}
              </div>
            </>
          )}
        </Container>
      </Section>
    </>
  )
}

export default QuizDemoRunner
