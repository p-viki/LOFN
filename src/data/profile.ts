import type { Profile } from '@/apptypes/profile'

export const profile: Profile = {
  name: 'LOFN',
  title: '前端工程师 / AI 开发 / 音乐创作者',
  roles: ['前端工程师', 'AI 开发者', '音乐创作者'],
  bio: '专注于前端工程与用户体验，探索 AI 与创意的交汇点，用代码与声音构建数字世界。',
  avatar: '/images/avatar.svg',
  email: 'your@email.com',
  socials: [
    { label: 'GitHub', href: 'https://github.com/yourusername', icon: 'github' },
    { label: 'Email', href: 'mailto:your@email.com', icon: 'mail' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/yourusername', icon: 'linkedin' },
  ],
}
