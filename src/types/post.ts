export interface Post {
  slug: string
  title: string
  description: string
  date: string
  tags: string[]
  cover?: string
  content: string
  readingTime?: number
}
