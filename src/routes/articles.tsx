import { BookOpen } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'

export default function ArticlesPage() {
  return (
    <>
      <Seo title="文章" description="心理学知识文章，获取专业内容支持" />
      <Section spacing="lg" className="lofn-articles">
        <Container size="sm">
          <Card hover={false} className="lofn-empty-state">
            <BookOpen size={44} className="lofn-empty-state__icon" />
            <h1 className="lofn-empty-state__title">文章</h1>
            <p className="lofn-empty-state__desc">该模块正在规划中，敬请期待。</p>
          </Card>
        </Container>
      </Section>
    </>
  )
}
