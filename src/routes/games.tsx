import { Gamepad2 } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'

export default function GamesPage() {
  return (
    <>
      <Seo title="心理游戏" description="互动式心理小游戏，在体验中认识自己" />
      <Section spacing="lg" className="lofn-games">
        <Container size="sm">
          <Card hover={false} className="lofn-empty-state">
            <Gamepad2 size={44} className="lofn-empty-state__icon" />
            <h1 className="lofn-empty-state__title">心理游戏</h1>
            <p className="lofn-empty-state__desc">该模块正在规划中，敬请期待。</p>
          </Card>
        </Container>
      </Section>
    </>
  )
}
