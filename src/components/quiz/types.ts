export type SubmissionMode = 'single' | 'batch'

export interface BaseQuestionProps {
  question: string
  /** submissionMode: single = 每题单独提交；batch = 统一提交，默认 batch */
  submissionMode?: SubmissionMode
  onSubmit?: (isCorrect: boolean) => void
  showCorrectAnswer?: boolean
}

export interface Option {
  id: string
  text: string
}

export interface SingleChoiceQuestionProps extends BaseQuestionProps {
  options: Option[]
  correctOptionId: string
  /** 用于 batch 模式：向父组件同步当前选中的选项 */
  onChange?: (selectedId: string | null) => void
  /** 用于 batch 模式：受控当前选中值 */
  value?: string | null
}

export interface MultipleChoiceQuestionProps extends BaseQuestionProps {
  options: Option[]
  correctOptionIds: string[]
  /** 用于 batch 模式：向父组件同步当前选中的选项集合 */
  onChange?: (selectedIds: string[]) => void
  /** 用于 batch 模式：受控当前选中值 */
  value?: string[]
}

export interface OrderingQuestionProps extends BaseQuestionProps {
  items: Option[]
  correctOrder: string[]
  /** 用于 batch 模式：向父组件同步当前排序 */
  onChange?: (order: string[]) => void
  /** 用于 batch 模式：受控当前排序 */
  value?: string[]
}

export type QuestionType = 'single' | 'multiple' | 'ordering'
