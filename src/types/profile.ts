import type { SocialLink } from './common'

export interface Profile {
  name: string
  title: string
  roles: string[]
  bio: string
  avatar: string
  email: string
  socials: SocialLink[]
}
