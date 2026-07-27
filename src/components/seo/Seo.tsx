import { Helmet } from 'react-helmet-async'
import { siteConfig } from '@/data/site'
import { getPageTitle } from '@/utils/seo'

interface SeoProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
}

export function Seo({ title, description, image, url, type = 'website' }: SeoProps) {
  const fullTitle = getPageTitle(title, siteConfig)
  const metaDescription = description || siteConfig.description
  const metaUrl = url || siteConfig.url
  const metaImage = image || `${siteConfig.url}/og-image.png`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:image" content={metaImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  )
}
