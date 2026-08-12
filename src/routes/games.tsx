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
          <Card className="text-center py-16 sm:py-24">
            <Gamepad2 size={44} className="mx-auto mb-4 text-info" />
            <h1 className="text-2xl font-semibold text-text-primary mb-2">心理游戏</h1>
            <p className="text-sm text-text-secondary">该模块正在规划中，敬请期待。</p>
          </Card>
        </Container>
      </Section>
    </>
  )
}
