import type { Post } from '@/apptypes/post'
import { estimateReadingTime } from '@/utils/slug'

/**
 * 获取所有文章（后续从 content/blog/ 读取 Markdown）
 */
export function getAllPosts(): Post[] {
  // TODO: 接入 Markdown 文件读取
  return []
}

/**
 * 按 slug 获取文章
 */
export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

/**
 * 解析文章元数据
 */
export function parsePost(raw: string, slug: string): Post {
  const readingTime = estimateReadingTime(raw)
  return {
    slug,
    title: '',
    description: '',
    date: new Date().toISOString(),
    tags: [],
    content: raw,
    readingTime,
  }
}
