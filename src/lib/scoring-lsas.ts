import type { LsasAnswer, LsasSubscale } from '@/components/quiz'

/** LSAS 总分等级（五级） */
export type LsasLevel = 'none' | 'mild' | 'moderate' | 'severe' | 'extreme'

export interface LsasLevelInfo {
  level: LsasLevel
  label: string
  min: number
  max: number
  description: string
}

/** 总分级差与解读（按 LSAS 总分 0-144，五级标准） */
export const LSAS_LEVELS: LsasLevelInfo[] = [
  {
    level: 'none',
    label: '无显著社交焦虑',
    min: 0,
    max: 29,
    description: '总分低于 30，社交适应正常，未表现出明显的社交困扰。',
  },
  {
    level: 'mild',
    label: '轻度社交焦虑',
    min: 30,
    max: 49,
    description: '总分 30-49，特定场景下略感不适，社交功能基本不受影响。',
  },
  {
    level: 'moderate',
    label: '中度社交焦虑',
    min: 50,
    max: 64,
    description: '总分 50-64，存在明显的社交困扰与偶发性回避，值得关注并适当调整。',
  },
  {
    level: 'severe',
    label: '重度社交焦虑',
    min: 65,
    max: 79,
    description: '总分 65-79，社会功能受到显著阻碍，建议寻求专业评估与帮助。',
  },
  {
    level: 'extreme',
    label: '极重度社交焦虑',
    min: 80,
    max: 144,
    description: '总分 80 及以上，社交焦虑全面影响日常工作与生活，建议尽快寻求专业帮助。',
  },
]

/** 四象限类型 */
export type QuadrantType =
  | 'high-high'
  | 'high-low'
  | 'low-high'
  | 'low-low'

export interface QuadrantInfo {
  type: QuadrantType
  label: string
  description: string
  advice: string[]
}

/**
 * 四象限心理画像（Fear × Avoidance）。
 * 判定阈值：fear/avoidance 各自超过满分（72）的 50%（36 分）视为「高」。
 */
export function getQuadrant(
  fearTotal: number,
  avoidanceTotal: number
): QuadrantInfo {
  const highFear = fearTotal >= 36
  const highAvoidance = avoidanceTotal >= 36

  if (highFear && highAvoidance) {
    return {
      type: 'high-high',
      label: '高内心消耗 · 高行为回避（全面受阻型）',
      description:
        '内心体感负担重，且行为层面已明显中断社交。这类状态对日常生活影响最大，需要重点关注与干预。',
      advice: [
        '从风险最低的场景开始，制定「微步暴露」计划，逐步重建社交行为。',
        '关注长期积累的心理代偿疲劳，必要时寻求专业认知行为干预。',
      ],
    }
  }
  if (highFear && !highAvoidance) {
    return {
      type: 'high-low',
      label: '高内心消耗 · 低行为回避（高功能/硬撑型）',
      description:
        '行为上能完成任务，但内心消耗巨大——这是职场人群最常见的状态，极易引发隐性疲劳或躯体化不适。',
      advice: [
        '练习「降噪与放松」技巧（呼吸调节、正念），在社交前给身体一段缓冲。',
        '允许自己不完美，减少「表演式完美」的内在要求。',
      ],
    }
  }
  if (!highFear && highAvoidance) {
    return {
      type: 'low-high',
      label: '低内心消耗 · 高行为回避（社交偏好/习惯回避型）',
      description:
        '回避更多源于性格偏好或精力管理，而非焦虑驱动，对社会功能的破坏性较低。',
      advice: [
        '区分「不想去」与「不敢去」，确认回避是否真的符合内心意愿。',
        '如希望扩展社交圈，可从感兴趣的领域逐步增加互动频率。',
      ],
    }
  }
  return {
    type: 'low-low',
    label: '低内心消耗 · 低行为回避（高社交适应型）',
    description:
      '心态平静、行为顺畅，社交适应良好，内心消耗与行为回避均处于低水平。',
    advice: [
      '维持当前的社交节奏与自我照顾习惯。',
      '可将自身应对经验分享给身边有困扰的朋友。',
    ],
  }
}

/** 触发场景画像（ps vs si） */
export interface SceneProfile {
  /** 更突出的触发场景：ps / si / balanced */
  dominant: 'ps' | 'si' | 'balanced'
  description: string
  advice: string[]
}

/** 对比两个子量表得分，生成触发场景画像 */
export function getSceneProfile(psScore: number, siScore: number): SceneProfile {
  const psRatio = psScore / 78 // 满分 78
  const siRatio = siScore / 66 // 满分 66
  const diff = psRatio - siRatio

  if (Math.abs(diff) < 0.08) {
    return {
      dominant: 'balanced',
      description:
        '两个方向的社交情境对你的影响程度相当，压力和回避在「被注视的场合」与「双向互动」中分布较均匀。',
      advice: [
        '可在日常中有意识地交替练习两类场景，保持整体社交节奏。',
      ],
    }
  }
  if (diff > 0) {
    return {
      dominant: 'ps',
      description:
        '你的压力更多集中在「聚光灯下的表现」——如演讲、被注视着工作、公开报告等单向任务场合，害怕失误、出丑或不够完美。',
      advice: [
        '针对上台/展示场景做脱敏练习：先在小范围（1-2 人）演练，逐步扩大听众。',
        '把「表现」重新定义为「交流」：关注信息传递而非他人评价。',
      ],
    }
  }
  return {
    dominant: 'si',
    description:
      '你的压力更多集中在「双向的人际交往」——如与不熟的人交谈、维护权益、拒绝他人等互动场合，害怕否定、冲突或冷场。',
    advice: [
      '练习「小步互动」：从短暂寒暄开始，逐渐延长对话时长。',
      '提前准备 2-3 个开放性话题，降低冷场的心理压力。',
    ],
  }
}

export interface LsasPerQuestionScore {
  index: number
  subscale: LsasSubscale
  fear: number
  avoidance: number
  answered: boolean
}

export interface LsasScoreResult {
  /** LSAS 总分（内心体感 + 行为应对，0-144） */
  total: number
  /** 内心体感总分（0-72） */
  fearTotal: number
  /** 行为应对总分（0-72） */
  avoidanceTotal: number
  /** 社交互动（SI）因子分（0-66） */
  siScore: number
  /** 表演（PS）因子分（0-78） */
  psScore: number
  /** 已作答题数 */
  answeredCount: number
  /** 严重程度等级（五级） */
  level: LsasLevel
  levelInfo: LsasLevelInfo
  /** 四象限诊断 */
  quadrant: QuadrantInfo
  /** 触发场景画像 */
  sceneProfile: SceneProfile
  /** 每题明细 */
  perQuestion: LsasPerQuestionScore[]
}

/**
 * 计算 LSAS 量表得分。
 *
 * 规则：
 * - 内心体感总分 = Σ fear（每维度 0-3，24 题）
 * - 行为应对总分 = Σ avoidance（每维度 0-3，24 题）
 * - LSAS 总分 = 内心体感总分 + 行为应对总分（0-144）
 * - SI 因子分 = SI 题目的（fear + avoidance）之和（0-66）
 * - PS 因子分 = PS 题目的（fear + avoidance）之和（0-78）
 *
 * 未作答维度按 0 计分。
 */
export function getLsasScore(
  questions: { subscale: LsasSubscale }[],
  answers: Record<number, LsasAnswer | undefined>
): LsasScoreResult {
  let fearTotal = 0
  let avoidanceTotal = 0
  let siScore = 0
  let psScore = 0
  let answeredCount = 0

  const perQuestion: LsasPerQuestionScore[] = questions.map((q, index) => {
    const answer = answers[index]
    const fear = answer?.fear ?? 0
    const avoidance = answer?.avoidance ?? 0
    const answered = answer != null && answer.fear != null && answer.avoidance != null

    fearTotal += fear
    avoidanceTotal += avoidance
    if (q.subscale === 'si') siScore += fear + avoidance
    else psScore += fear + avoidance
    if (answered) answeredCount += 1

    return {
      index,
      subscale: q.subscale,
      fear,
      avoidance,
      answered,
    }
  })

  const total = fearTotal + avoidanceTotal
  const levelInfo =
    LSAS_LEVELS.find((l) => total >= l.min && total <= l.max) ?? LSAS_LEVELS[0]

  return {
    total,
    fearTotal,
    avoidanceTotal,
    siScore,
    psScore,
    answeredCount,
    level: levelInfo.level,
    levelInfo,
    quadrant: getQuadrant(fearTotal, avoidanceTotal),
    sceneProfile: getSceneProfile(psScore, siScore),
    perQuestion,
  }
}
