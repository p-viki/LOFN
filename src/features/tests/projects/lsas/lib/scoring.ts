import type { LsasAnswer, LsasSubscale } from '../types'

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

/** 四象限判定阈值：各维度满分 */
export interface QuadrantThresholds {
  /** 内心体感（fear）维度满分 */
  fearMax: number
  /** 行为应对（avoidance）维度满分 */
  avoidanceMax: number
}

/** SI 场景单维度满分（11 题 × 3 分） */
export const SI_SUBSCALE_MAX = 33
/** PS 场景单维度满分（13 题 × 3 分） */
export const PS_SUBSCALE_MAX = 39

/**
 * 四象限心理画像（Fear × Avoidance）。
 * 判定阈值：fear/avoidance 各自超过所在量表维度满分的 50% 视为「高」。
 * 默认按总表 72/72（阈值 36），子量表传入对应满分即可复用。
 */
export function getQuadrant(
  fearTotal: number,
  avoidanceTotal: number,
  thresholds: QuadrantThresholds = { fearMax: 72, avoidanceMax: 72 }
): QuadrantInfo {
  const highFear = fearTotal >= Math.ceil(thresholds.fearMax / 2)
  const highAvoidance = avoidanceTotal >= Math.ceil(thresholds.avoidanceMax / 2)

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

/** 四象限简短标签（PS/SI 类型速记，顺序 = 内心体感 × 行为应对） */
export const QUADRANT_SHORT_LABELS: Record<QuadrantType, string> = {
  'high-high': '高高',
  'high-low': '高低',
  'low-high': '低高',
  'low-low': '低低',
}

/** 综合类型画像：PS 场景四象限 × SI 场景四象限 = 16 种组合类型 */
export interface CombinedProfile {
  /** PS 场景四象限类型 */
  psType: QuadrantType
  /** SI 场景四象限类型 */
  siType: QuadrantType
  /** 类型名称 */
  name: string
  /** 意象（emoji + 名称，属性契合且带黑色幽默讽刺） */
  animal: string
  /** 核心特性 */
  core: string
  /** 典型表现 */
  behavior: string
  /** 毒舌点评（黑色幽默 · 攻击性弱化版自嘲） */
  satire: string
}

/** 16 种组合类型映射表（key = `${psType}-${siType}`） */
export const COMBINED_PROFILES: Record<string, CombinedProfile> = {
  'high-high-high-high': {
    psType: 'high-high', siType: 'high-high',
    name: '隐形逃亡者', animal: '🪳 蟑螂',
    core: '高敏感、高恐惧、高回避',
    behavior: '害怕被评价，也害怕建立关系；容易脑补灾难，主动隐藏自己。',
    satire:
      '你把自己藏得比小强还深——见光就窜，听见脚步声先装死。其实没人想来翻你的墙角，那些灭顶之灾，全是自己夜里脑补的连续剧。',
  },
  'high-high-high-low': {
    psType: 'high-high', siType: 'high-low',
    name: '伪装生存者', animal: '🦎 变色龙',
    core: '害怕表现，但社交能力尚可',
    behavior: '日常聊天没问题，但害怕展示能力、公开表达、被专业评价。',
    satire:
      '闲聊时五彩斑斓，点名时秒变墙纸。你的社交技能点得很满——可惜全部点在了「融入背景」上。变色龙换色很快，本色一个没有。',
  },
  'high-high-low-high': {
    psType: 'high-high', siType: 'low-high',
    name: '低调隐士', animal: '🐌 蜗牛',
    core: '害怕成为焦点，倾向独处',
    behavior: '不喜欢曝光，不主动连接别人，更愿意待在自己的世界。',
    satire:
      '把「不敢社交」包装成「喜欢独处」，壳越背越沉，脚步越挪越慢。不是你选择了隐居，是速度决定了你只能在原地看别人赶路。',
  },
  'high-high-low-low': {
    psType: 'high-high', siType: 'low-low',
    name: '安静观察者', animal: '🦥 树懒',
    core: '不怕交流，但拒绝舞台',
    behavior: '能聊天，但不喜欢展示自己，更适合幕后角色。',
    satire:
      '能聊、能社交，就是不上台——毕竟以你的反射弧，等轮到你发言，会议早散了，掌声也停了，你刚想好的开场白正好过期。',
  },
  'high-low-high-high': {
    psType: 'high-low', siType: 'high-high',
    name: '孤勇猎手', animal: '🐕 金毛',
    core: '害怕关系压力，但愿意行动',
    behavior: '工作能扛，人际容易消耗；容易讨好别人。',
    satire:
      '工作上是匹孤狼，人际场秒变金毛：任务咬住不放，回头还得摇着尾巴哄每个同事开心。你不是不会拒绝，你是不敢让任何人失望。',
  },
  'high-low-high-low': {
    psType: 'high-low', siType: 'high-low',
    name: '焦虑蛮牛', animal: '🐴 蒙眼拉磨的驴',
    core: '害怕但不会逃避',
    behavior: '内心紧张，行动坚定；靠责任感推动自己前进。',
    satire:
      '蒙着眼拉磨，一圈圈以为自己在前进，其实原地转了小半辈子。累到想停也不敢停——因为一停下来，就要面对自己哪儿也没去的现实。',
  },
  'high-low-low-high': {
    psType: 'high-low', siType: 'low-high',
    name: '独狼执行者', animal: '🐈⬛ 野猫',
    core: '事情能做，人际随缘',
    behavior: '能完成任务，但不喜欢复杂社交关系。',
    satire:
      '任务完成率 100%，人情回应率看心情。你以为自己是桀骜不驯的独狼，在别人眼里，你只是个干完活就消失、连再见都懒得留的 NPC。',
  },
  'high-low-low-low': {
    psType: 'high-low', siType: 'low-low',
    name: '压力征服者', animal: '🐔 斗鸡',
    core: '高行动力、高竞争意识',
    behavior: '虽然紧张，但喜欢挑战和证明自己。',
    satire:
      '紧张到羽毛炸开，还要竖着脖子往前冲——赢了想再战，输了不认账。你的自信不是来自实力，是来自「还没输到第三次」的错觉。',
  },
  'low-high-high-high': {
    psType: 'low-high', siType: 'high-high',
    name: '社交退场者', animal: '🦔 刺猬',
    core: '不怕展示，但害怕关系',
    behavior: '可以工作展示，但害怕深入交流和亲密关系。',
    satire:
      '台上侃侃而谈，台下竖刺拒人。想靠近的人被你扎得生疼，最后你抱着一身刺怪世界不给你温暖——可刺是你自己一根根长出来的。',
  },
  'low-high-high-low': {
    psType: 'low-high', siType: 'high-low',
    name: '冷静独行猫', animal: '🐱 猫',
    core: '独立、不依赖社交',
    behavior: '有能力表达自己，但更喜欢保持距离。',
    satire:
      '独立、克制、保持距离。你永远分不清它是在欣赏你，还是在评估你什么时候能开罐头。高冷是表象，需求感是本质——只是它藏得比你好。',
  },
  'low-high-low-high': {
    psType: 'low-high', siType: 'low-high',
    name: '孤岛居民', animal: '🦫 水豚',
    core: '不焦虑，但社交需求低',
    behavior: '不害怕别人，只是不想频繁互动。',
    satire:
      '情绪稳定得像开了光，其实是把一年的社交额度在年初就用完了。谁都能在你头上骑一会儿，你无所谓——反正你也没打算记住他们。',
  },
  'low-high-low-low': {
    psType: 'low-high', siType: 'low-low',
    name: '冷酷玩家', animal: '🦈 鲨鱼',
    core: '自信、自主、不受影响',
    behavior: '不在乎评价，目标明确，喜欢独立行动。',
    satire:
      '目标明确，手段冷血，社交对你是猎物的入场券。大家都说「不在乎你」，其实是不敢——毕竟直视过你的，都已经进过你的名单了。',
  },
  'low-low-high-high': {
    psType: 'low-low', siType: 'high-high',
    name: '热情讨好者', animal: '🐝 蜜蜂',
    core: '擅长互动，但关系敏感',
    behavior: '喜欢连接别人，容易关注他人感受。',
    satire:
      '把蜜都酿给别人，忙完一整个花季，偶尔想蜇一下表达不满，自己先丢了半条命。讨好到极致——连拒绝都要付出内脏的代价。',
  },
  'low-low-high-low': {
    psType: 'low-low', siType: 'high-low',
    name: '社交领导者', animal: '🐓 公鸡',
    core: '天然表达者',
    behavior: '不怕表达，也能带动别人，容易成为中心。',
    satire:
      '天亮就打鸣，坚信世界是被自己叫醒的。确实带起了不少人，但没人告诉你：你不叫，太阳照样升——你的领导力，可能只是嗓门比较大。',
  },
  'low-low-low-high': {
    psType: 'low-low', siType: 'low-high',
    name: '佛系旁观者', animal: '🐨 考拉',
    core: '淡定、不主动',
    behavior: '不焦虑，也不追求大量社交，喜欢观察。',
    satire:
      '一天睡二十个小时，抱着桉树当全世界，还说自己在「观察人生」。你啃的那棵桉树有毒——你的淡定，可能只是舒适区有点上头了。',
  },
  'low-low-low-low': {
    psType: 'low-low', siType: 'low-low',
    name: '社交野兽', animal: '🐦 海鸥',
    core: '高适应、高开放',
    behavior: '不怕评价，不怕陌生人，社交像游戏一样自然。',
    satire:
      '哪里有人三秒熟络，嗓门还大。你以为社交是天赋，对海鸥来说那是觅食本能——热情是真的，抢完这桌去下一桌，也是真的。',
  },
}

/** 根据 PS / SI 四象限类型查找综合类型画像 */
export function getCombinedProfile(
  psType: QuadrantType,
  siType: QuadrantType
): CombinedProfile {
  return (
    COMBINED_PROFILES[`${psType}-${siType}`] ?? COMBINED_PROFILES['low-low-low-low']
  )
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
  /** 四象限诊断（总表） */
  quadrant: QuadrantInfo
  /** SI 场景内心体感总分（0-33） */
  siFearTotal: number
  /** SI 场景行为应对总分（0-33） */
  siAvoidanceTotal: number
  /** PS 场景内心体感总分（0-39） */
  psFearTotal: number
  /** PS 场景行为应对总分（0-39） */
  psAvoidanceTotal: number
  /** SI 场景四象限诊断 */
  siQuadrant: QuadrantInfo
  /** PS 场景四象限诊断 */
  psQuadrant: QuadrantInfo
  /** 综合类型画像（PS × SI 组合，16 种之一） */
  combinedProfile: CombinedProfile
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
  let siFearTotal = 0
  let siAvoidanceTotal = 0
  let psFearTotal = 0
  let psAvoidanceTotal = 0
  let answeredCount = 0

  const perQuestion: LsasPerQuestionScore[] = questions.map((q, index) => {
    const answer = answers[index]
    const fear = answer?.fear ?? 0
    const avoidance = answer?.avoidance ?? 0
    const answered = answer != null && answer.fear != null && answer.avoidance != null

    fearTotal += fear
    avoidanceTotal += avoidance
    if (q.subscale === 'si') {
      siScore += fear + avoidance
      siFearTotal += fear
      siAvoidanceTotal += avoidance
    } else {
      psScore += fear + avoidance
      psFearTotal += fear
      psAvoidanceTotal += avoidance
    }
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

  const siQuadrant = getQuadrant(siFearTotal, siAvoidanceTotal, {
    fearMax: SI_SUBSCALE_MAX,
    avoidanceMax: SI_SUBSCALE_MAX,
  })
  const psQuadrant = getQuadrant(psFearTotal, psAvoidanceTotal, {
    fearMax: PS_SUBSCALE_MAX,
    avoidanceMax: PS_SUBSCALE_MAX,
  })

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
    siFearTotal,
    siAvoidanceTotal,
    psFearTotal,
    psAvoidanceTotal,
    siQuadrant,
    psQuadrant,
    combinedProfile: getCombinedProfile(psQuadrant.type, siQuadrant.type),
    sceneProfile: getSceneProfile(psScore, siScore),
    perQuestion,
  }
}
