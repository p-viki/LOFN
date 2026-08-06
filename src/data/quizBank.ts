import type {
  SingleChoiceQuestionProps,
  MultipleChoiceQuestionProps,
  OrderingQuestionProps,
} from '@/components/quiz'

export type QuizQuestion =
  | ({ type: 'single' } & SingleChoiceQuestionProps)
  | ({ type: 'multiple' } & MultipleChoiceQuestionProps)
  | ({ type: 'ordering' } & OrderingQuestionProps)

/** Path to the JSON question bank. Can be replaced with an API endpoint later. */
const QUIZ_BANK_URL = '/quiz-bank.json'

/**
 * Fetch question bank from JSON file (or future API).
 * Returns parsed questions.
 */
export async function fetchQuizBank(): Promise<QuizQuestion[]> {
  const response = await fetch(QUIZ_BANK_URL)
  if (!response.ok) {
    throw new Error(`Failed to load quiz bank: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as QuizQuestion[]
  return data
}

/** 按题型筛选题目 */
export function filterQuestionsByType(questions: QuizQuestion[], type: QuizQuestion['type']) {
  return questions.filter((q) => q.type === type)
}

/** 获取指定数量的随机题目 */
export function getRandomQuestions(questions: QuizQuestion[], count: number) {
  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
