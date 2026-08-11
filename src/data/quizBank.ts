import type {
  SingleChoiceQuestionProps,
  MultipleChoiceQuestionProps,
  OrderingQuestionProps,
  LsasQuestionProps,
} from '@/components/quiz'
import type { ScoringConfig } from '@/lib/scoring'

export type QuizQuestion =
  | ({ type: 'single' } & SingleChoiceQuestionProps)
  | ({ type: 'multiple' } & MultipleChoiceQuestionProps)
  | ({ type: 'ordering' } & OrderingQuestionProps)

export interface QuizBankMeta {
  title?: string
  description?: string
  /** 计分配置：决定本套题的计算方式 */
  scoring: ScoringConfig
}

export interface QuizBank {
  meta: QuizBankMeta
  questions: QuizQuestion[]
}

/** LSAS 量表题库（特殊结构：questions 为场景列表） */
export interface LsasBank {
  meta: QuizBankMeta
  questions: (LsasQuestionProps & { id: number })[]
}

/** Path to the JSON question bank. Can be replaced with an API endpoint later. */
const QUIZ_BANK_URL = '/quiz-bank.json'
const LSAS_BANK_URL = '/lsas.json'

async function fetchBank<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}

/** 加载测验题库（quiz-bank.json） */
export function fetchQuizBank(): Promise<QuizBank> {
  return fetchBank<QuizBank>(QUIZ_BANK_URL)
}

/** 加载 LSAS 量表题库（lsas.json） */
export function fetchLsasBank(): Promise<LsasBank> {
  return fetchBank<LsasBank>(LSAS_BANK_URL)
}
