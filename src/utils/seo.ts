import type { SiteConfig } from '@/apptypes/common'

interface SeoOptions {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
}

/**
 * 生成完整页面标题
 */
export function getPageTitle(pageTitle?: string, siteConfig?: SiteConfig): string {
  if (!pageTitle) return `${siteConfig?.title} - ${siteConfig?.description}`
  return `${pageTitle} | ${siteConfig?.title}`
}

/**
 * 生成 JSON-LD 结构化数据
 */
export function generateJsonLd(options: {
  type: 'Person' | 'WebSite' | 'BlogPosting'
  data: Record<string, unknown>
}): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': options.type,
    ...options.data,
  })
}

/**
 * 构建 SEO 元信息对象
 */
export function buildSeoMeta(options: SeoOptions, siteConfig: SiteConfig) {
  const title = options.title || siteConfig.title
  const description = options.description || siteConfig.description
  const url = options.url || siteConfig.url
  const image = options.image || `${siteConfig.url}/og-image.png`

  return {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogImage: image,
    ogType: options.type || 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  }
}
