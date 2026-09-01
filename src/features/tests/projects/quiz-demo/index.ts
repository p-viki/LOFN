import type { TestProject } from '../../types'
import { fetchQuizBank } from './data'
import { QuizDemoRunner } from './Runner'

/** 前端综合测验项目注册配置（示例项目） */
export const quizDemoProject: TestProject = {
  id: 'quiz-demo',
  title: '前端综合测试',
  description:
    'HTML / CSS / JavaScript / TypeScript / React / Vue 综合测试，覆盖单选、多选、排序三种题型，用于自测练习。',
  badge: 'Demo',
  badgeTone: 'info',
  loadInfo: async () => {
    const bank = await fetchQuizBank()
    const mode = bank.meta.scoring.mode
    return {
      questionCount: bank.questions.length,
      tags: [
        `计分：${mode === 'weighted' ? '按选项分值' : '全对全错'}`,
        `及格线 ${bank.meta.scoring.passScore ?? 60} 分`,
      ],
    }
  },
  Runner: QuizDemoRunner,
}
