export interface Experience {
  company: string
  role: string
  period: string
  description: string
  achievements: string[]
}

export const experiences: Experience[] = [
  {
    company: '某科技公司',
    role: '高级前端工程师',
    period: '2022 - 至今',
    description: '负责核心产品的前端架构与性能优化。',
    achievements: [
      '主导前端架构升级，构建效率提升 40%',
      '搭建组件库，覆盖 50+ 业务组件',
      '优化首屏加载，LCP 从 3.2s 降至 1.1s',
    ],
  },
  {
    company: '某创业公司',
    role: '前端工程师',
    period: '2020 - 2022',
    description: '从 0 到 1 搭建产品前端体系。',
    achievements: ['建立前端工程化流程', '实现设计系统落地', '推动 TypeScript 全面接入'],
  },
]
