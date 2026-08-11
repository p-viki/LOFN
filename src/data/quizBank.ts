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
