import type { TestProject } from './types'
import { lsasProject } from './projects/lsas'
import { quizDemoProject } from './projects/quiz-demo'

/**
 * 测试项目注册表：列表页与 /tests/:id 路由的单一数据源。
 * 新增测试项目时，在 projects/ 下新建目录并在本数组中注册一行即可。
 */
export const TEST_PROJECTS: TestProject[] = [lsasProject, quizDemoProject]

export function getProject(id: string): TestProject | undefined {
  return TEST_PROJECTS.find((p) => p.id === id)
}
