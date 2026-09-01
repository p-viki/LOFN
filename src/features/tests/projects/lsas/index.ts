import type { TestProject } from '../../types'
import { fetchLsasBank } from './data'
import { LsasRunner } from './Runner'

/** LSAS 社交焦虑量表项目注册配置 */
export const lsasProject: TestProject = {
  id: 'lsas',
  title: 'LSAS 社交焦虑量表',
  description:
    'Liebowitz Social Anxiety Scale 自评量表，通过 24 个社交场景评估内心体感与行为应对两个维度，适合自我了解。',
  badge: '量表',
  badgeTone: 'purple',
  loadInfo: async () => {
    const bank = await fetchLsasBank()
    return {
      questionCount: bank.questions.length,
      tags: ['计分：量表求和', '双维度评估', '四级解读'],
    }
  },
  Runner: LsasRunner,
}
