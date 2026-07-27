import type { SocialLink } from '@/apptypes/common'

export const EXTERNAL_LINKS: Record<string, SocialLink> = {
  github: { label: 'GitHub', href: 'https://github.com/yourusername', icon: 'github' },
  email: { label: 'Email', href: 'mailto:your@email.com', icon: 'mail' },
  linkedin: { label: 'LinkedIn', href: 'https://linkedin.com/in/yourusername', icon: 'linkedin' },
}
