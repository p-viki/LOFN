import type { ScoringMode } from '@/components/quiz'
import type { QuizQuestion } from '@/data/quizBank'

/** 题库计分配置（定义在题库数据的 meta.scoring 中） */
export interface ScoringConfig {
  /** 计分方式：exact = 全对全错；weighted = 按选项分值累计 */
  mode: ScoringMode
  /** 及格线（百分制 0-100），默认 60 */
  passScore?: number
}

/** 单题计分结果 */
export interface QuestionScore {
  index: number
  /** 本题得分 */
  earned: number
  /** 本题满分 */
  total: number
  /** 是否完全正确（得分达到满分） */
  correct: boolean
  /** 是否已作答 */
  answered: boolean
}

/** 整套计分结果（百分制） */
export interface BankScoreResult {
  /** 总得分 */
  earned: number
  /** 总分值 */
  total: number
  /** 百分制得分（0-100，四舍五入保留 1 位小数） */
  score: number
  /** 是否及格 */
  passed: boolean
  passScore: number
  correctCount: number
  wrongCount: number
  unansweredCount: number
  perQuestion: QuestionScore[]
}

/** 统一答案类型：单选为 string | null，多选/排序为 string[] */
export type QuizAnswer = string | string[] | null

/** 题目默认满分 */
const DEFAULT_POINTS = 1

const optionScore = (score: number | undefined): number => score ?? 1

/**
 * 计算单题得分。
 *
 * exact（全对全错）：
 * - 单选/多选/排序：答案与标准答案完全一致得满分 points，否则 0 分
 *
 * weighted（选项加权，支持部分得分）：
 * - 单选：得分为所选选项的 score（满分取所有选项中的最大 score）
 * - 多选：得分为「选中的正确选项」score 之和（满分取全部正确选项 score 之和；错选不计分也不扣分）
 * - 排序：按正确位置占比计分（正确位置数 / 总项数 × points）
 */
export function getQuestionScore(
  q: QuizQuestion,
  answer: QuizAnswer | undefined,
  mode: ScoringMode = 'exact'
): QuestionScore {
  const total = getQuestionMaxScore(q, mode)

  // 未作答
  if (answer === undefined) {
    return { index: 0, earned: 0, total, correct: false, answered: false }
  }

  const isAnswered = (): boolean => {
    if (q.type === 'single') return Boolean(answer as string | null)
    return Array.isArray(answer) && (answer as string[]).length > 0
  }
  if (!isAnswered()) {
    return { index: 0, earned: 0, total, correct: false, answered: false }
  }

  if (mode === 'weighted') {
    const earned = getWeightedEarned(q, answer)
    return {
      index: 0,
      earned: round2(earned),
      total,
      correct: round2(earned) >= round2(total) && total > 0,
      answered: true,
    }
  }

  // exact：全对全错
  const correct = isFullyCorrect(q, answer)
  return {
    index: 0,
    earned: correct ? total : 0,
    total,
    correct,
    answered: true,
  }
}

/** 题目满分（exact 模式 = points；weighted 模式按题型计算） */
export function getQuestionMaxScore(q: QuizQuestion, mode: ScoringMode = 'exact'): number {
  const points = q.points ?? DEFAULT_POINTS
  if (mode === 'exact') return points

  switch (q.type) {
    case 'single':
      return Math.max(...q.options.map((o) => optionScore(o.score)))
    case 'multiple': {
      const correctIds = new Set(q.correctOptionIds)
      return q.options.reduce((sum, o) => (correctIds.has(o.id) ? sum + optionScore(o.score) : sum), 0)
    }
    case 'ordering':
      return points
  }
}

/** 完全正确判断（exact 模式使用） */
export function isFullyCorrect(q: QuizQuestion, answer: QuizAnswer): boolean {
  switch (q.type) {
    case 'single':
      return (answer as string | null) === q.correctOptionId
    case 'multiple': {
      const ids = answer as string[]
      return (
        ids.length === q.correctOptionIds.length &&
        ids.every((id) => q.correctOptionIds.includes(id))
      )
    }
    case 'ordering': {
      const order = answer as string[]
      return (
        order.length === q.correctOrder.length &&
        order.every((id, index) => id === q.correctOrder[index])
      )
    }
  }
}

/** weighted 模式下的本题得分 */
function getWeightedEarned(q: QuizQuestion, answer: QuizAnswer): number {
  switch (q.type) {
    case 'single': {
      const selectedId = answer as string | null
      const selected = q.options.find((o) => o.id === selectedId)
      return selected ? optionScore(selected.score) : 0
    }
    case 'multiple': {
      const selectedIds = new Set(answer as string[])
      const correctIds = new Set(q.correctOptionIds)
      return q.options.reduce(
        (sum, o) => (selectedIds.has(o.id) && correctIds.has(o.id) ? sum + optionScore(o.score) : sum),
        0
      )
    }
    case 'ordering': {
      const order = answer as string[]
      const matched = order.filter((id, index) => id === q.correctOrder[index]).length
      return (matched / q.correctOrder.length) * (q.points ?? DEFAULT_POINTS)
    }
  }
}

/**
 * 计算整套成绩（百分制）。
 * @param questions 全部题目
 * @param answers   各题答案（key 为题目索引），未作答的题按 0 分计
 * @param scoring   计分配置（来自题库 meta.scoring）
 */
export function calculateBankScore(
  questions: QuizQuestion[],
  answers: Record<number, QuizAnswer | undefined>,
  scoring: ScoringConfig
): BankScoreResult {
  const passScore = scoring.passScore ?? 60
  const perQuestion: QuestionScore[] = questions.map((q, index) => {
    const score = getQuestionScore(q, answers[index], scoring.mode)
    return { ...score, index }
  })

  const earned = round2(perQuestion.reduce((sum, s) => sum + s.earned, 0))
  const total = round2(perQuestion.reduce((sum, s) => sum + s.total, 0))
  const score = total > 0 ? round1((earned / total) * 100) : 0

  return {
    earned,
    total,
    score,
    passed: score >= passScore,
    passScore,
    correctCount: perQuestion.filter((s) => s.answered && s.correct).length,
    wrongCount: perQuestion.filter((s) => s.answered && !s.correct).length,
    unansweredCount: perQuestion.filter((s) => !s.answered).length,
    perQuestion,
  }
}

const round2 = (n: number): number => Math.round(n * 100) / 100
const round1 = (n: number): number => Math.round(n * 10) / 10
