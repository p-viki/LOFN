import type { SiteConfig } from '@/types/common'

/**
 * 生成完整页面标题
 */
export function getPageTitle(pageTitle?: string, siteConfig?: SiteConfig): string {
  if (!pageTitle) return `${siteConfig?.title} - ${siteConfig?.description}`
  return `${pageTitle} | ${siteConfig?.title}`
}
