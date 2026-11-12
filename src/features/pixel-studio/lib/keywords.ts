/**
 * 关键词解析：AI 不可用时的兜底方案。
 *
 * 把文案里的词映射成「画面规划」里的对象（种类 + 远近 + 水平位置），
 * 因此渲染路径与 AI 规划完全一致，只是理解能力弱一些。
 * 一个词都没命中时，退化为随机组合的通用小风景，而不是空白画面。
 */

import type {
  Biome,
  SceneDepth,
  SceneElement,
  SceneObject,
  SceneObjectKind,
  ScenePlan,
  TimeOfDay,
} from '../types'
import { EMPTY_PALETTE } from './scenePlan'
import { createRandom, hashText } from './random'
import type { Random } from './random'

interface KeywordRule {
  elements?: SceneElement[]
  timeOfDay?: TimeOfDay
  biome?: Biome
  words: string[]
}

/** 关键词表：中文按子串匹配，英文按单词边界匹配，避免 star 命中 start */
const RULES: KeywordRule[] = [
  // 天象与天气
  { elements: ['sun'], words: ['太阳', '阳光', '朝阳', '日照', 'sun', 'sunny', 'sunlight'] },
  { elements: ['moon'], words: ['月亮', '月光', '满月', '月牙', 'moon', 'moonlit', 'lunar'] },
  { elements: ['stars'], words: ['星星', '星空', '星辰', '银河', '流星', 'star', 'stars', 'starry', 'galaxy', 'constellation'] },
  { elements: ['clouds'], words: ['云', '白云', '多云', 'cloud', 'clouds', 'cloudy'] },
  { elements: ['rain'], words: ['雨', '下雨', '暴雨', '雷雨', 'rain', 'rainy', 'rainfall'] },
  { elements: ['snow'], timeOfDay: 'snow', words: ['雪', '下雪', '雪花', '冬', 'snow', 'snowy', 'winter'] },

  // 地貌
  { elements: ['mountains'], biome: 'mountains', words: ['山', '山峰', '山脉', '雪山', '高原', 'mountain', 'mountains', 'peak', 'alps', 'valley'] },
  { elements: ['hills'], biome: 'plain', words: ['丘陵', '山坡', '草原', '草地', '田野', '平原', 'hill', 'hills', 'plain', 'field', 'meadow', 'grassland'] },
  { elements: ['forest'], biome: 'forest', words: ['树', '森林', '树林', '松树', '草甸', 'forest', 'tree', 'trees', 'pine', 'woods', 'jungle'] },
  { elements: ['water'], biome: 'coast', words: ['海', '大海', '湖', '河', '溪', '池塘', '海滩', '海岸', '海边', 'sea', 'lake', 'river', 'ocean', 'water', 'pond', 'beach', 'coast', 'island'] },
  { elements: ['cactus'], biome: 'desert', words: ['仙人掌', '沙漠', '荒漠', '沙丘', 'cactus', 'desert', 'dune'] },
  { elements: ['palm'], biome: 'coast', words: ['棕榈', '椰子', '热带', 'palm', 'tropical', 'coconut'] },
  { elements: ['meadow'], words: ['花', '花田', '花园', '野花', 'flower', 'flowers', 'garden', 'bloom', 'blossom'] },
  { elements: ['road'], words: ['小路', '道路', '小径', '公路', 'road', 'path', 'street', 'trail', 'highway'] },

  // 建筑与物件
  { elements: ['house'], words: ['房子', '小屋', '木屋', '屋顶', '农舍', '村庄', 'house', 'cabin', 'home', 'cottage', 'village', 'hut', 'farmhouse'] },
  { elements: ['castle'], words: ['城堡', '宫殿', '要塞', '塔楼', 'castle', 'palace', 'fortress', 'citadel'] },
  { elements: ['city'], biome: 'city', words: ['城市', '都市', '高楼', '大厦', '街道', 'city', 'urban', 'skyline', 'downtown', 'building', 'buildings'] },
  { elements: ['windmill'], words: ['风车', '磨坊', 'windmill', 'mill'] },
  { elements: ['lighthouse'], words: ['灯塔', 'lighthouse', 'beacon'] },
  { elements: ['boats'], words: ['船', '帆船', '小舟', '渔船', 'boat', 'ship', 'sail', 'sailboat', 'canoe'] },
  { elements: ['birds'], words: ['鸟', '飞鸟', '海鸥', '大雁', 'bird', 'birds', 'seagull', 'eagle'] },
  { elements: ['rocket'], biome: 'space', words: ['火箭', '飞船', '航天', '宇航', 'rocket', 'spaceship', 'shuttle', 'astronaut'] },
  { elements: ['planet'], biome: 'space', words: ['星球', '行星', '太空', '宇宙', '星系', 'planet', 'space', 'outer space', 'universe'] },

  // 室内与近景（墙面与地板由配色表达，家具按近景铺开）
  { elements: ['cat'], words: ['猫', '猫咪', '小猫', 'cat', 'cats', 'kitten', 'kitty'] },
  { elements: ['sofa'], words: ['沙发', '长椅', 'sofa', 'couch', 'settee'] },
  { elements: ['table'], words: ['桌子', '餐桌', '书桌', '茶几', 'table', 'desk'] },
  { elements: ['chair'], words: ['椅子', '板凳', '座椅', 'chair', 'stool', 'armchair'] },
  { elements: ['rug'], words: ['地毯', '地垫', 'rug', 'carpet'] },
  { elements: ['lamp'], words: ['台灯', '落地灯', '油灯', 'lamp', 'lampshade', 'lantern'] },
  { elements: ['window'], words: ['窗户', '窗口', '窗台', 'window', 'windows'] },
  { elements: ['person'], words: ['人物', '人影', '人们', '行人', '一个人', '个人', 'person', 'people', 'figure', 'human', 'boy', 'girl', 'man', 'woman'] },

  // 时间与氛围
  { timeOfDay: 'night', words: ['夜', '夜晚', '深夜', '星夜', '月夜', 'night', 'midnight', 'nocturnal'] },
  { timeOfDay: 'dusk', words: ['黄昏', '日落', '傍晚', '夕阳', '晚霞', 'dusk', 'sunset', 'evening', 'twilight'] },
  { timeOfDay: 'dawn', words: ['清晨', '黎明', '日出', '早晨', '曙光', 'dawn', 'sunrise', 'morning', 'daybreak'] },
  { timeOfDay: 'storm', words: ['暴风雨', '雷雨', '阴天', '乌云', 'storm', 'stormy', 'thunder', 'overcast'] },
]

/** 地貌 → 默认元素组合（只说了地貌、没说具体物件时使用） */
const BIOME_ELEMENTS: Record<Biome, SceneElement[]> = {
  plain: ['hills', 'meadow'],
  mountains: ['mountains', 'forest'],
  forest: ['forest', 'hills'],
  coast: ['water', 'boats'],
  desert: ['cactus', 'hills'],
  city: ['city'],
  space: ['planet', 'rocket'],
}

/** 元素 → 画面对象模板（kind + 默认远近） */
const ELEMENT_OBJECTS: Record<SceneElement, Array<[SceneObjectKind, SceneDepth]>> = {
  sun: [['sun', 'far']],
  moon: [['moon', 'far']],
  stars: [['star', 'far']],
  clouds: [
    ['cloud', 'far'],
    ['cloud', 'mid'],
  ],
  rain: [['rain', 'far']],
  snow: [['snow', 'far']],
  mountains: [['mountain', 'far']],
  hills: [['hill', 'far']],
  forest: [['forest', 'mid']],
  house: [['house', 'mid']],
  castle: [['castle', 'mid']],
  city: [['city', 'far']],
  water: [['water', 'mid']],
  meadow: [['flower', 'near']],
  road: [['road', 'near']],
  boats: [['boat', 'mid']],
  birds: [['bird', 'far']],
  windmill: [['windmill', 'mid']],
  lighthouse: [['lighthouse', 'mid']],
  cactus: [['cactus', 'mid']],
  palm: [['palm', 'mid']],
  rocket: [['rocket', 'mid']],
  planet: [['planet', 'far']],
  cat: [['cat', 'near']],
  sofa: [['sofa', 'near']],
  table: [['table', 'near']],
  chair: [['chair', 'near']],
  rug: [['rug', 'near']],
  lamp: [['lamp', 'near']],
  window: [['window', 'mid']],
  person: [['person', 'mid']],
}

/** 由渲染器整层处理、不需要单独定位的对象 */
const LAYERED_KINDS: ReadonlySet<SceneObjectKind> = new Set([
  'mountain',
  'hill',
  'city',
  'water',
  'road',
  'star',
  'rain',
  'snow',
  'fog',
  'sun',
  'moon',
  'cloud',
  'bird',
  'rocket',
  'planet',
])

export interface ParsedText {
  elements: SceneElement[]
  timeOfDay: TimeOfDay | null
  biome: Biome | null
}

function isAscii(word: string): boolean {
  return /^[\x20-\x7e]+$/.test(word)
}

function matches(text: string, word: string): boolean {
  if (!word) return false
  if (!isAscii(word)) return text.includes(word)
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text)
}

export function parseText(text: string): ParsedText {
  const normalized = text.toLowerCase()
  const elements: SceneElement[] = []
  let timeOfDay: TimeOfDay | null = null
  let biome: Biome | null = null

  for (const rule of RULES) {
    if (!rule.words.some((word) => matches(normalized, word))) continue
    if (rule.timeOfDay && timeOfDay === null) timeOfDay = rule.timeOfDay
    if (rule.biome && biome === null) biome = rule.biome
    if (rule.elements) {
      for (const element of rule.elements) {
        if (!elements.includes(element)) elements.push(element)
      }
    }
  }

  return { elements, timeOfDay, biome }
}

function inferBiome(elements: readonly SceneElement[]): Biome {
  if (elements.includes('rocket') || elements.includes('planet')) return 'space'
  if (elements.includes('cactus')) return 'desert'
  if (elements.includes('city')) return 'city'
  if (elements.includes('water')) return 'coast'
  if (elements.includes('mountains')) return 'mountains'
  if (elements.includes('forest')) return 'forest'
  return 'plain'
}

function titleFromText(text: string): string {
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  return (firstLine ?? '').slice(0, 16)
}

function elementsToObjects(elements: readonly SceneElement[], rand: Random): SceneObject[] {
  const objects: SceneObject[] = []

  for (const element of elements) {
    for (const [kind, depth] of ELEMENT_OBJECTS[element]) {
      objects.push({ kind, depth, x: 0.5, scale: 1, color: null })
    }
  }

  // 天空与地貌类先给一个合理位置
  for (const object of objects) {
    switch (object.kind) {
      case 'sun':
      case 'moon':
        object.x = rand.range(0.18, 0.82)
        break
      case 'cloud':
        object.x = rand.range(0.12, 0.88)
        break
      case 'bird':
        object.x = rand.range(0.2, 0.8)
        break
      case 'rocket':
      case 'planet':
        object.x = rand.range(0.62, 0.86)
        break
      case 'mountain':
      case 'hill':
      case 'city':
        object.x = 0.5 + rand.range(-0.1, 0.1)
        break
      default:
        break
    }
  }

  // 立地物件在中部横向铺开，避免重叠
  const standing = objects.filter((object) => !LAYERED_KINDS.has(object.kind))
  standing.forEach((object, index) => {
    const ratio = standing.length === 1 ? 0.5 : (index + 1) / (standing.length + 1)
    object.x = 0.16 + ratio * 0.68
    object.scale = rand.range(0.92, 1.12)
  })

  return objects
}

/** 完全识别不到内容时：给一个通用的安静小风景，而不是空白画面 */
function fallbackObjects(rand: Random): SceneObject[] {
  const pool: Array<[SceneObjectKind, SceneDepth]> = [
    ['hill', 'far'],
    ['cloud', 'far'],
    ['sun', 'far'],
    ['moon', 'far'],
    ['star', 'far'],
    ['tree', 'mid'],
    ['flower', 'near'],
    ['rock', 'near'],
  ]
  const picked = rand.pick(pool)
  const extras = [rand.pick(pool), rand.pick(pool)]
  const objects: SceneObject[] = [picked, ...extras].map(([kind, depth]) => ({
    kind,
    depth,
    x: rand.range(0.2, 0.8),
    scale: rand.range(0.9, 1.15),
    color: null,
  }))
  return objects
}

/** 纯文案 → 画面规划（AI 不可用时的兜底） */
export function planFromText(text: string, seed: number): ScenePlan {
  const parsed = parseText(text)
  const rand = createRandom((seed ^ hashText(text)) >>> 0)
  const elements =
    parsed.elements.length > 0
      ? parsed.elements
      : parsed.biome
        ? BIOME_ELEMENTS[parsed.biome]
        : []

  const objects = elementsToObjects(elements, rand)
  const timeOfDay: TimeOfDay =
    parsed.timeOfDay ??
    (elements.includes('stars') || elements.includes('moon') || elements.includes('planet')
      ? 'night'
      : 'day')

  return {
    title: titleFromText(text) || '像素风景',
    description: text.trim(),
    timeOfDay,
    horizon: 0.62,
    palette: { ...EMPTY_PALETTE },
    objects: objects.length > 0 ? objects : fallbackObjects(rand),
    seed,
    source: 'local',
    // 关键词兜底只会产出词表内的对象，不存在「不支持的景物」
    unsupported: [],
  }
}

/** 供界面提示使用：这次兜底用的是哪个地貌 */
export function biomeOf(text: string): Biome {
  const parsed = parseText(text)
  return parsed.biome ?? inferBiome(parsed.elements)
}
