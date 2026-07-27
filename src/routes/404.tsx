import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Button } from '@/ui/Button'

export default function NotFoundPage() {
  return (
    <>
      <Seo title="404" description="页面未找到" />
      <Section spacing="lg">
        <Container size="sm">
          <div className="flex flex-col items-center text-center gap-6">
            <h1 className="text-display-2xl font-semibold text-gradient">404</h1>
            <p className="text-xl text-text-secondary">页面未找到</p>
            <p className="text-text-tertiary">你访问的页面不存在或已被移动。</p>
            <Link to="/">
              <Button variant="primary" size="md">
                返回首页
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
