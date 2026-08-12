export type SubmissionMode = 'single' | 'batch'

/** 计分方式：exact = 全对全错；weighted = 按选项分值累计 */
export type ScoringMode = 'exact' | 'weighted'

export interface BaseQuestionProps {
  question: string
  /** submissionMode: single = 每题单独提交；batch = 统一提交，默认 batch */
  submissionMode?: SubmissionMode
  /** 本题满分分值（百分制归一化用），默认 1 */
  points?: number
  /** 单题提交时上报所选答案（供父组件统一计分） */
  onSubmit?: (answer: string | string[]) => void
  showCorrectAnswer?: boolean
}

export interface Option {
  id: string
  text: string
  /** 选项分值（weighted 计分模式使用）：选中该选项可得的分数，默认 1 */
  score?: number
}

export interface SingleChoiceQuestionProps extends BaseQuestionProps {
  options: Option[]
  /**
   * 标准答案选项 id。
   * 不提供时进入「纯选择」模式（如自评量表场景）：不显示对错、不显示提交按钮，仅用于收集选择。
   */
  correctOptionId?: string
  /** 题型徽标文案，默认「单选」 */
  badge?: string
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
