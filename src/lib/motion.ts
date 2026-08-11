import type { Variants } from 'framer-motion'

/**
 * 统一缓动曲线
 */
export const ease = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
}

/**
 * 通用动画变体
 */
export const variants = {
  slideUp: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: ease.out } },
  },
  stagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  },
} satisfies Record<string, Variants>

/**
 * 页面切换过渡
 */
export const pageTransition = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: ease.out } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: ease.inOut } },
}
