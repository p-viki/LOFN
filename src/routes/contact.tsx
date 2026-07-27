import { useState } from 'react'
import { motion } from 'framer-motion'
import { Github, Mail, Linkedin, Send } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Input, Textarea } from '@/ui/Input'
import { Button } from '@/ui/Button'
import { variants } from '@/lib/motion'
import { profile } from '@/data/profile'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 后续接入 Formspree / EmailJS
    console.log('Form submitted:', form)
    alert('消息已记录，后续将接入邮件服务。')
    setForm({ name: '', email: '', message: '' })
  }

  const iconMap = { github: Github, mail: Mail, linkedin: Linkedin }

  return (
    <>
      <Seo title="联系" description={`联系 ${profile.name}`} />
      <Section spacing="lg">
        <Container size="sm">
          <motion.div
            variants={variants.slideUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6 mb-12"
          >
            <h1 className="text-display-lg font-semibold text-text-primary">联系我</h1>
            <p className="text-lg text-text-secondary">
              有想法、有问题、或想合作？随时联系我。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Form */}
            <motion.form
              variants={variants.slideUp}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit}
              className="flex flex-col gap-6"
            >
              <Input
                label="姓名"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="你的名字"
              />
              <Input
                label="邮箱"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="your@email.com"
              />
              <Textarea
                label="消息"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                placeholder="想聊些什么？"
              />
              <Button type="submit" variant="primary" size="md">
                <Send size={16} />
                发送
              </Button>
            </motion.form>

            {/* Social links */}
            <motion.div
              variants={variants.slideUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4"
            >
              <h2 className="text-lg font-semibold text-text-primary mb-2">其他渠道</h2>
              {profile.socials.map((social) => {
                const Icon = iconMap[social.icon as keyof typeof iconMap] || Mail
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-lg border border-border-subtle bg-bg-surface hover:border-border-default hover:bg-bg-elevated transition-all group"
                  >
                    <div className="w-10 h-10 rounded-md bg-bg-elevated border border-border-subtle flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon size={18} className="text-text-primary" />
                    </div>
                    <div>
                      <div className="text-text-primary font-medium">{social.label}</div>
                      <div className="text-sm text-text-tertiary">{social.href}</div>
                    </div>
                  </a>
                )
              })}
            </motion.div>
          </div>
        </Container>
      </Section>
    </>
  )
}
