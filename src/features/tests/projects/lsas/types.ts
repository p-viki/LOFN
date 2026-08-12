/** LSAS 因子：si = 社交互动（11 题）；ps = 表演（13 题） */
export type LsasSubscale = 'si' | 'ps'

/** LSAS 单场景答案：内心体感（fear）+ 行为应对（avoidance）两个维度 */
export interface LsasAnswer {
  fear: number | null
  avoidance: number | null
}

/** 去术语化的等级选项（0-3），用具体体感/行为描述代替「恐惧/回避」等直白词汇 */
export interface LsasDimensionOption {
  /** 选项分值（0-3） */
  value: number
  /** 具体生理感受或行为决策描述 */
  text: string
}

export interface LsasQuestionProps {
  /** 场景描述 */
  scenario: string
  /** 归属因子 */
  subscale: LsasSubscale
  /** 内心体感子题（fear 维度）题干 */
  fearQuestion: string
  /** 内心体感子题选项（0-3） */
  fearOptions: LsasDimensionOption[]
  /** 行为应对子题（avoidance 维度）题干 */
  avoidanceQuestion: string
  /** 行为应对子题选项（0-3） */
  avoidanceOptions: LsasDimensionOption[]
  /** 选择变化时上报答案 */
  onChange?: (answer: LsasAnswer) => void
  /** 受控当前答案 */
  value?: LsasAnswer
}
