export interface SkillCategory {
  name: string
  skills: Skill[]
}

export interface Skill {
  name: string
  level: number // 1-5
  years: number
}

export const skillCategories: SkillCategory[] = [
  {
    name: '框架与语言',
    skills: [
      { name: 'React', level: 5, years: 4 },
      { name: 'TypeScript', level: 5, years: 4 },
      { name: 'Vue', level: 4, years: 2 },
      { name: 'Next.js', level: 4, years: 2 },
    ],
  },
  {
    name: 'AI 开发',
    skills: [
      { name: 'Python', level: 4, years: 3 },
      { name: 'LangChain', level: 4, years: 1 },
      { name: 'OpenAI API', level: 5, years: 2 },
    ],
  },
  {
    name: '工程化',
    skills: [
      { name: 'Vite', level: 5, years: 3 },
      { name: 'Webpack', level: 4, years: 4 },
      { name: 'CI/CD', level: 4, years: 3 },
    ],
  },
  {
    name: '音乐创作',
    skills: [
      { name: 'FL Studio', level: 4, years: 5 },
      { name: 'Web Audio API', level: 4, years: 2 },
      { name: 'MIDI', level: 3, years: 3 },
    ],
  },
]
