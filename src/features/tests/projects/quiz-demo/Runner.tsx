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
          <Link to="/tests" className="lofn-runner-back">
            <ArrowLeft size={18} /> 返回测试题
          </Link>

          <div className="lofn-quiz-demo__header">
            <div className="lofn-quiz-demo__title-wrap">
              <h1 className="lofn-quiz-demo__title">
                {bankMeta?.title ?? '题库测试'}
              </h1>
              <p className="lofn-quiz-demo__desc">
                {bankMeta?.description ?? '单选 / 多选 / 排序 题型组件用例'}，共 {questions.length} 题
              </p>
            </div>

            <div className="lofn-quiz-demo__toolbar">
              <span className="lofn-quiz-demo__toolbar-btn">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAllAnswers((v) => !v)}
                >
                  {showAllAnswers ? '隐藏答案' : '显示全部答案'}
                </Button>
              </span>
              <span className="lofn-quiz-demo__toolbar-btn">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw size={14} /> 重置
                </Button>
              </span>
            </div>
          </div>

          {/* Loading / Error */}
          {loading && (
            <div className="lofn-loading">
              <Loader2 size={32} className="lofn-loading__spinner" />
              <p>加载题库中...</p>
            </div>
          )}

          {error && (
            <div className="lofn-error">
              <p className="lofn-error__text">{error}</p>
              <Button onClick={handleRetry} size="sm">重新加载</Button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* 最终得分 */}
              {scoreResult && (
                <div className="lofn-quiz-demo__result">
                  <ScoreResult result={scoreResult} onReset={handleReset} />
                </div>
              )}

              {/* Progress summary */}
              {!scoreResult && (
                <div className="lofn-quiz-demo-progress">
                  <div className="lofn-quiz-demo-progress__meta">
                    <span className="lofn-quiz-demo-progress__label">答题进度</span>
                    <span className="lofn-quiz-demo-progress__count">
                      {submittedCount} / {questions.length}
                    </span>
                  </div>
                  <div className="lofn-quiz-demo-progress__track">
                    <div
                      className="lofn-quiz-demo-progress__fill"
                      style={{ width: `${questions.length ? (submittedCount / questions.length) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="lofn-quiz-demo-progress__stats">
                    <span className="lofn-quiz-demo-progress__stat lofn-quiz-demo-progress__stat--correct">
                      <CheckCircle size={16} /> {correctCount} 正确
                    </span>
                    <span className="lofn-quiz-demo-progress__stat lofn-quiz-demo-progress__stat--wrong">
                      <XCircle size={16} /> {submittedCount - correctCount} 错误
                    </span>
                    <span className="lofn-quiz-demo-progress__mode">
                      计分方式：
                      {bankMeta?.scoring.mode === 'weighted' ? '按选项分值' : '全对全错'}
                    </span>
                  </div>
                </div>
              )}

              {/* Batch submit */}
              {batchQuestions.length > 0 && !batchSubmitted && !showAllAnswers && (
                <div className="lofn-quiz-demo-batch">
                  <div className="lofn-quiz-demo-batch__body">
                    <div className="lofn-quiz-demo-batch__info">
                      <p className="lofn-quiz-demo-batch__title">批量提交题目</p>
                      <p className="lofn-quiz-demo-batch__count">
                        已作答 {batchQuestions.filter((i) => isBatchAnswered(batchAnswers[i], questions[i].type)).length} / {batchQuestions.length} 题
                      </p>
                    </div>
                    <div className="lofn-quiz-demo-batch__action">
                      {batchError && (
                        <span className="lofn-quiz-demo-batch__error">
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
              <div className="lofn-quiz-demo-questions">
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
