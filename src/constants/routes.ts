export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  BLOG: '/blog',
  BLOG_DETAIL: '/blog/:slug',
  PLAYGROUND: '/playground',
  CONTACT: '/contact',
} as const

export const API_ROUTES = {
  GITHUB_USER: 'https://api.github.com/users/',
} as const
