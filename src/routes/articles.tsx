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
          <Card className="text-center py-16 sm:py-24">
            <BookOpen size={44} className="mx-auto mb-4 text-info" />
            <h1 className="text-2xl font-semibold text-text-primary mb-2">文章</h1>
            <p className="text-sm text-text-secondary">该模块正在规划中，敬请期待。</p>
          </Card>
        </Container>
      </Section>
    </>
  )
}
