import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

/**
 * Markdown 解析插件配置
 */
export const remarkPlugins = [remarkGfm]
export const rehypePlugins = [rehypeSlug, rehypeHighlight]
