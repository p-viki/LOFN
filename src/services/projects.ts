import { projects } from '@/data/projects'
import type { Project } from '@/apptypes/project'

/**
 * 获取所有项目
 */
export function getAllProjects(): Project[] {
  return projects
}

/**
 * 获取精选项目
 */
export function getFeaturedProjects(limit?: number): Project[] {
  const featured = projects.filter((p) => p.featured)
  return limit ? featured.slice(0, limit) : featured
}

/**
 * 按 ID 获取项目
 */
export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}

/**
 * 按分类筛选项目
 */
export function getProjectsByCategory(category: string): Project[] {
  if (category === 'all') return projects
  return projects.filter((p) => p.category === category)
}
