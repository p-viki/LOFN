/**
 * 画面规划（ScenePlan）：AI 分析结果与关键词兜底的统一中间层。
 *
 * AI 只负责「理解」——把描述（或参考图）翻译成对象清单；
 * 具体的像素绘制由 composer 完成，所以模型输出的每个字段都要在这里做严格校验，
 * 任何非法取值都会被丢弃或回退，绝不让坏数据流进渲染器。
 */

import { isHexColor } from './color'
import type {
  PartColor,
  PartShape,
  SceneDepth,
  SceneObject,
  SceneObjectKind,
  ScenePalette,
  ScenePart,
  ScenePlan,
  TimeOfDay,
} from '../types'

export const SCENE_OBJECT_KINDS: SceneObjectKind[] = [
  'mountain',
  'hill',
  'city',
  'rock',
  'forest',
  'tree',
  'palm',
  'cactus',
  'flower',
  'water',
  'boat',
  'road',
  'house',
  'castle',
  'lighthouse',
  'windmill',
  'tent',
  'campfire',
  'sun',
  'moon',
  'star',
  'cloud',
  'bird',
  'rocket',
  'planet',
  'rain',
  'snow',
  'fog',
  'cat',
  'sofa',
  'table',
  'chair',
  'rug',
  'lamp',
  'window',
  'person',
  'custom',
]

export const OBJECT_LABELS: Record<SceneObjectKind, string> = {
  mountain: '山',
  hill: '丘陵',
  city: '城市',
  rock: '岩石',
  forest: '树林',
  tree: '树',
  palm: '棕榈',
  cactus: '仙人掌',
  flower: '花丛',
  water: '水域',
  boat: '小船',
  road: '道路',
  house: '小屋',
  castle: '城堡',
  lighthouse: '灯塔',
  windmill: '风车',
  tent: '帐篷',
  campfire: '营火',
  sun: '太阳',
  moon: '月亮',
  star: '星空',
  cloud: '云',
  bird: '飞鸟',
  rocket: '火箭',
  planet: '星球',
  rain: '雨',
  snow: '雪',
  fog: '雾',
  cat: '猫',
  sofa: '沙发',
  table: '桌子',
  chair: '椅子',
  rug: '地毯',
  lamp: '台灯',
  window: '窗户',
  person: '人物',
  custom: '自定造型',
}

export const DEPTH_LABELS: Record<SceneDepth, string> = {
  far: '远景',
  mid: '中景',
  near: '近景',
}

export const TIME_LABELS: Record<TimeOfDay, string> = {
  dawn: '清晨',
  day: '白天',
  dusk: '黄昏',
  night: '夜晚',
  storm: '暴风雨',
  snow: '雪天',
}

export const DEPTH_ORDER: Record<SceneDepth, number> = { far: 0, mid: 1, near: 2 }

/** 远近 → 竖直落位（占地平线以下高度的比例）与尺寸系数 */
export const DEPTH_ANCHORS: Record<SceneDepth, { base: number; size: number }> = {
  far: { base: 0.1, size: 0.7 },
  mid: { base: 0.42, size: 1 },
  near: { base: 0.88, size: 1.45 },
}

export const MAX_OBJECTS = 12
/** 同类对象最多画几个，避免模型堆一排一模一样的房子 */
const MAX_PER_KIND = 4
const MIN_HORIZON = 0.45
const MAX_HORIZON = 0.72
const DEFAULT_HORIZON = 0.62
/** 自定造型：局部方格边长 64（与 SVG 的 viewBox 习惯一致），零件数与单个轮廓顶点数的上限 */
const PART_SPAN = 64
const MAX_PARTS = 16
const MIN_PART_VERTICES = 3
const MAX_PART_VERTICES = 64

const PART_SHAPES: PartShape[] = ['polygon', 'ellipse', 'rect']
const PART_COLORS: PartColor[] = [
  'body',
  'bodyLight',
  'bodyDark',
  'accent',
  'wood',
  'metal',
  'glass',
  'sky',
  'ground',
  'water',
  'light',
  'ink',
]

const TIME_OF_DAY: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night', 'storm', 'snow']

/** 模型常见别名 → 规范 kind，容错用 */
const KIND_ALIASES: Record<string, SceneObjectKind> = {
  mountains: 'mountain',
  mountain_range: 'mountain',
  peak: 'mountain',
  peaks: 'mountain',
  hills: 'hill',
  hillock: 'hill',
  grass: 'hill',
  grassland: 'hill',
  meadow: 'flower',
  field: 'hill',
  plain: 'hill',
  sand: 'hill',
  dune: 'hill',
  desert: 'hill',
  cliff: 'rock',
  rocks: 'rock',
  stone: 'rock',
  boulder: 'rock',
  trees: 'tree',
  pine: 'tree',
  pines: 'tree',
  woods: 'forest',
  jungle: 'forest',
  forest_band: 'forest',
  palm_tree: 'palm',
  palms: 'palm',
  coconut: 'palm',
  cacti: 'cactus',
  flowers: 'flower',
  blossom: 'flower',
  sea: 'water',
  lake: 'water',
  river: 'water',
  ocean: 'water',
  pond: 'water',
  beach: 'water',
  shore: 'water',
  boats: 'boat',
  ship: 'boat',
  sailboat: 'boat',
  canoe: 'boat',
  path: 'road',
  street: 'road',
  trail: 'road',
  highway: 'road',
  bridge: 'road',
  houses: 'house',
  cabin: 'house',
  cottage: 'house',
  hut: 'house',
  home: 'house',
  village: 'house',
  buildings: 'city',
  building: 'city',
  skyline: 'city',
  urban: 'city',
  downtown: 'city',
  palace: 'castle',
  fortress: 'castle',
  tower: 'lighthouse',
  beacon: 'lighthouse',
  mill: 'windmill',
  camp: 'tent',
  campsite: 'tent',
  fire: 'campfire',
  bonfire: 'campfire',
  sun_light: 'sun',
  sunlight: 'sun',
  clouds: 'cloud',
  cloudiness: 'cloud',
  birds: 'bird',
  seagull: 'bird',
  stars: 'star',
  starry: 'star',
  galaxy: 'star',
  night_sky: 'star',
  sky: 'star',
  spaceship: 'rocket',
  shuttle: 'rocket',
  astronaut: 'rocket',
  rain_fall: 'rain',
  rainfall: 'rain',
  rainy: 'rain',
  snowy: 'snow',
  snowfall: 'snow',
  mist: 'fog',
  misty: 'fog',
  haze: 'fog',
  cats: 'cat',
  kitten: 'cat',
  kitty: 'cat',
  pet: 'cat',
  couch: 'sofa',
  settee: 'sofa',
  loveseat: 'sofa',
  armchair: 'chair',
  desk: 'table',
  nightstand: 'table',
  stool: 'chair',
  carpet: 'rug',
  mat: 'rug',
  floor_lamp: 'lamp',
  lampshade: 'lamp',
  lantern: 'lamp',
  windows: 'window',
  people: 'person',
  human: 'person',
  figure: 'person',
  man: 'person',
  woman: 'person',
  boy: 'person',
  girl: 'person',
  character: 'person',
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value))
  if (!Number.isFinite(num)) return fallback
  return Math.min(max, Math.max(min, num))
}

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function normalizeHex(value: unknown): string | null {
  if (!isHexColor(value)) return null
  const text = String(value).trim().toLowerCase()
  return text.startsWith('#') ? text : `#${text}`
}

/** 零件的语义配色：允许直接给 #rrggbb，认不出的角色回退到主体色 */
function normalizePartColor(value: unknown): PartColor | string {
  const hex = normalizeHex(value)
  if (hex) return hex

  const role = typeof value === 'string' ? value.trim().toLowerCase().replace(/[_\s-]/g, '') : ''
  if (!role) return 'body'
  // bodyLight / bodyDark 是驼峰名，模型也可能写成 body_light、bodylight，统一按去分隔符的小写比对
  return PART_COLORS.find((item) => item.toLowerCase() === role) ?? 'body'
}

/** 0~1 归一化写法的宽容放大：整组数值都落在 0~1.2 时，按方格边长放大 */
function normalizedUnit(values: readonly unknown[]): number {
  const nums = values.map((value) => Number(value))
  return nums.every((num) => Number.isFinite(num) && num >= 0 && num <= 1.2) ? PART_SPAN : 1
}

/** 零件位置：夹紧到方格内 */
function partOffset(value: unknown, unit: number): number {
  return Math.round(clampNumber(value, 0, PART_SPAN, 0) * unit)
}

/** 零件尺寸：缺省时给方格的 1/4，且至少 1 个单位，避免出现零宽零高的零件 */
function partSize(value: unknown, unit: number): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return Math.round(PART_SPAN / 4)
  return Math.max(1, Math.round(clampNumber(num, 0, PART_SPAN, 0) * unit))
}

/** 从 "1,2 3,4" / "1 2 3 4" / [[1,2],[3,4]] / [{x,y}] 里抽出坐标对 */
function parsePointPairs(raw: unknown): Array<[number, number]> {
  const pairs: Array<[number, number]> = []

  if (typeof raw === 'string') {
    const numbers = raw.match(/-?\d+(?:\.\d+)?/g)
    if (!numbers) return pairs
    for (let i = 0; i + 1 < numbers.length; i += 2) {
      pairs.push([Number.parseFloat(numbers[i]), Number.parseFloat(numbers[i + 1])])
    }
    return pairs
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (Array.isArray(item) && item.length >= 2) {
        pairs.push([Number(item[0]), Number(item[1])])
        continue
      }
      if (item && typeof item === 'object') {
        const point = item as Record<string, unknown>
        pairs.push([Number(point.x), Number(point.y)])
      }
    }
  }

  return pairs
}

/**
 * 归一化轮廓顶点：夹紧到 0~64 方格、去掉重复顶点、限制顶点数。
 * @returns 不可用时返回 null（顶点太少，或整串退化成一个点）
 */
function normalizePoints(raw: unknown): Array<[number, number]> | null {
  const pairs = parsePointPairs(raw)
  if (pairs.length < MIN_PART_VERTICES) return null

  const unit = normalizedUnit(pairs.flat())

  const points: Array<[number, number]> = []
  for (const [x, y] of pairs) {
    const px = partOffset(x, unit)
    const py = partOffset(y, unit)
    const last = points[points.length - 1]
    // 相邻重复顶点对填充没有贡献，去掉可以省扫描开销
    if (last && last[0] === px && last[1] === py) continue
    points.push([px, py])
    if (points.length >= MAX_PART_VERTICES) break
  }

  // 首尾重合会让最后一条闭合边退化成零长度，也去掉
  while (points.length >= 2) {
    const [firstX, firstY] = points[0]
    const [lastX, lastY] = points[points.length - 1]
    if (firstX === lastX && firstY === lastY) points.pop()
    else break
  }

  return points.length >= MIN_PART_VERTICES ? points : null
}

/**
 * 校验一组造型零件：形状白名单 + 坐标夹紧 + 数量上限。
 * polygon 用顶点串描述轮廓，ellipse / rect 用左上角与宽高，坐标都是 0~64 方格。
 */
function normalizeParts(raw: unknown): ScenePart[] {
  if (!Array.isArray(raw)) return []
  const parts: ScenePart[] = []

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const source = item as Record<string, unknown>
    const shape = typeof source.shape === 'string' ? source.shape.trim().toLowerCase() : ''
    if (!(PART_SHAPES as string[]).includes(shape)) continue

    const color = normalizePartColor(source.color)

    if (shape === 'polygon') {
      // 顺带兼容模型写成 SVG path 的情况：把 d / path 里的坐标对抽出来用
      const points = normalizePoints(source.points ?? source.data ?? source.d ?? source.path)
      if (!points) continue
      parts.push({ shape: 'polygon', points, x: 0, y: 0, w: 0, h: 0, color })
    } else {
      const unit = normalizedUnit([source.x, source.y, source.w, source.h])
      parts.push({
        shape: shape as PartShape,
        x: partOffset(source.x, unit),
        y: partOffset(source.y, unit),
        w: partSize(source.w, unit),
        h: partSize(source.h, unit),
        color,
      })
    }

    if (parts.length >= MAX_PARTS) break
  }

  return parts
}

/**
 * 收集「确实画不出来」的景物名：
 * 既没有对应的预设画笔，模型也没给出可用的造型零件，这类对象会在校验时被丢弃。
 */
function collectUnsupported(rawObjects: readonly unknown[]): string[] {
  const names: string[] = []

  for (const item of rawObjects) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const kind = typeof record.kind === 'string' ? record.kind.trim().slice(0, 12) : ''
    if (!kind) continue
    // 有造型零件的会被当作自定造型画出来，不算「画不出来」
    if (normalizeParts(record.parts).length > 0) continue

    const coerced = coerceKind(kind)
    if (coerced && coerced !== 'custom') continue

    const label = normalizeText(record.label, 12)
    const name = label || kind
    if (names.includes(name)) continue

    names.push(name)
    if (names.length >= 5) break
  }

  return names
}

export function isSceneObjectKind(value: unknown): value is SceneObjectKind {
  return typeof value === 'string' && (SCENE_OBJECT_KINDS as string[]).includes(value)
}

export function isTimeOfDay(value: unknown): value is TimeOfDay {
  return typeof value === 'string' && (TIME_OF_DAY as string[]).includes(value)
}

/** 兼容模型输出的复数/口语写法 */
export function coerceKind(value: unknown): SceneObjectKind | null {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (isSceneObjectKind(key)) return key
  return KIND_ALIASES[key] ?? null
}

function coerceDepth(value: unknown): SceneDepth {
  return value === 'far' || value === 'mid' || value === 'near' ? value : 'mid'
}

function normalizeObject(raw: unknown): SceneObject | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>

  const parts = normalizeParts(item.parts)
  let kind = coerceKind(item.kind)

  // 词表外物件：只要模型给了造型零件，就当自定造型画出来，而不是丢掉
  if (!kind) {
    if (parts.length === 0) return null
    kind = 'custom'
  }
  // 声明为自定造型却没有零件（等于没描述长什么样）→ 画不出来
  if (kind === 'custom' && parts.length === 0) return null

  const object: SceneObject = {
    kind,
    depth: coerceDepth(item.depth),
    x: clampNumber(item.x, 0, 1, 0.5),
    scale: clampNumber(item.scale, 0.6, 1.6, 1),
    color: normalizeHex(item.color),
  }

  if (parts.length > 0) {
    object.parts = parts
    object.label = normalizeText(item.label, 12) || normalizeText(item.kind, 12) || OBJECT_LABELS.custom
  } else if (kind === 'custom') {
    object.label = normalizeText(item.label, 12) || OBJECT_LABELS.custom
  }

  return object
}

/** 统计与展示用的归类键：自定造型按物件名区分，其余按 kind 区分 */
function objectTag(object: SceneObject): string {
  return object.kind === 'custom' ? `custom:${object.label ?? ''}` : object.kind
}

/** 同类过多时保留前 N 个；完全重复的直接合并 */
function tidyObjects(objects: readonly SceneObject[]): SceneObject[] {
  const result: SceneObject[] = []
  const seen = new Set<string>()
  const perTag = new Map<string, number>()

  for (const object of objects) {
    const tag = objectTag(object)
    const key = `${tag}:${object.depth}:${Math.round(object.x * 20)}`
    if (seen.has(key)) continue

    const count = perTag.get(tag) ?? 0
    if (count >= MAX_PER_KIND) continue

    seen.add(key)
    perTag.set(tag, count + 1)
    result.push(object)
    if (result.length >= MAX_OBJECTS) break
  }

  return result
}

/**
 * 校验并归一化模型输出。
 * @returns 可用则返回规划，信息完全不可用时返回 null（调用方回退到关键词兜底）
 */
export function normalizePlan(raw: unknown, seed: number): ScenePlan | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>

  const rawObjects = Array.isArray(data.objects) ? data.objects : []
  const objects = tidyObjects(
    rawObjects
      .map((item) => normalizeObject(item))
      .filter((item): item is SceneObject => item !== null)
  )

  const description = normalizeText(data.description, 60)
  if (objects.length === 0 && !description) return null

  const title = normalizeText(data.title, 16)
  const paletteRaw =
    data.palette && typeof data.palette === 'object'
      ? (data.palette as Record<string, unknown>)
      : {}
  const palette: ScenePalette = {
    skyTop: normalizeHex(paletteRaw.skyTop),
    skyBottom: normalizeHex(paletteRaw.skyBottom),
    ground: normalizeHex(paletteRaw.ground),
    water: normalizeHex(paletteRaw.water),
    accent: normalizeHex(paletteRaw.accent),
  }

  return {
    title: title || description.slice(0, 12) || '像素画面',
    description,
    timeOfDay: isTimeOfDay(data.timeOfDay) ? data.timeOfDay : 'day',
    horizon: clampNumber(data.horizon, MIN_HORIZON, MAX_HORIZON, DEFAULT_HORIZON),
    palette,
    objects,
    seed,
    source: 'ai',
    unsupported: collectUnsupported(rawObjects),
  }
}

export interface PlanGroupItem {
  label: string
  count: number
}

export interface PlanGroup {
  depth: SceneDepth
  label: string
  items: PlanGroupItem[]
}

/** 按远近分组，供界面展示「画面构成」；自定造型显示模型给的物件名 */
export function planGroups(plan: ScenePlan): PlanGroup[] {
  const groups = new Map<SceneDepth, Map<string, PlanGroupItem>>()
  const empty: Map<string, PlanGroupItem> = new Map()

  for (const object of plan.objects) {
    const tag = objectTag(object)
    const label =
      object.kind === 'custom' ? (object.label ?? OBJECT_LABELS.custom) : OBJECT_LABELS[object.kind]
    const bucket = groups.get(object.depth) ?? new Map<string, PlanGroupItem>()
    const item = bucket.get(tag) ?? { label, count: 0 }
    item.count += 1
    bucket.set(tag, item)
    groups.set(object.depth, bucket)
  }

  return (['far', 'mid', 'near'] as SceneDepth[])
    .filter((depth) => groups.has(depth))
    .map((depth) => ({
      depth,
      label: DEPTH_LABELS[depth],
      items: [...(groups.get(depth) ?? empty).values()],
    }))
}

/** 一行式画面构成摘要 */
export function planSummary(plan: ScenePlan): string {
  const parts = planGroups(plan).map(
    (group) =>
      `${group.label}：${group.items
        .map((item) => (item.count > 1 ? `${item.label}×${item.count}` : item.label))
        .join('、')}`
  )
  const head = `${TIME_LABELS[plan.timeOfDay]} · ${plan.source === 'ai' ? 'AI 解析' : '关键词兜底'}`
  return parts.length > 0 ? `${head} · ${parts.join('；')}` : head
}

/** 规划里是否包含某类对象 */
export function hasKind(plan: ScenePlan, kind: SceneObjectKind): boolean {
  return plan.objects.some((object) => object.kind === kind)
}

/** 取某类对象 */
export function objectsOfKind(plan: ScenePlan, kind: SceneObjectKind): SceneObject[] {
  return plan.objects.filter((object) => object.kind === kind)
}

/** 空的天空配色：AI 没给颜色时就回退到主题色 */
export const EMPTY_PALETTE: ScenePalette = {
  skyTop: null,
  skyBottom: null,
  ground: null,
  water: null,
  accent: null,
}
