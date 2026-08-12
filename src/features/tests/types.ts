import type { ComponentType } from 'react'
import type {
  SingleChoiceQuestionProps,
  MultipleChoiceQuestionProps,
  OrderingQuestionProps,
} from './components/types'

/** 通用测验题目（单选/多选/排序） */
export type QuizQuestion =
  | ({ type: 'single' } & SingleChoiceQuestionProps)
  | ({ type: 'multiple' } & MultipleChoiceQuestionProps)
  | ({ type: 'ordering' } & OrderingQuestionProps)

/** 测试项目在列表页展示的附加信息（可异步加载） */
export interface TestProjectInfo {
  /** 题数 */
  questionCount?: number
  /** 展示标签，如「计分：全对全错」「及格线 60 分」 */
  tags?: string[]
}

/** 测试项目契约：一个目录 = 一个自包含的测试项目 */
export interface TestProject {
  /** 项目 id（对应路由 /tests/:id） */
  id: string
  /** 展示名称 */
  title: string
  /** 列表页描述 */
  description: string
  /** 卡片徽标文案（如「量表」「Demo」） */
  badge?: string
  /** 徽标样式类 */
  badgeClassName?: string
  /** 加载列表页附加信息（题数/标签），可选 */
  loadInfo?: () => Promise<TestProjectInfo>
  /** 作答页组件：自包含「加载题库 → 答题 → 计分 → 报告」完整流程 */
  Runner: ComponentType
}
