import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Button } from '@/ui/Button'
import { variants } from '@/lib/motion'

export function CtaSection() {
  return (
    <Section spacing="lg">
      <Container size="md">
        <motion.div
          variants={variants.slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative overflow-hidden rounded-xl border border-border-subtle bg-bg-surface px-8 py-16 md:py-24 text-center"
        >
          {/* Ambient gradient */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] bg-gradient-signature opacity-[0.08] blur-[100px] rounded-full" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6">
            <h2 className="text-display-lg font-semibold text-text-primary">
              有想法？一起聊聊。
            </h2>
            <p className="text-lg text-text-secondary max-w-md">
              无论是项目合作、技术交流还是随便聊聊，都欢迎联系我。
            </p>
            <Link to="/contact">
              <Button variant="primary" size="lg">
                发起对话
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}
