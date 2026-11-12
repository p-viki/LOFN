/**
 * 通用造型渲染器：把模型给的「零件」画成像素。
 *
 * 这是画笔词表之外的第二条绘制路径：
 *   词表内的常见物件 → composer 里手工调过的预设画笔（构图更讲究）；
 *   给了零件的物件     → 模型自己描述的剪影，在这里统一换算成像素。
 * 两条路径产出同一份 RgbGrid，因此限色、抖动、描边等后续步骤完全共用。
 *
 * 坐标系统一为「64 × 64 局部方格，原点左上角、y 轴向下」，与 SVG 的 viewBox 习惯一致：
 * 模型对这套坐标最熟，而 0~1 + 原点左下 + y 向上那套写法它几乎总是画错。
 * 方格按物件包围盒**等比**映射到像素，所以形状画成什么比例，画出来就是什么比例。
 */

import type { PartColor, RgbGrid, SceneObject, ScenePart } from '../types'
import { hexToRgb, isHexColor, luminance, mix } from './color'
import type { Rgb } from './color'
import { blendPixel, fillEllipse, fillPolygon, fillRect, getPixel } from './raster'
import type { ThemeColors } from './themes'

/** 局部方格的边长：模型给的所有坐标都落在这个 0~64 的方格里 */
export const LOCAL_SPAN = 64

/** 渲染所需的最小上下文（与 composer 的 SceneContext 结构兼容，避免互相依赖） */
export interface PartsContext {
  grid: RgbGrid
  c: ThemeColors
  w: number
  h: number
}

/** 物件落位：与 composer 的 Anchor 同构 */
export interface PartAnchor {
  x: number
  baseY: number
  size: number
  color: Rgb | null
}

/** 零件在画面上的像素方框 */
interface Box {
  left: number
  top: number
  width: number
  height: number
}

/**
 * 包围盒边长 = 单位尺寸 × 该系数。
 * 方格是正方形，形状自己决定实际占多少，所以系数要比过去（宽 2.4 / 高 2.0）大一些，
 * 否则按比例画得不满格的物件会显得比同类预设画笔小一圈。
 */
const BOX_SPAN = 3

function clampSpan(value: number, limit: number): number {
  return Math.max(2, Math.min(Math.round(value), Math.round(limit)))
}

/**
 * 模型没给主色时的默认主色：看物件背后的底色深浅来定。
 * 固定用中间色会在夜晚/室内这类深色场景里让物件糊进背景，等于没画。
 */
function pickBodyColor(c: ThemeColors, backdrop: Rgb): Rgb {
  const mid = mix(c.mid, c.structure, 0.3)
  const light = mix(c.structure, c.cloud, 0.25)
  return luminance(backdrop) < 110 ? light : mid
}

/** 语义角色 → 实际颜色 */
function resolveColor(c: ThemeColors, role: PartColor | string, body: Rgb): Rgb {
  switch (role) {
    case 'bodyLight':
      return mix(body, c.cloud, 0.3)
    case 'bodyDark':
      return mix(body, c.ink, 0.32)
    case 'accent':
      return c.accent
    case 'wood':
      return c.structure
    case 'metal':
      return mix(c.far, c.cloud, 0.3)
    case 'glass':
      return mix(c.skyBottom, c.cloud, 0.32)
    case 'sky':
      return c.skyBottom
    case 'ground':
      return c.ground
    case 'water':
      return c.water
    case 'light':
      return c.glow
    case 'ink':
      return c.ink
    default:
      // 模型直接给了色值就用它，认不出则回退主体色
      return isHexColor(role) ? hexToRgb(String(role)) : body
  }
}

/** 局部方格坐标 → 像素坐标（等比，不拉伸） */
function project(box: Box, x: number, y: number): [number, number] {
  return [box.left + (x / LOCAL_SPAN) * box.width, box.top + (y / LOCAL_SPAN) * box.height]
}

/** 顶点集的中点，用来取这块零件背后的底色 */
function centerOf(points: readonly (readonly [number, number])[]): [number, number] {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const [x, y] of points) {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2]
}

/** 零件与底色至少要拉开的亮度差 */
const MIN_PART_CONTRAST = 44

/**
 * 保证零件在它所在的位置看得见。
 * 语义配色是跟着场景主题走的，夜里「金属」「深色面」很容易和墙面/地面几乎同色，
 * 画上去等于没画（机器人的腿就曾整条消失在墙上），所以这里按背后底色推一把。
 */
function ensureContrast(c: ThemeColors, color: Rgb, backdrop: Rgb): Rgb {
  const gap = Math.abs(luminance(color) - luminance(backdrop))
  if (gap >= MIN_PART_CONTRAST) return color

  // 底色亮就压暗、底色暗就提亮；最多推两次，避免颜色被推得认不出来
  const toward: Rgb = luminance(backdrop) < 128 ? [255, 255, 255] : c.ink
  let result = color
  for (let step = 0; step < 2; step += 1) {
    result = mix(result, toward, 0.4)
    if (Math.abs(luminance(result) - luminance(backdrop)) >= MIN_PART_CONTRAST) break
  }
  return result
}

function paintPart(ctx: PartsContext, part: ScenePart, box: Box, body: Rgb): void {
  if (part.shape === 'polygon') {
    const points = (part.points ?? []).map(([x, y]) => project(box, x, y))
    if (points.length < 3) return
    const [cx, cy] = centerOf(points)
    const backdrop = getPixel(ctx.grid, cx, cy)
    fillPolygon(ctx.grid, points, ensureContrast(ctx.c, resolveColor(ctx.c, part.color, body), backdrop))
    return
  }

  // rect / ellipse 同样用 0~64 坐标，此处换算成像素方框
  const [left, top] = project(box, part.x, part.y)
  const [right, bottom] = project(box, part.x + part.w, part.y + part.h)
  const width = Math.max(1, Math.round(right - left))
  const height = Math.max(1, Math.round(bottom - top))
  const backdrop = getPixel(ctx.grid, left + width / 2, top + height / 2)
  const color = ensureContrast(ctx.c, resolveColor(ctx.c, part.color, body), backdrop)

  if (part.shape === 'ellipse') {
    fillEllipse(ctx.grid, left, top, width, height, color)
    return
  }
  fillRect(ctx.grid, left, top, width, height, color)
}

/**
 * 按模型的造型描述绘制一个物件。
 * 局部方格（0~64，原点左上）→ 像素：先算出正方形包围盒，再逐个零件落笔。
 */
export function paintParts(ctx: PartsContext, object: SceneObject, anchor: PartAnchor): void {
  const parts = object.parts
  if (!parts || parts.length === 0) return

  // 上限收得比画布略紧：近景物件的方格容易横跨半个画面，压住旁边的物件
  const side = clampSpan(anchor.size * BOX_SPAN, Math.min(ctx.w * 0.6, ctx.h * 0.7))
  const left = Math.max(0, Math.min(ctx.w - side, anchor.x - Math.round(side / 2)))
  // 方格底边坐在落地线上，因此「零件画到 y=64」就等于站在地上
  const box: Box = { left, top: anchor.baseY - side + 1, width: side, height: side }

  // 主色：模型指定优先，否则按物件所在位置的背景深浅自动挑一个看得清的颜色
  const backdrop = getPixel(ctx.grid, anchor.x, anchor.baseY - Math.round(side * 0.5))
  const body = anchor.color ?? pickBodyColor(ctx.c, backdrop)

  for (const part of parts) {
    paintPart(ctx, part, box, body)
  }

  // 落地阴影：自定造型也能「站」在地上，而不是浮着
  const shadowWidth = Math.max(2, Math.round(side * 0.7))
  fillEllipse(
    ctx.grid,
    anchor.x - Math.round(shadowWidth / 2),
    anchor.baseY,
    shadowWidth,
    2,
    ctx.c.ink,
    0.2
  )
  blendPixel(ctx.grid, anchor.x, anchor.baseY, ctx.c.ink, 0.12)
}
