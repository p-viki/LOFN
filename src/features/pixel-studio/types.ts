/**
 * 像素工坊（Pixel Studio）的领域类型。
 *
 * 核心是「画面规划 ScenePlan」：
 *   AI 把一句画面描述（可附带参考图）翻译成一份结构化规划
 *   —— 时间氛围、地平线高度、配色、以及若干「画面对象（kind + 远近 + 水平位置 + 大小）」，
 *   前端渲染器再按这份规划从远到近逐层把画面画出来。
 *
 * 两条渲染路径共用同一套数据结构：
 *   1. 参考图 → 降采样 + 限色（保真像素化）；
 *   2. 画面规划 → 程序化合成 → 限色（AI 绘制）。
 *
 * 中间产物统一是「真彩网格 RgbGrid」，最后一步才限色为「像素画 PixelGrid」，
 * 因此抖动、描边、调色板等逻辑只实现一次。
 */

/** 调色板：auto 表示从画面自身的颜色分布中提取 */
export type PaletteId = 'pico8' | 'gameboy' | 'nes' | 'pastel' | 'mono' | 'auto'

export type DitherMode = 'none' | 'bayer' | 'floyd'

/** 时间/天气氛围，决定场景配色主题 */
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night' | 'storm' | 'snow'

/** 地貌：仅用于纯前端关键词兜底时补全默认元素 */
export type Biome = 'plain' | 'mountains' | 'forest' | 'coast' | 'desert' | 'city' | 'space'

/** 关键词层能识别出的元素（AI 不可用时的兜底） */
export type SceneElement =
  | 'sun'
  | 'moon'
  | 'stars'
  | 'clouds'
  | 'rain'
  | 'snow'
  | 'mountains'
  | 'hills'
  | 'forest'
  | 'house'
  | 'castle'
  | 'city'
  | 'water'
  | 'meadow'
  | 'road'
  | 'boats'
  | 'birds'
  | 'windmill'
  | 'lighthouse'
  | 'cactus'
  | 'palm'
  | 'rocket'
  | 'planet'
  | 'cat'
  | 'sofa'
  | 'table'
  | 'chair'
  | 'rug'
  | 'lamp'
  | 'window'
  | 'person'

/** 渲染结果来源：保真像素化 / AI 绘制 */
export type ArtworkKind = 'faithful' | 'rebuilt'

/** 画面对象可取的种类（与 dev 代理提示词中的清单一一对应） */
export type SceneObjectKind =
  // 地形
  | 'mountain'
  | 'hill'
  | 'city'
  | 'rock'
  // 植被
  | 'forest'
  | 'tree'
  | 'palm'
  | 'cactus'
  | 'flower'
  // 水体与道路
  | 'water'
  | 'boat'
  | 'road'
  // 建筑与营地
  | 'house'
  | 'castle'
  | 'lighthouse'
  | 'windmill'
  | 'tent'
  | 'campfire'
  // 天空
  | 'sun'
  | 'moon'
  | 'star'
  | 'cloud'
  | 'bird'
  | 'rocket'
  | 'planet'
  // 天气
  | 'rain'
  | 'snow'
  | 'fog'
  // 室内与近景（墙面由 skyTop/skyBottom 表达，地板由 ground 表达）
  | 'cat'
  | 'sofa'
  | 'table'
  | 'chair'
  | 'rug'
  | 'lamp'
  | 'window'
  | 'person'
  /**
   * 词表外物件的容器：物件名放在 label，造型放在 parts。
   * 有了它，画笔词表就不再是「能画什么」的上限，只是常用物件的高画质捷径。
   */
  | 'custom'

/** 远近层次：决定对象画在画面的哪一带、以及默认大小 */
export type SceneDepth = 'far' | 'mid' | 'near'

/**
 * 通用造型的形状。
 * polygon 是主要表达方式：模型直接给一圈轮廓顶点，能画出任意剪影（含轮拱这类凹形）；
 * rect / ellipse 是常用形状的简写，省顶点也省 token。
 */
export type PartShape = 'polygon' | 'ellipse' | 'rect'

/** 零件的语义配色角色：模型不必猜具体色值，跟着场景主题走 */
export type PartColor =
  /** 主体色（物件没给 color 时取主题中间色） */
  | 'body'
  | 'bodyLight'
  | 'bodyDark'
  | 'accent'
  | 'wood'
  | 'metal'
  | 'glass'
  | 'sky'
  | 'ground'
  | 'water'
  | 'light'
  | 'ink'

/**
 * 一个造型零件。
 *
 * 坐标系统一为「64 × 64 的局部方格，原点在左上角、y 轴向下」——与 SVG 的 viewBox 一致，
 * 也是模型最不容易画错的一套写法。方格按物件包围盒等比映射到像素，
 * 因此形状本身的比例就是最终的比例，不需要模型去心算拉伸。
 */
export interface ScenePart {
  shape: PartShape
  /** polygon 专用：轮廓顶点 [x, y]，按顺序连成闭合路径，3~64 个 */
  points?: Array<[number, number]>
  /** rect / ellipse 用：左上角与宽高（同一套 0~64 坐标） */
  x: number
  y: number
  w: number
  h: number
  /** 语义角色名，或直接给 #rrggbb */
  color: PartColor | string
}

/** 一个画面对象：AI 给「是什么 + 在哪 + 多大」，必要时再给一套自定造型 */
export interface SceneObject {
  kind: SceneObjectKind
  depth: SceneDepth
  /** 水平位置 0~1（0=最左，1=最右） */
  x: number
  /** 相对尺寸 0.6~1.6 */
  scale: number
  /** 可选主色覆盖（#rrggbb） */
  color: string | null
  /** kind 为 custom 时的物件名（如「恐龙」「汽车」），用于提示与展示 */
  label?: string
  /** 自定造型零件；给了它就按它画，覆盖同 kind 的预设画笔 */
  parts?: ScenePart[]
}

/** AI 建议的画面配色（缺省项回退到时间氛围主题色） */
export interface ScenePalette {
  skyTop: string | null
  skyBottom: string | null
  ground: string | null
  water: string | null
  accent: string | null
}

/** 画面规划：AI 分析或关键词兜底产出的、可直接绘制的结构化描述 */
export interface ScenePlan {
  title: string
  description: string
  timeOfDay: TimeOfDay
  /** 地平线高度占画面高度的比例（0.45~0.72） */
  horizon: number
  palette: ScenePalette
  objects: SceneObject[]
  /** 用于云朵、星空、浪花等细节的确定性随机种子 */
  seed: number
  source: 'ai' | 'local'
  /**
   * 既没有对应预设画笔、模型也没给出造型描述，因而确实画不出来的景物名。
   * 留在这里是为了能明确告诉用户「什么没画出来」，而不是画面里少了几样东西却毫无提示。
   */
  unsupported: string[]
}

/** 真彩中间网格（RGBA） */
export interface RgbGrid {
  width: number
  height: number
  data: Uint8ClampedArray
}

/** 最终像素画：调色板 + 每像素色号 */
export interface PixelGrid {
  width: number
  height: number
  palette: string[]
  indices: Uint8Array
}

/** 渲染参数（用户在界面上可调） */
export interface RenderOptions {
  /** 输出分辨率：最长边的像素数 */
  cols: number
  paletteId: PaletteId
  dither: DitherMode
  outline: boolean
}

/** 参考图（上传 / 粘贴 / 来自草图生图画板） */
export interface ReferenceImage {
  dataUrl: string
  name: string
  width: number
  height: number
  /** 是否由「草图生图」页面传入 */
  fromSketchBoard: boolean
}

/** 一份可交付的像素画作品 */
export interface PixelArtwork {
  kind: ArtworkKind
  grid: PixelGrid
  html: string
}
