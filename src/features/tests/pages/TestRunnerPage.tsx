import { useParams, Navigate } from 'react-router-dom'
import { getProject } from '../registry'

/**
 * 通用作答容器：根据 /tests/:id 从注册表查找测试项目并渲染其作答页。
 * 新增测试项目只需注册，无需新增路由。
 */
export default function TestRunnerPage() {
  const { id } = useParams()
  const project = getProject(id ?? '')

  if (!project) return <Navigate to="/tests" replace />

  const Runner = project.Runner
  return <Runner />
}
