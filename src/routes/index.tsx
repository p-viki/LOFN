import { Seo } from '@/components/seo/Seo'
import { Hero } from '@/components/hero/Hero'
import { IdentityBento } from '@/components/home/IdentityBento'
import { FeaturedProjects } from '@/components/home/FeaturedProjects'
import { CtaSection } from '@/components/home/CtaSection'

export default function HomePage() {
  return (
    <>
      <Seo />
      <Hero />
      <IdentityBento />
      <FeaturedProjects />
      <CtaSection />
    </>
  )
}
