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
    name: '隐形逃亡者', animal: '蛆',
    core: '高敏感、高恐惧、高回避',
    behavior:
      '你对他人的目光、评价和态度变化非常敏感。一个眼神、一句语气稍微不同的话，甚至别人短暂的沉默，都可能让你开始猜测其中的含义。面对陌生人、公开表达、成为焦点或建立新的关系时，你很容易提前产生压力，并习惯性地把可能出现的问题想在前面。你不仅担心自己表现不好，也担心别人会不会不喜欢你、误解你，甚至担心关系建立之后需要承担更多期待。于是，比起冒险走出去，你更倾向于先把自己藏起来。很多时候，事情甚至还没有真正发生，你已经在脑海里把最糟糕的结局演练了好几遍。回避能够暂时让你获得安全感，但也可能让你越来越依赖“躲开就不会出问题”这套生存方式。',
    satire:
      '见光死，恨不得天天躲在角落里一动不动。别人只是看了你一眼，你脑子里已经开始召开紧急会议：“他为什么看我？我刚才是不是表情不对？是不是说错话了？”对方可能五分钟后连你是谁都忘了，你还在脑内把刚才那一秒剪成了导演加长版。别人去参加聚会是为了认识新朋友，你去之前先研究厕所在哪、出口在哪、什么时候离场最自然。你的大脑像一个全年无休的灾难片编剧，最大的特点就是——所有事故都还没发生，但预告片已经播完了。你成功避免了很多尴尬，也顺便避免了很多本来可能发生的好事。'
  },

  'high-high-high-low': {
    psType: 'high-high', siType: 'high-low',
    name: '伪装生存者', animal: '下水道老鼠',
    core: '害怕表现，但社交能力尚可',
    behavior:
      '你并不是完全不会社交。日常聊天、熟人互动、简单寒暄甚至融入一个群体，对你来说通常都能够完成。真正让你感到压力的，是当注意力突然集中到自己身上时。公开发言、展示能力、回答问题、接受专业评价，或者需要证明自己“足够优秀”的场景，会让你的紧张明显增加。你可能非常清楚别人应该如何表现，也知道自己其实具备相应的能力，但真正轮到自己时，却容易反复检查每一句话、每一个动作。为了避免出错，你可能会刻意降低存在感，让自己看起来“普通一点”“安全一点”。于是别人看到的是一个能够正常融入群体的人，而你自己知道，那个轻松自然的状态其实需要消耗不少精力。',
    satire:
      '闲聊时五彩斑斓，点名时秒变墙纸。刚才还在和别人聊得热火朝天，一听到“那你来说一下”，瞬间开始研究桌面纹理。别人以为你只是低调，你自己知道刚才那一秒脑内已经跑完了“装死、逃跑、假装没听见、突然失忆”四套方案。你把社交技能点得还不错，可惜全部点在了“如何不成为焦点”上。平时藏得像下水道老鼠一样专业，偏偏越想不被发现，越能感受到别人正在看你。'
  },

  'high-high-low-high': {
    psType: 'high-high', siType: 'low-high',
    name: '低调隐士', animal: '🐌 蜗牛',
    core: '害怕成为焦点，倾向于独处',
    behavior:
      '你对成为注意力中心、被别人观察和评价比较敏感，因此更喜欢处在相对安全、熟悉和可控的环境中。与此同时，你对主动建立关系的兴趣也比较低，比起频繁认识新的人，你更愿意保持自己的节奏。独处通常能够让你放松，因为在那里不需要不断观察别人的反应，也不需要担心自己是否符合某种社交期待。你可能并不讨厌所有人，只是不太愿意把大量精力投入到复杂的人际关系里。长期来看，如果这种退避成为习惯，你可能会逐渐把“我不需要”与“我不敢”混在一起，甚至很难分辨自己到底是真的喜欢独处，还是只是已经习惯了独处。',
    satire:
      '把“不敢社交”包装成“我喜欢独处”，壳越背越沉，脚步越挪越慢。别人问你为什么不去认识新朋友，你说：“一个人挺好的。”这句话有时候是真的，有时候只是给自己找了一个听起来比较体面的理由。你像一只蜗牛，最大的优点是自带房子，最大的缺点也是——房子太方便了，方便到你根本没有理由出来。别人已经走完一圈回来，你还在壳里思考“要不要出去看看”。等终于鼓起勇气探出头，天都快黑了。'
  },

  'high-high-low-low': {
    psType: 'high-high', siType: 'low-low',
    name: '安静观察者', animal: '🦥 树懒',
    core: '不怕交流，但拒绝舞台',
    behavior:
      '你通常具备基本的社交能力，也能够与别人正常交流，并不会因为所有社交场景都产生明显压力。但你不太喜欢成为众人关注的对象，尤其不喜欢被要求即时表达、展示能力或接受公开评价。相比主动站到聚光灯下，你更习惯先观察环境，再决定自己是否参与。你可能更适合幕后、辅助或者拥有充分准备时间的角色。你并不是没有观点，而是倾向于在确定自己想说什么之后再开口。问题在于，有时候过度追求“准备好再表达”，会让你错过很多其实并不需要完美表现的机会。',
    satire:
      '能聊、能社交，就是不上台。别人聊天聊得正热闹，你在旁边听得津津有味；轮到你发言，你突然开始对空气产生浓厚兴趣。你不是没话说，你只是觉得最好等一个“完美时机”。于是你等啊等，等到终于想好一句非常精彩的话——会议散了。你的反射弧不是长，它只是坚持把每句话都送去质检。别人说错一句继续聊，你说错一句可能回家复盘三个小时。'
  },

  'high-low-high-high': {
    psType: 'high-low', siType: 'high-high',
    name: '孤勇猎手', animal: '🐕 金毛',
    core: '害怕关系压力，但愿意行动',
    behavior:
      '你在面对具体任务和现实挑战时，通常具备不错的行动能力。真正容易让你疲惫的并不是“事情难不难”，而是事情背后复杂的人际关系。你可能比较在意别人对你的看法，也容易担心别人失望、生气或对你产生负面评价。因此，你会倾向于承担责任、主动帮忙，甚至在自己已经很累的时候仍然选择答应别人。你并不是没有边界，而是建立边界时容易产生心理负担。你可以勇敢面对困难，却可能在一句“你能不能帮我一下”面前突然失去抵抗力。',
    satire:
      '工作上是匹孤狼，人际场秒变金毛：任务咬住不放，回头还得摇着尾巴哄每个同事开心。别人说“没关系”，你能脑补出七种“其实他很失望”的版本；别人皱一下眉，你开始检查自己是不是哪里做错了。你不是不会拒绝，你只是每次准备说“不”的时候，脑子里都会跳出一句：“可是他会不会觉得我不好？”于是别人越来越习惯找你，你越来越习惯委屈自己。最后所有人都夸你“真好说话”，只有你知道，这句话有时候听起来像表扬，有时候更像判决书。'
  },

  'high-low-high-low': {
    psType: 'high-low', siType: 'high-low',
    name: '焦虑蛮牛', animal: '🐴 蒙眼拉磨的驴',
    core: '害怕但不会逃避',
    behavior:
      '你可能会在社交、公开表达或接受评价时感到明显紧张，但这种紧张通常不会彻底阻止你的行动。即使心里已经开始打鼓，你仍然可能选择把事情完成。你习惯用责任感、执行力和“既然答应了就必须做完”的态度推动自己前进。别人看到的是你的可靠和坚持，却不一定知道你在行动过程中承受了多少心理压力。你的优势是不会轻易因为恐惧而停下来，但风险在于，你可能太习惯用硬撑解决问题，把焦虑当成正常状态，甚至认为“只要我还能完成，就说明没什么问题”。',
    satire:
      '蒙着眼拉磨，一圈一圈以为自己在前进，实际上每天都在同一个地方绕圈。你害怕上台，但还是上；紧张见人，但还是见；不想参加活动，但最后还是去了。别人靠自信前进，你靠意志力硬顶。你最大的超能力不是勇敢，而是“明明很慌还能把事情做完”。当然，副作用也很明显：别人只看到你完成了任务，只有你知道自己已经在精神上死了八次，然后第九次爬起来继续干。'
  },

  'high-low-low-high': {
    psType: 'high-low', siType: 'low-high',
    name: '独狼执行者', animal: '🐈⬛ 野猫',
    core: '事情能做，人际随缘',
    behavior:
      '你通常能够处理需要完成的任务，也不会因为事情本身具有挑战性就轻易放弃。相比之下，复杂的人际关系更容易让你失去耐心。你可能不太喜欢频繁解释、维持关系、处理情绪或者参与没有明确目的的社交活动。你更习惯靠自己的能力解决问题，也倾向于给自己保留足够的个人空间。你不是害怕所有人，而是对“人与人之间为什么要这么麻烦”这件事缺乏兴趣。你的独立性是一种优势，但如果过度依赖独处，也可能让别人很难真正靠近你。',
    satire:
      '任务完成率 100%，人情回应率看心情。事情交给你基本不用担心，人交给你就不好说了。你可以熬夜把一个项目做完，却懒得花三分钟解释为什么没回消息。你以为自己是桀骜不驯的独狼，在别人眼里可能只是一个“干完活就消失，连再见都懒得说”的 NPC。你不是不合群，你只是把“保持联系”理解成了偶尔确认对方还活着。'
  },

  'high-low-low-low': {
    psType: 'high-low', siType: 'low-low',
    name: '压力征服者', animal: '🐔 斗鸡',
    core: '高行动力、高竞争意识',
    behavior:
      '你可能会感受到压力和紧张，但你倾向于通过行动、竞争和证明自己来处理这种情绪。越是有人质疑你，你越容易产生“那我偏要做给你看”的动力。挑战并不会让你轻易退缩，反而可能成为刺激你行动的燃料。你比较重视能力、结果和成就，也希望通过实际表现证明自己的价值。你的优势是执行力强、不容易被恐惧完全限制，但需要注意的是，如果长期依赖竞争来维持动力，你可能会逐渐把生活变成一场没有终点的比赛。',
    satire:
      '紧张到羽毛炸开，还要竖着脖子往前冲。别人看到困难会绕路，你看到困难第一反应是：“谁说我不行？”然后冲上去证明自己。赢了想再战，输了想复仇，累了觉得休息就是认输。你表面上像斗鸡一样自信，实际上有时候只是不能接受自己输。别人问你为什么这么拼，你说“我喜欢挑战”，但诚实一点可能是——你只是特别讨厌被证明不行。'
  },

  'low-high-high-high': {
    psType: 'low-high', siType: 'high-high',
    name: '社交退场者', animal: '🦔 刺猬',
    core: '不怕展示，但害怕关系',
    behavior:
      '你通常能够在需要的时候表达自己，也不一定害怕公开展示能力。真正让你产生压力的是关系变得深入之后。浅层社交对你来说反而比较容易，因为双方保持适当距离，不需要暴露太多真实的自己。但当别人开始关心你的情绪、进入你的私人生活，或者期待与你建立更亲密的关系时，你可能会产生明显的不适。你可能看起来开朗、自信甚至善于交际，但真正愿意让别人走进内心的人并不多。你不是没有亲密需求，而是亲密本身意味着失去防御。',
    satire:
      '台上侃侃而谈，台下竖刺拒人。你可以在几十个人面前讲得头头是道，却受不了一个人认真问你一句：“你最近是不是不太开心？”公开表达不算什么，真正危险的是有人开始认真了解你。你希望有人懂你，但最好不要靠得太近；你渴望关系，又希望关系永远停留在安全距离。于是别人靠近，你扎人；别人离开，你又觉得：“果然没人真的理解我。”'
  },

  'low-high-high-low': {
    psType: 'low-high', siType: 'high-low',
    name: '冷静独行猫', animal: '🐱 猫',
    core: '独立、不依赖社交',
    behavior:
      '你通常拥有比较稳定的自我感，不太需要通过别人的认可来确认自己的价值。你能够表达观点，也可以完成必要的社交互动，但不会为了融入群体而强迫自己改变。你更重视个人空间、自由和关系中的边界感。你可以喜欢一个人，也可以和一群人相处，但不会认为“必须一直联系”才能证明关系存在。你最大的优势是独立，最大的潜在问题则是容易把“我不需要”发展成“我什么都不需要”。',
    satire:
      '独立、克制、保持距离。你可以和别人聊得很好，也可以下一秒就回家关门。别人会忍不住想：“他到底喜不喜欢我？”而你可能只是在想：“今晚吃什么？”你永远分不清它是在欣赏你，还是在评估你什么时候能开罐头。你不是高冷，你只是把社交距离调成了默认设置。问题是，有时候你以为自己留下的是神秘感，别人收到的却是：“这个人是不是根本不想理我？”'
  },

  'low-high-low-high': {
    psType: 'low-high', siType: 'low-high',
    name: '孤岛居民', animal: '🦫 水豚',
    core: '不焦虑，但社交需求低',
    behavior:
      '你通常不会因为别人怎么看自己而产生明显压力，也不会因为面对陌生人就陷入明显紧张。你可以正常交流，也能够适应社交环境，只是你并不需要大量的人际互动来获得满足感。一个人待着并不会让你觉得孤独，反而可能让你恢复能量。你更愿意按照自己的节奏生活，不太喜欢为了合群而参加自己并不感兴趣的活动。你拥有比较强的心理稳定性，但有时也可能因为过于舒服，而缺少主动探索和改变的动力。',
    satire:
      '情绪稳定得像开了防抖，其实只是把一年的社交额度在年初就用完了。别人周末安排三场聚会，你周末最大的计划是不要有人找你。谁都能在你头上骑一会儿，你无所谓；谁突然消失了，你也不会追。你不是没有朋友，你只是觉得朋友这种东西偶尔更新一下就够了。世界在疯狂社交，你坐在旁边喝茶，看着他们折腾，然后认真得出结论：“人类真的很忙。”'
  },

  'low-high-low-low': {
    psType: 'low-high', siType: 'low-low',
    name: '冷酷玩家', animal: '🦈 鲨鱼',
    core: '自信、自主、不受影响',
    behavior:
      '你通常不会因为别人的评价而明显改变自己的行为，也比较习惯按照自己的判断做决定。面对陌生环境、公开表达或需要承担注意力时，你通常能够保持相对稳定。你重视目标、效率和自主权，不太依赖外界认可来获得安全感。别人喜欢你还是不喜欢你，对你的核心行动影响有限。这样的特质能够让你果断、独立，但如果过度依赖这种模式，也可能让你忽略他人的情绪和关系需求。',
    satire:
      '目标明确，手段冷血，社交对你来说有时候像一张可以随时取消的会员卡。别人还在纠结“这样做别人会不会不开心”，你已经把事情做完并开始下一项。大家都说“不在乎你”，你是真的不太在乎。问题是，你可能没发现——你不在乎别人怎么看你，不代表别人不在乎你怎么看他们。你的人生像鲨鱼游泳：不停向前，停下来反而不知道该干什么。'
  },

  'low-low-high-high': {
    psType: 'low-low', siType: 'high-high',
    name: '热情讨好者', animal: '🐝 蜜蜂',
    core: '擅长互动，但关系敏感',
    behavior:
      '你通常比较喜欢与人建立连接，也不太害怕主动交流。你能够察觉别人的情绪变化，并且很自然地会考虑对方的感受。你愿意帮助别人，也容易成为群体中那个负责调节气氛、照顾情绪的人。你的社交能力往往不错，但问题在于，你可能过度关注别人是否满意，从而把别人的情绪当成自己的责任。一旦感觉关系出现变化，你容易反复检查自己的行为，甚至为了维持和谐而牺牲自己的需求。',
    satire:
      '把蜜都酿给别人，忙完一整个花季，最后发现自己的蜂蜜罐是空的。谁不开心你都想哄，谁沉默了你都想问，谁说“没事”你都不信。别人一句“随便”，你能替他想八个方案；自己想拒绝的时候，却先写一篇道歉信。你把体贴练成了本能，把拒绝练成了失传技艺。最后所有人都说你脾气真好，只有你自己知道：有时候不是脾气好，是不敢不好。'
  },

  'low-low-high-low': {
    psType: 'low-low', siType: 'high-low',
    name: '社交领导者', animal: '🐓 公鸡',
    core: '天然表达者',
    behavior:
      '你通常不太害怕成为注意力中心，也能够自然表达自己的想法。进入一个新的群体后，你比较容易主动与别人建立联系，也愿意推动话题、组织活动或者承担带头角色。你对公开表达和社交互动的心理负担较低，因此很容易成为群体中比较显眼的人。你的优势是主动、自信和感染力，但需要注意的是，表达能力强并不意味着所有场合都需要表达。真正成熟的社交能力，不只是让别人听见你，也包括知道什么时候应该让别人说话。',
    satire:
      '天亮就打鸣，坚信世界是被自己叫醒的。群里安静三秒，你开始主持会议；没人安排任务，你自动成为负责人；大家还在讨论“要不要”，你已经安排好了时间地点。你的领导力确实很强，只是偶尔需要确认一下——别人是真的想听你说，还是只是暂时还没找到机会逃跑。你不是故意抢镜，你只是从出生开始就没有安装“稍等一下”的插件。'
  },

  'low-low-low-high': {
    psType: 'low-low', siType: 'low-high',
    name: '佛系旁观者', animal: '🐨 考拉',
    core: '淡定、不主动',
    behavior:
      '你通常不会因为别人的评价或陌生社交环境而产生明显焦虑，也不太需要通过频繁互动来获得安全感。你更倾向于按照自己的节奏生活，喜欢观察而不是主动争夺注意力。你可以参与社交，但不会为了合群而强迫自己成为中心。你的情绪稳定性和松弛感是优势，但如果过度依赖舒适区，也可能让“顺其自然”逐渐变成“什么都不主动”。有些机会不是因为你不适合，而只是因为你从来没有伸手去拿。',
    satire:
      '一天睡二十个小时，抱着桉树当全世界，还说自己在“观察人生”。别人已经开始创业、恋爱、旅行、改变人生，你在旁边点点头：“挺好的。”然后继续睡。你的淡定确实很高级，高级到机会从你面前经过三次，你都懒得抬头确认那是什么。你不是没有目标，你只是坚信“以后还有机会”。至于这个以后是哪一年——目前还没有人知道，包括你自己。'
  },

  'low-low-low-low': {
    psType: 'low-low', siType: 'low-low',
    name: '社交野兽', animal: '🐒 猴子',
    core: '高适应、高开放',
    behavior:
      '你通常不会因为别人的评价、陌生环境或者公开表达而产生明显的心理负担。进入新的社交环境时，你能够比较自然地观察规则、寻找共同话题并快速与别人建立联系。即使出现尴尬、说错话或者互动不顺利，你也不太容易长时间陷入自我怀疑。你更倾向于把社交看成一种探索和游戏，而不是一场必须拿满分的考试。你的优势是开放、灵活、适应能力强，但也需要注意，社交能力强并不意味着所有关系都值得建立，热闹并不一定等于真正的连接。',
    satire:
      '哪里有人，哪里就有你。刚认识三分钟已经开始交换外号，认识十分钟已经在讨论下次去哪玩。别人进入陌生环境先观察，你进入陌生环境先找个能聊的人，然后顺手把整个场子都逛一遍。你以为社交是天赋，对猴子来说那是生存本能——好奇是真的，热情是真的，顺便看看谁比较好玩也是真的。你最大的优势是脸皮厚，最大的风险也是脸皮厚：别人尴尬的时候已经开始反思人生，你已经拍着对方肩膀问：“所以我们什么时候再出来玩？”'
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
