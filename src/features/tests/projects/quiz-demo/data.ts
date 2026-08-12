import type { QuizQuestion } from '../../types'
import type { ScoringConfig } from '../../lib/scoring'
import { fetchBank } from '../../lib/loadBank'

/** 通用测验题库 meta */
export interface QuizBankMeta {
  title?: string
  description?: string
  /** 计分配置：决定本套题的计算方式 */
  scoring: ScoringConfig
}

/** 通用测验题库（单选/多选/排序） */
export interface QuizBank {
  meta: QuizBankMeta
  questions: QuizQuestion[]
}

const QUIZ_BANK_URL = '/quiz-bank.json'

/** 加载通用测验题库 */
export function fetchQuizBank(): Promise<QuizBank> {
  return fetchBank<QuizBank>(QUIZ_BANK_URL)
}
