export interface Project {
  id: string
  title: string
  description: string
  cover: string
  tags: string[]
  category: 'frontend' | 'ai' | 'music' | 'fullstack'
  demoUrl?: string
  repoUrl?: string
  date: string
  featured: boolean
  content?: string
}
