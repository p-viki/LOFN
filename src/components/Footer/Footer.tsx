import { Github, Mail, Linkedin } from 'lucide-react'
import { Container } from '@/ui/Container'
import { profile } from '@/data/profile'

const iconMap = {
  github: Github,
  mail: Mail,
  linkedin: Linkedin,
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border-subtle py-12">
      <Container size="lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-mono font-bold tracking-tighter text-text-primary">
              {profile.name}
            </span>
            <span className="text-sm text-text-tertiary">
              {profile.title}
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {profile.socials.map((social) => {
              const Icon = iconMap[social.icon as keyof typeof iconMap] || Github
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-text-tertiary hover:text-text-primary transition-colors hover:bg-bg-elevated rounded-sm"
                  aria-label={social.label}
                >
                  <Icon size={18} />
                </a>
              )
            })}
          </div>

          {/* Copyright */}
          <div className="text-sm text-text-tertiary">
            &copy; {currentYear} {profile.name}. All rights reserved.
          </div>
        </div>
      </Container>
    </footer>
  )
}
