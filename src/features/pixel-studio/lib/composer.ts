/**
 * 场景合成器：把「画面规划 ScenePlan」逐层画成真彩网格。
 *
 * 绘制顺序固定为「从远到近」：
 *   天空渐变 → 星空/日月/星球/云/飞鸟 → 远景地貌（山/丘陵/城市）
 *   → 地面 → 水面 → 道路 → 立在地上的物件（按远近排序）→ 天气覆盖
 *
 * 所有随机细节都来自 plan.seed，因此同一份规划每次渲染结果完全一致；
 * 换种子只改变云、星、浪花这类细节，主体构成由规划决定。
 */

import type { RgbGrid, SceneObject, SceneObjectKind, ScenePlan } from '../types'
import { DEPTH_ANCHORS, DEPTH_ORDER, hasKind, objectsOfKind } from './scenePlan'
import {
  blendPixel,
  createRgbGrid,
  drawLine,
  fillCircle,
  fillColumn,
  fillRect,
  fillRow,
  setPixel,
} from './raster'
import { paintParts } from './parts'
import { createRandom, hashText } from './random'
import type { Random } from './random'
import { hexToRgb, luminance, mix } from './color'
import type { Rgb } from './color'
import { mapTheme, themeForPlan } from './themes'
import type { ThemeColors } from './themes'

/** 画面宽高比：像素画常用的横版比例 */
const ASPECT = 0.62

/** 一个对象的落位与尺寸 */
interface Anchor {
  /** 水平中心（像素） */
  x: number
  /** 底部所在行 */
  baseY: number
  /** 单位尺寸（像素），各绘制函数按比例取用 */
  size: number
  /** 可选主色覆盖 */
  color: Rgb | null
}

interface SceneContext {
  grid: RgbGrid
  c: ThemeColors
  w: number
  h: number
  horizon: number
  plan: ScenePlan
  rand: Random
}

export function composeScene(plan: ScenePlan, cols: number): RgbGrid {
  const width = Math.max(16, Math.min(160, Math.round(cols)))
  const height = Math.max(12, Math.min(120, Math.round(width * ASPECT)))
  const c = mapTheme(themeForPlan(plan))
  const horizon = Math.max(4, Math.min(height - 4, Math.round(height * plan.horizon)))

  // 规划本身 + 种子 → 细节随机源：改种子只变细节，不变构图
  const signature = plan.objects
    .map((object) => `${object.kind}${object.label ?? ''}${object.depth}${object.x.toFixed(2)}`)
    .join(',')
  const seed = (plan.seed ^ hashText(`${plan.title}|${signature}`)) >>> 0

  const ctx: SceneContext = {
    grid: createRgbGrid(width, height, c.skyTop),
    c,
    w: width,
    h: height,
    horizon,
    plan,
    rand: createRandom(seed),
  }

  drawSky(ctx)
  drawSkyObjects(ctx)
  drawTerrainLayers(ctx)
  drawGround(ctx)
  drawWater(ctx)
  drawRoad(ctx)
  drawStandingObjects(ctx)
  drawWeather(ctx)

  return ctx.grid
}

/* ------------------------------ 落位计算 ------------------------------ */

function anchorFor(ctx: SceneContext, object: SceneObject): Anchor {
  const { w, h, horizon } = ctx
  const spec = DEPTH_ANCHORS[object.depth]
  const unit = Math.min(w * 0.12, h * 0.18)
  const size = Math.max(2, Math.round(unit * spec.size * object.scale))
  const margin = Math.max(1, Math.round(size * 0.6))
  const x = Math.max(margin, Math.min(w - 1 - margin, Math.round(object.x * (w - 1))))
  const color = object.color ? hexToRgb(object.color) : null

  // 窗户挂在墙上，不落在地面：远近只影响大小，竖直位置固定在地平线以上
  if (object.kind === 'window') {
    return { x, baseY: Math.max(2, horizon - Math.round(size * 1.1)), size, color }
  }

  const baseY = Math.min(h - 1, horizon + Math.round((h - 1 - horizon) * spec.base))
  return { x, baseY, size, color }
}

/** 把某个方向的尺寸压回画面允许的范围内，避免高瘦物件撑爆构图 */
function clampSpan(value: number, limit: number): number {
  return Math.max(1, Math.min(Math.round(value), Math.round(limit)))
}

/* -------------------------------- 天空 -------------------------------- */

function drawSky(ctx: SceneContext): void {
  const { grid, c, w, horizon } = ctx
  for (let y = 0; y <= horizon; y += 1) {
    const t = horizon === 0 ? 0 : y / horizon
    // 上段变化慢、下段变化快，更接近真实天空
    fillRow(grid, y, 0, w, mix(c.skyTop, c.skyBottom, Math.pow(t, 0.75)))
  }

  // 地平线附近的暖光带，让天地衔接更自然
  const glow = hasKind(ctx.plan, 'sun') ? c.glow : c.skyBottom
  const bandStart = Math.max(0, horizon - Math.max(1, Math.round(horizon * 0.2)))
  for (let y = bandStart; y <= horizon; y += 1) {
    const t = (y - bandStart) / Math.max(1, horizon - bandStart)
    for (let x = 0; x < w; x += 1) blendPixel(grid, x, y, glow, 0.06 + 0.12 * t)
  }
}

function drawSkyObjects(ctx: SceneContext): void {
  drawStars(ctx)

  for (const object of objectsOfKind(ctx.plan, 'sun')) drawCelestial(ctx, object, true)
  for (const object of objectsOfKind(ctx.plan, 'moon')) drawCelestial(ctx, object, false)
  for (const object of objectsOfKind(ctx.plan, 'planet')) drawPlanet(ctx, object)
  for (const object of objectsOfKind(ctx.plan, 'rocket')) drawRocket(ctx, object)
  for (const object of objectsOfKind(ctx.plan, 'cloud')) drawCloud(ctx, object)
  for (const object of objectsOfKind(ctx.plan, 'bird')) drawBirds(ctx, object)
}

function drawStars(ctx: SceneContext): void {
  const { grid, c, w, horizon, rand, plan } = ctx
  const star = objectsOfKind(plan, 'star')[0]
  // 星空：显式要求，或夜晚有较大概率出现
  if (!star && !(plan.timeOfDay === 'night' && rand.chance(0.75))) return

  // 星空密度收敛一点：太多亮星会盖过主体
  const density = Math.min(
    Math.round(((w * horizon) / 26) * (star ? Math.max(0.8, Math.min(1.4, star.scale)) : 0.9)),
    Math.max(6, Math.round((w * horizon) / 14))
  )
  for (let i = 0; i < density; i += 1) {
    const x = rand.int(0, w - 1)
    const y = rand.int(0, Math.max(1, Math.round(horizon * 0.8)))
    // 少部分亮星 + 大量暗星，才像星空而不是噪点
    setPixel(grid, x, y, rand.chance(0.18) ? c.celestial : mix(c.celestial, c.skyTop, 0.35))
  }
}

function drawCelestial(ctx: SceneContext, object: SceneObject, isSun: boolean): void {
  const { grid, c, w, horizon, rand } = ctx
  const anchor = anchorFor(ctx, object)
  const radius = clampSpan(Math.max(2, anchor.size * 0.62), w * 0.1)
  const cx = Math.max(radius, Math.min(w - 1 - radius, anchor.x))
  const cy = Math.max(radius, Math.round(horizon * rand.range(0.16, 0.36)))
  const body = anchor.color ?? c.celestial

  fillCircle(grid, cx, cy, radius + Math.max(1, Math.round(radius * 0.7)), c.glow, isSun ? 0.3 : 0.18)
  fillCircle(grid, cx, cy, radius, body)

  if (isSun && object.scale >= 1.2) {
    const rays = Math.max(4, Math.round(radius * 2))
    for (let i = 0; i < rays; i += 1) {
      const angle = (Math.PI * 2 * i) / rays + rand.range(-0.2, 0.2)
      const inner = radius + 1
      const outer = radius + 2 + rand.int(0, 2)
      drawLine(
        grid,
        cx + Math.cos(angle) * inner,
        cy + Math.sin(angle) * inner,
        cx + Math.cos(angle) * outer,
        cy + Math.sin(angle) * outer,
        c.glow
      )
    }
  }
}

function drawPlanet(ctx: SceneContext, object: SceneObject): void {
  const { grid, c, w, horizon } = ctx
  const anchor = anchorFor(ctx, object)
  const radius = Math.max(3, Math.round(anchor.size * 1.05))
  const cx = Math.max(radius, Math.min(w - 1 - radius, anchor.x))
  const cy = Math.max(radius + 1, Math.round(horizon * 0.34))
  const base = anchor.color ?? c.far

  fillCircle(grid, cx, cy, radius + 2, c.glow, 0.16)
  fillCircle(grid, cx, cy, radius, base)
  fillCircle(
    grid,
    cx - Math.max(1, Math.round(radius * 0.35)),
    cy - Math.max(1, Math.round(radius * 0.35)),
    Math.max(1, Math.round(radius * 0.45)),
    mix(base, c.celestial, 0.5)
  )
  // 光环：画在下方一点，看起来是环绕行星
  fillRow(
    grid,
    cy + Math.max(1, Math.round(radius * 0.3)),
    cx - radius - 3,
    radius * 2 + 7,
    mix(base, c.foam, 0.7)
  )
}

function drawRocket(ctx: SceneContext, object: SceneObject): void {
  const { grid, c, w, h, horizon, rand } = ctx
  const anchor = anchorFor(ctx, object)
  const height = clampSpan(Math.max(5, anchor.size * 2.2), h * 0.46)
  const width = clampSpan(Math.max(2, height * 0.34), w * 0.14)
  const cx = Math.max(2, Math.min(w - 3, anchor.x))
  const top = Math.max(3, Math.round(horizon * 0.3))
  const body = anchor.color ?? c.structure

  fillRect(grid, cx - Math.floor(width / 2), top, width, height, body)
  for (let i = 1; i <= Math.max(1, Math.round(width / 2)); i += 1) {
    const rowWidth = Math.max(1, width - (i - 1) * 2)
    fillRow(grid, top - i, cx - Math.floor(rowWidth / 2), rowWidth, mix(body, c.celestial, 0.3))
  }
  fillRow(grid, top + height - 1, cx - Math.floor(width / 2) - 1, width + 2, c.accent)
  setPixel(grid, cx, top + Math.max(1, Math.round(height * 0.28)), c.window)

  const flames = rand.int(2, 4)
  for (let i = 0; i < flames; i += 1) {
    const flameWidth = Math.max(1, width - 1 - i)
    fillRow(
      grid,
      top + height + i,
      cx - Math.floor(flameWidth / 2),
      flameWidth,
      mix(c.accent, c.glow, i / flames)
    )
  }
}

function drawCloud(ctx: SceneContext, object: SceneObject): void {
  const { grid, c, w, horizon, rand } = ctx
  const anchor = anchorFor(ctx, object)
  const base = anchor.color ?? c.cloud
  const shade = mix(base, c.cloudShade, 0.75)
  const width = Math.max(4, Math.round(anchor.size * rand.range(1.6, 2.8)))
  const cy = Math.max(
    2,
    Math.round(horizon * (object.depth === 'near' ? rand.range(0.1, 0.26) : rand.range(0.2, 0.55)))
  )
  const left = Math.max(0, Math.min(w - width, anchor.x - Math.round(width / 2)))

  fillRow(grid, cy + 1, left, width, shade)
  fillRow(grid, cy, left + Math.round(width * 0.12), Math.round(width * 0.76), base)
  fillRow(grid, cy - 1, left + Math.round(width * 0.3), Math.round(width * 0.34), base)
}

function drawBirds(ctx: SceneContext, object: SceneObject): void {
  const { grid, c, w, horizon, rand, plan } = ctx
  const anchor = anchorFor(ctx, object)
  // 远处的鸟是剪影，用比纯墨色柔和一点的颜色，避免满屏黑点
  const color = anchor.color ?? mix(c.ink, c.skyTop, 0.35)
  // 规划里已经逐只列了鸟（「三只鸟」→ 三个 bird）时，每个对象只画一只
  const count = objectsOfKind(plan, 'bird').length > 1 ? 1 : rand.int(2, 3)

  for (let i = 0; i < count; i += 1) {
    const x = Math.max(2, Math.min(w - 3, anchor.x + rand.int(-5, 5)))
    const y = Math.max(2, Math.min(Math.max(2, horizon - 1), Math.round(horizon * rand.range(0.2, 0.6))))
    // 三像素的小 V，才像远处的飞鸟
    setPixel(grid, x - 1, y - 1, color)
    setPixel(grid, x, y, color)
    setPixel(grid, x + 1, y - 1, color)
  }
}

/* ------------------------------ 远景地貌 ------------------------------ */

function drawTerrainLayers(ctx: SceneContext): void {
  const layered = ctx.plan.objects
    .filter(
      (object) => object.kind === 'mountain' || object.kind === 'hill' || object.kind === 'city'
    )
    .sort((a, b) => DEPTH_ORDER[a.depth] - DEPTH_ORDER[b.depth] || a.x - b.x)

  for (const object of layered) {
    if (object.kind === 'city') drawCity(ctx, object)
    else drawRidge(ctx, object, object.kind === 'mountain' ? 'mountain' : 'hill')
  }
}

/** 山脉（三角峰）与丘陵（缓坡）共用的山脊绘制 */
function drawRidge(ctx: SceneContext, object: SceneObject, kind: 'mountain' | 'hill'): void {
  const { grid, c, w, h, horizon, rand } = ctx
  const anchor = anchorFor(ctx, object)
  const color = anchor.color ?? (kind === 'mountain' ? c.far : c.mid)
  const maxHeight = Math.max(2, Math.round(horizon * (kind === 'mountain' ? 0.62 : 0.34) * object.scale))
  const span = kind === 'mountain' ? Math.max(4, Math.round(w * 0.42)) : w
  const peaks = kind === 'mountain' ? rand.int(2, 3) : 1

  const peakX: number[] = []
  const peakY: number[] = []
  for (let i = 0; i < peaks; i += 1) {
    peakX.push(anchor.x + Math.round(rand.range(-span * 0.6, span * 0.6)))
    peakY.push(horizon - Math.round(maxHeight * rand.range(0.55, 1)))
  }

  const start = Math.max(0, anchor.x - span)
  const end = Math.min(w - 1, anchor.x + span)
  const tops = new Map<number, number>()

  for (let x = start; x <= end; x += 1) {
    let top = horizon
    for (let i = 0; i < peaks; i += 1) {
      const dx = Math.abs(x - peakX[i])
      const reach = Math.max(3, span * 0.7)
      if (dx > reach) continue
      const ratio = dx / reach
      const y = Math.round(
        peakY[i] + (horizon - peakY[i]) * (kind === 'mountain' ? ratio : Math.pow(ratio, 1.7))
      )
      if (y < top) top = y
    }
    if (top >= horizon) continue
    tops.set(x, top)
    fillColumn(grid, x, top, h - top, color)
  }

  // 山脚压暗，避免远景与地面糊成一片
  const shade = mix(color, c.ink, 0.28)
  tops.forEach((top, x) => {
    for (let y = Math.max(top, horizon - 2); y < horizon; y += 1) {
      blendPixel(grid, x, y, shade, 0.5)
    }
  })
}

function drawCity(ctx: SceneContext, object: SceneObject): void {
  const { grid, c, w, horizon, rand } = ctx
  const anchor = anchorFor(ctx, object)
  const base = anchor.color ?? c.mid
  const shade = mix(base, c.ink, 0.32)
  const maxHeight = Math.max(3, Math.round(horizon * 0.6 * object.scale))
  const span = Math.max(6, Math.round(w * 0.7))
  const dark = luminance(c.skyTop) < 130

  let x = Math.max(0, anchor.x - Math.round(span / 2))
  const limit = Math.min(w, x + span)
  while (x < limit) {
    const buildingWidth = Math.min(limit - x, rand.int(2, Math.max(2, Math.round(w * 0.09))))
    const buildingHeight = rand.int(Math.max(2, Math.round(maxHeight * 0.35)), maxHeight)
    const top = horizon - buildingHeight
    fillRect(grid, x, top, buildingWidth, buildingHeight + 1, rand.chance(0.5) ? base : shade)

    if (buildingHeight >= 3) {
      for (let wy = top + 1; wy < horizon; wy += 2) {
        for (let wx = x + 1; wx < x + buildingWidth - 1; wx += 2) {
          // 夜景里只有少数窗亮着，白天则整体不画窗
          if (dark && rand.chance(0.4)) setPixel(grid, wx, wy, c.window)
        }
      }
    }
    x += buildingWidth + rand.int(0, 1)
  }
}

/* ------------------------------ 地面与水 ------------------------------ */

function drawGround(ctx: SceneContext): void {
  const { grid, c, w, h, horizon, rand } = ctx
  const far = mix(c.ground, c.ink, 0.14)

  for (let y = horizon; y < h; y += 1) {
    const t = (y - horizon) / Math.max(1, h - horizon)
    fillRow(grid, y, 0, w, mix(far, c.ground, Math.pow(t, 0.8)))
  }

  // 近处压深，形成地面纵深
  const bandStart = h - Math.max(1, Math.round((h - horizon) * 0.4))
  for (let y = bandStart; y < h; y += 1) {
    const t = (y - bandStart) / Math.max(1, h - bandStart)
    for (let x = 0; x < w; x += 1) blendPixel(grid, x, y, c.groundShade, 0.28 * t)
  }

  const dots = Math.round((w * (h - horizon)) / 32)
  for (let i = 0; i < dots; i += 1) {
    blendPixel(
      grid,
      rand.int(0, w - 1),
      rand.int(horizon, h - 1),
      rand.chance(0.5) ? c.groundShade : c.plant,
      0.3
    )
  }
}

function drawWater(ctx: SceneContext): void {
  const object = objectsOfKind(ctx.plan, 'water')[0]
  if (!object) return

  const { grid, c, w, h, horizon, rand } = ctx
  const base = object.color ? hexToRgb(object.color) : c.water
  const shade = mix(base, c.ink, 0.3)
  const light = mix(base, c.foam, 0.45)
  const span = Math.max(2, Math.round((h - horizon) * Math.min(0.85, 0.72 * object.scale)))
  const bottom = Math.min(h - 1, horizon + span)

  for (let y = horizon; y <= bottom; y += 1) {
    const t = (y - horizon) / Math.max(1, bottom - horizon)
    let color = mix(base, shade, Math.pow(t, 0.9))
    if (y === horizon) color = light
    // 紧贴地平线的一行压暗，淡淡的天色下也能看出海天分界
    else if (y === horizon + 1) color = mix(base, c.ink, 0.22)
    fillRow(grid, y, 0, w, color)
  }

  // 波纹：短而稀，避免糊成一片碎块
  const waves = Math.max(2, Math.round(w / 8))
  for (let i = 0; i < waves; i += 1) {
    const y = rand.int(horizon + 1, Math.max(horizon + 1, bottom))
    const length = rand.int(2, Math.max(2, Math.round(w * 0.08)))
    fillRow(
      grid,
      y,
      rand.int(0, Math.max(0, w - length - 1)),
      length,
      rand.chance(0.5) ? mix(base, c.foam, 0.35) : mix(base, c.foam, 0.18)
    )
  }

  // 天际倒影
  for (let y = horizon; y <= Math.min(bottom, horizon + 2); y += 1) {
    for (let x = 0; x < w; x += 1) blendPixel(grid, x, y, c.skyBottom, 0.16)
  }
}

function drawRoad(ctx: SceneContext): void {
  const object = objectsOfKind(ctx.plan, 'road')[0]
  if (!object) return

  const { grid, c, h, horizon } = ctx
  const anchor = anchorFor(ctx, object)
  const color = anchor.color ?? c.structureShade
  // 近大远小的透视：地平线处很窄，画面底部略宽，避免抢掉主体
  const topHalf = Math.max(1, Math.round(anchor.size * 0.18))
  const bottomHalf = Math.max(topHalf + 1, Math.round(anchor.size * 0.85))

  for (let y = horizon; y < h; y += 1) {
    const t = (y - horizon) / Math.max(1, h - horizon)
    const half = Math.round(topHalf + (bottomHalf - topHalf) * t)
    fillRow(grid, y, anchor.x - half, half * 2 + 1, color)
  }

  const dashColor = mix(color, c.cloud, 0.55)
  for (let y = horizon + 1; y < h; y += 3) {
    const t = (y - horizon) / Math.max(1, h - horizon)
    const half = Math.round(topHalf + (bottomHalf - topHalf) * t)
    if (half < 2) continue
    fillRow(grid, y, anchor.x - 1, 2, dashColor)
  }
}

/* ------------------------------ 立地物件 ------------------------------ */

function drawStandingObjects(ctx: SceneContext): void {
  const standing = ctx.plan.objects
    // 有自定造型的物件不依赖预设画笔，同样要画
    .filter((object) => hasParts(object) || STANDING_PAINTERS[object.kind] !== undefined)
    // 同一远近内，蹲在家具上的小物件排在后面画，才不会被家具盖住
    .sort(
      (a, b) =>
        DEPTH_ORDER[a.depth] - DEPTH_ORDER[b.depth] ||
        Number(RIDER_KINDS.has(a.kind)) - Number(RIDER_KINDS.has(b.kind)) ||
        a.x - b.x
    )

  for (const object of standing) {
    const anchor = anchorFor(ctx, object)
    const host = surfaceHost(ctx, object)
    // 「猫在沙发上」：主角要蹲在家具面上，而不是站在家具前面的地上
    if (host) anchor.baseY = Math.max(2, anchor.baseY - surfaceLift(ctx, host))

    // 模型给了自定造型就按它画：既能画词表外的物件，也能覆盖同 kind 的预设构图
    if (hasParts(object)) {
      paintParts(ctx, object, anchor)
      continue
    }

    const painter = STANDING_PAINTERS[object.kind]
    if (painter) painter(ctx, object, anchor)
  }
}

function hasParts(object: SceneObject): boolean {
  return (object.parts?.length ?? 0) > 0
}

/** 会蹲到家具上的小物件 */
const RIDER_KINDS: ReadonlySet<SceneObjectKind> = new Set<SceneObjectKind>(['cat'])
/** 能承载小物件的家具 */
const FURNITURE_KINDS: ReadonlySet<SceneObjectKind> = new Set<SceneObjectKind>([
  'sofa',
  'table',
  'chair',
])
/** 家具台面相对地面的高度：与画笔算式完全一致，主角才会正好蹲在面上 */
function surfaceLift(ctx: SceneContext, host: SceneObject): number {
  const size = anchorFor(ctx, host).size
  switch (host.kind) {
    case 'sofa':
      // 坐垫比底座高一行，猫蹲在坐垫顶面
      return Math.max(1, sofaMetrics(ctx, size).seatHeight - 1)
    case 'table':
      return Math.max(1, tableMetrics(ctx, size).height - 1)
    case 'chair':
      return Math.max(1, chairMetrics(ctx, size).seatHeight)
    default:
      return Math.max(1, Math.round(size * 0.5))
  }
}

/** 找小物件身下的家具（同远近、水平位置接近） */
function surfaceHost(ctx: SceneContext, object: SceneObject): SceneObject | null {
  if (!RIDER_KINDS.has(object.kind)) return null
  return (
    ctx.plan.objects.find(
      (other) =>
        FURNITURE_KINDS.has(other.kind) &&
        other.depth === object.depth &&
        Math.abs(other.x - object.x) <= 0.14
    ) ?? null
  )
}



type ObjectPainter = (ctx: SceneContext, object: SceneObject, anchor: Anchor) => void

const STANDING_PAINTERS: Partial<Record<SceneObjectKind, ObjectPainter>> = {
  tree: (ctx, _object, anchor) => {
    const limit = Math.min(ctx.w * 0.2, ctx.h * 0.3)
    paintTree(ctx, anchor.x, anchor.baseY, clampSpan(anchor.size, limit), anchor.color)
  },
  forest: (ctx, _object, anchor) => {
    const count = ctx.rand.int(3, 5)
    const limit = Math.min(ctx.w * 0.18, ctx.h * 0.26)
    for (let i = 0; i < count; i += 1) {
      const x = anchor.x + Math.round((i - (count - 1) / 2) * anchor.size * 0.85)
      if (x < 1 || x > ctx.w - 2) continue
      const size = clampSpan(anchor.size * ctx.rand.range(0.72, 1.1), limit)
      paintTree(ctx, x, Math.min(ctx.h - 1, anchor.baseY + (i % 2)), size, anchor.color)
    }
  },
  palm: paintPalm,
  cactus: paintCactus,
  rock: paintRock,
  flower: paintFlower,
  house: paintHouse,
  castle: paintCastle,
  lighthouse: paintLighthouse,
  windmill: paintWindmill,
  tent: paintTent,
  campfire: paintCampfire,
  boat: paintBoat,
  cat: paintCat,
  sofa: paintSofa,
  table: paintTable,
  chair: paintChair,
  rug: paintRug,
  lamp: paintLamp,
  window: paintWindow,
  person: paintPerson,
}

function paintTree(
  ctx: SceneContext,
  x: number,
  baseY: number,
  size: number,
  tint: Rgb | null
): void {
  const { grid, c, rand } = ctx
  const trunkHeight = Math.max(1, Math.round(size * 0.32))
  const canopyBase = baseY - trunkHeight
  const light = tint ?? c.plant
  const dark = tint ? mix(tint, c.ink, 0.38) : c.plantShade

  fillColumn(grid, x, canopyBase + 1, trunkHeight, c.structureShade)
  for (let i = 0; i < size; i += 1) {
    const half = Math.max(1, Math.round((size - i) * 0.5))
    fillRow(grid, canopyBase - i, x - half, half * 2 + 1, i < 2 ? dark : light)
  }
  if (ctx.plan.timeOfDay === 'snow') setPixel(grid, x, canopyBase - size + 1, c.cloud)
  if (rand.chance(0.3)) blendPixel(grid, x, baseY, c.ink, 0.3)
}

function paintPalm(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, rand } = ctx
  const trunkHeight = Math.max(3, Math.round(anchor.size * 1.7))
  const trunk = anchor.color ?? c.structureShade
  const leaf = anchor.color ? mix(anchor.color, c.plant, 0.55) : c.plant
  const leafDark = mix(leaf, c.ink, 0.35)

  let x = anchor.x
  for (let i = 0; i < trunkHeight; i += 1) {
    const y = anchor.baseY - i
    setPixel(grid, x, y, trunk)
    setPixel(grid, x + 1, y, mix(trunk, c.ink, 0.25))
    if (i > 1 && i % 3 === 0) x += rand.chance(0.6) ? 1 : -1
  }

  const top = anchor.baseY - trunkHeight
  const reach = Math.max(2, Math.round(anchor.size * 0.8))
  for (const direction of [-1, 1]) {
    for (let i = 1; i <= reach; i += 1) {
      const y = top - Math.round(i * 0.4)
      setPixel(grid, x + direction * i, y, i % 2 === 0 ? leaf : leafDark)
      setPixel(grid, x + direction * i, y + 1, leafDark)
    }
  }
  setPixel(grid, x, top - 1, leaf)
  if (rand.chance(0.5)) setPixel(grid, x - 1, top, c.accent)
}

function paintCactus(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c } = ctx
  const color = anchor.color ?? c.plant
  const dark = mix(color, c.ink, 0.3)
  const height = Math.max(3, Math.round(anchor.size * 1.5))

  fillColumn(grid, anchor.x, anchor.baseY - height + 1, height, color)
  fillColumn(grid, anchor.x + 1, anchor.baseY - height + 1, height, dark)
  setPixel(grid, anchor.x, anchor.baseY - height, mix(color, c.celestial, 0.3))

  if (height >= 4) {
    const armHeight = Math.max(1, Math.round(height * 0.35))
    const armY = anchor.baseY - Math.round(height * 0.6)
    fillRow(grid, armY, anchor.x - 2, 2, color)
    fillColumn(grid, anchor.x - 2, armY - armHeight + 1, armHeight, color)
    if (height >= 6) {
      fillRow(grid, armY + 2, anchor.x + 2, 2, dark)
      fillColumn(grid, anchor.x + 3, armY + 1, armHeight, dark)
    }
  }
}

function paintRock(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c } = ctx
  const base = anchor.color ?? c.mid
  const dark = mix(base, c.ink, 0.38)
  const light = mix(base, c.celestial, 0.28)
  const width = Math.max(3, Math.round(anchor.size * 1.2))
  const height = Math.max(2, Math.round(anchor.size * 0.8))

  for (let i = 0; i < height; i += 1) {
    const t = (i + 1) / height
    const half = Math.max(1, Math.round((width / 2) * (1 - Math.pow(Math.abs(t - 0.7) * 1.7, 2))))
    const y = anchor.baseY - height + 1 + i
    fillRow(grid, y, anchor.x - half, half * 2, base)
    setPixel(grid, anchor.x - half, y, light)
    setPixel(grid, anchor.x + half - 1, y, dark)
  }
}

function paintFlower(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, rand } = ctx
  const count = rand.int(2, 4)
  for (let i = 0; i < count; i += 1) {
    const x = anchor.x + rand.int(-anchor.size, anchor.size)
    const y = anchor.baseY - rand.int(0, 1)
    const petal = anchor.color ?? (rand.chance(0.5) ? c.accent : c.cloud)
    setPixel(grid, x, y, mix(c.plant, c.ink, 0.3))
    setPixel(grid, x, y - 1, petal)
    if (rand.chance(0.4)) setPixel(grid, x + 1, y - 1, mix(petal, c.cloud, 0.35))
  }
}

function paintHouse(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, w, rand } = ctx
  const width = clampSpan(Math.max(4, anchor.size * 2.1), w * 0.34)
  const bodyHeight = Math.max(2, Math.round(width * 0.55))
  const roofHeight = Math.max(2, Math.round(width * 0.42))
  const left = Math.max(0, Math.min(w - width, anchor.x - Math.round(width / 2)))
  const wall = anchor.color ?? c.structure
  const wallShade = mix(wall, c.ink, 0.28)

  fillRect(grid, left, anchor.baseY - bodyHeight + 1, width, bodyHeight, wall)
  fillColumn(grid, left + width - 1, anchor.baseY - bodyHeight + 1, bodyHeight, wallShade)

  for (let i = 0; i < roofHeight; i += 1) {
    const half = Math.max(1, Math.round((width / 2) * (1 - i / roofHeight)))
    fillRow(grid, anchor.baseY - bodyHeight - i, anchor.x - half, half * 2, i === 0 ? c.roof : mix(c.roof, c.ink, 0.12))
  }

  // 门
  const doorWidth = Math.max(1, Math.round(width * 0.2))
  const doorHeight = Math.max(1, Math.round(bodyHeight * 0.62))
  fillRect(
    grid,
    anchor.x - Math.floor(doorWidth / 2),
    anchor.baseY - doorHeight + 1,
    doorWidth,
    doorHeight,
    c.structureShade
  )

  // 窗
  if (width >= 7) {
    const windowY = anchor.baseY - bodyHeight + Math.max(1, Math.round(bodyHeight * 0.3))
    setPixel(grid, left + 1, windowY, c.window)
    setPixel(grid, left + 2, windowY, c.window)
    setPixel(grid, left + width - 3, windowY, c.window)
    setPixel(grid, left + width - 2, windowY, c.window)
  } else if (width >= 5) {
    setPixel(grid, left + 1, anchor.baseY - bodyHeight + 1, c.window)
  }

  // 烟囱与炊烟
  const chimneyWidth = Math.max(1, Math.round(width * 0.15))
  const chimneyHeight = Math.max(2, Math.round(roofHeight * 0.8))
  const chimneyX = left + Math.round(width * 0.68)
  const chimneyBottom = anchor.baseY - bodyHeight - Math.round(roofHeight * 0.45)
  fillRect(grid, chimneyX, chimneyBottom - chimneyHeight, chimneyWidth, chimneyHeight, c.structureShade)
  if (rand.chance(0.75)) blendPixel(grid, chimneyX, chimneyBottom - chimneyHeight - 2, c.cloud, 0.5)
}

function paintCastle(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, w } = ctx
  const color = anchor.color ?? c.structure
  const width = clampSpan(Math.max(6, anchor.size * 2.6), w * 0.4)
  const wallHeight = Math.max(2, Math.round(width * 0.32))
  const towerWidth = Math.max(2, Math.round(width * 0.26))
  const towerHeight = Math.max(wallHeight + 1, Math.round(width * 0.55))
  const left = Math.max(0, Math.min(w - width, anchor.x - Math.round(width / 2)))
  const baseY = anchor.baseY

  fillRect(grid, left, baseY - wallHeight + 1, width, wallHeight, color)
  for (let x = left; x < left + width; x += 2) setPixel(grid, x, baseY - wallHeight, mix(color, c.ink, 0.35))

  for (const towerX of [left, left + width - towerWidth]) {
    fillRect(grid, towerX, baseY - towerHeight + 1, towerWidth, towerHeight, mix(color, c.ink, 0.14))
    fillRow(grid, baseY - towerHeight, towerX, towerWidth, mix(color, c.ink, 0.38))
    setPixel(grid, towerX + Math.floor(towerWidth / 2), baseY - towerHeight + 1, c.window)
    setPixel(grid, towerX + Math.floor(towerWidth / 2), baseY - towerHeight - 1, c.roof)
  }

  const gateWidth = Math.max(1, Math.round(width * 0.16))
  const gateHeight = Math.max(1, Math.round(wallHeight * 0.7))
  fillRect(grid, anchor.x - Math.floor(gateWidth / 2), baseY - gateHeight + 1, gateWidth, gateHeight, c.structureShade)
}

function paintLighthouse(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, w, h, rand } = ctx
  const height = clampSpan(Math.max(4, anchor.size * 2.6), h * 0.52)
  const baseWidth = clampSpan(Math.max(3, anchor.size * 1.1), w * 0.13)
  const light = anchor.color ?? hexToRgb('#f4f6f8')
  const top = anchor.baseY - height + 1

  for (let i = 0; i < height; i += 1) {
    const t = i / Math.max(1, height - 1)
    const half = Math.max(1, Math.round((baseWidth / 2) * (1 - t * 0.45)))
    fillRow(grid, anchor.baseY - i, anchor.x - half, half * 2, Math.floor(i / 2) % 2 === 0 ? light : c.roof)
  }

  // 灯室与光束
  fillRow(grid, top, anchor.x - 2, 5, c.ink)
  setPixel(grid, anchor.x, top - 1, c.window)
  // 光束：与天色混一档，白天是淡淡的光晕，夜里才显眼
  const beam = mix(c.glow, c.skyBottom, 0.4)
  const beamLength = 1 + rand.int(0, 2)
  fillRow(grid, top - 1, anchor.x - 2 - beamLength, beamLength, beam)
  fillRow(grid, top - 1, anchor.x + 3, beamLength, beam)
}

function paintWindmill(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, h } = ctx
  const color = anchor.color ?? c.structure
  const height = clampSpan(Math.max(4, anchor.size * 2.1), h * 0.46)
  const baseWidth = clampSpan(Math.max(2, anchor.size * 0.9), ctx.w * 0.12)

  for (let i = 0; i < height; i += 1) {
    const t = i / Math.max(1, height - 1)
    const half = Math.max(1, Math.round((baseWidth / 2) * (1 - t * 0.35)))
    fillRow(grid, anchor.baseY - i, anchor.x - half, half * 2, i === height - 1 ? mix(color, c.ink, 0.35) : color)
  }

  const hubX = anchor.x
  const hubY = anchor.baseY - height
  const blade = Math.max(2, Math.round(anchor.size * 0.9))
  const bladeColor = c.cloud
  drawLine(grid, hubX - blade, hubY - blade, hubX + blade, hubY + blade, bladeColor)
  drawLine(grid, hubX - blade, hubY + blade, hubX + blade, hubY - blade, bladeColor)
  setPixel(grid, hubX, hubY, c.structureShade)
}

function paintTent(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c } = ctx
  const color = anchor.color ?? c.accent
  const height = clampSpan(Math.max(3, anchor.size * 1.4), ctx.h * 0.34)
  const half = clampSpan(Math.max(2, anchor.size * 1.1), ctx.w * 0.1)

  for (let i = 0; i < height; i += 1) {
    const t = i / Math.max(1, height - 1)
    const rowHalf = Math.max(1, Math.round(half * t))
    fillRow(grid, anchor.baseY - i, anchor.x - rowHalf, rowHalf * 2, i === 0 ? mix(color, c.ink, 0.3) : color)
  }
  fillRow(grid, anchor.baseY, anchor.x - Math.floor(half * 0.35), Math.max(1, Math.round(half * 0.7)), c.ink)
  setPixel(grid, anchor.x, anchor.baseY - height, c.structureShade)
}

function paintCampfire(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, rand } = ctx
  fillRow(grid, anchor.baseY, anchor.x - 2, 5, c.structureShade)

  const flameHeight = rand.int(2, 3)
  for (let i = 0; i < flameHeight; i += 1) {
    const half = Math.max(0, 1 - Math.floor(i / 2))
    fillRow(
      grid,
      anchor.baseY - 1 - i,
      anchor.x - half,
      half * 2 + 1,
      i === flameHeight - 1 ? mix(c.glow, c.cloud, 0.45) : c.accent
    )
  }
  blendPixel(grid, anchor.x, anchor.baseY - 1, c.glow, 0.35)
}

function paintBoat(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, w, rand } = ctx
  const hull = anchor.color ?? c.structureShade
  const width = clampSpan(Math.max(3, anchor.size * 1.4), w * 0.16)
  const y = anchor.baseY

  fillRow(grid, y, anchor.x - width, width * 2, hull)
  fillRow(grid, y + 1, anchor.x - Math.floor(width * 0.6), Math.round(width * 1.2), mix(hull, c.ink, 0.3))

  // 帆布固定偏白，否则在夜/暴雨主题下会和海面糊在一起
  const sail = mix(c.cloud, [255, 255, 255], 0.55)
  const sailShade = mix(sail, c.ink, 0.22)
  const mastHeight = Math.max(2, Math.round(anchor.size * 1.6))
  fillColumn(grid, anchor.x, y - mastHeight, mastHeight, mix(c.structureShade, c.ink, 0.4))
  for (let i = 0; i < mastHeight - 1; i += 1) {
    const sailWidth = Math.max(1, Math.round((mastHeight - i) * 0.45))
    fillRow(grid, y - 1 - i, anchor.x + 1, sailWidth, i % 2 === 0 ? sail : sailShade)
  }
  if (rand.chance(0.5)) blendPixel(grid, anchor.x, y + 2, c.foam, 0.3)
}

/* --------------------------- 室内与近景物件 --------------------------- */

/* 家具的关键尺寸：画笔与「把小物件放到家具面上」共用同一套算式，避免两处对不齐 */

function sofaMetrics(ctx: SceneContext, size: number) {
  const width = clampSpan(Math.max(5, size * 2.6), ctx.w * 0.44)
  return {
    width,
    seatHeight: Math.max(1, Math.round(width * 0.18)),
    backHeight: Math.max(1, Math.round(width * 0.26)),
    armWidth: Math.max(1, Math.round(width * 0.12)),
  }
}

function tableMetrics(ctx: SceneContext, size: number) {
  const width = clampSpan(Math.max(4, size * 2.2), ctx.w * 0.36)
  return { width, height: clampSpan(Math.max(2, width * 0.45), ctx.h * 0.3) }
}

function chairMetrics(ctx: SceneContext, size: number) {
  const width = clampSpan(Math.max(3, size * 1.4), ctx.w * 0.24)
  return { width, seatHeight: Math.max(1, Math.round(width * 0.35)) }
}

function paintCat(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, w, rand } = ctx
  const fur = anchor.color ?? mix(c.structureShade, c.ink, 0.28)
  const furLight = mix(fur, c.cloud, 0.16)
  const width = clampSpan(Math.max(3, anchor.size * 1.1), w * 0.14)
  const bodyHeight = Math.max(2, Math.round(width * 0.5))
  const half = Math.floor(width / 2)

  // 蜷成一团：上窄下宽
  for (let i = 0; i < bodyHeight; i += 1) {
    const t = i / Math.max(1, bodyHeight - 1)
    const rowHalf = Math.max(1, Math.round(half * (0.6 + 0.4 * t)))
    fillRow(
      grid,
      anchor.baseY - i,
      anchor.x - rowHalf,
      rowHalf * 2 + 1,
      i >= bodyHeight - 2 ? furLight : fur
    )
  }

  // 头与两只耳朵
  const headY = anchor.baseY - bodyHeight
  const headX = anchor.x - half
  fillRow(grid, headY, headX, 3, fur)
  setPixel(grid, headX, headY - 1, fur)
  setPixel(grid, headX + 2, headY - 1, fur)
  // 眼睛：够宽才点，太小的尺寸上会糊成一团
  if (width >= 6) setPixel(grid, headX + 1, headY, mix(c.glow, c.cloud, 0.25))

  // 尾巴从身后翘起
  const tailX = anchor.x + half + 1
  setPixel(grid, tailX, anchor.baseY - 1, fur)
  setPixel(grid, tailX + 1, anchor.baseY - 2, fur)
  if (rand.chance(0.4)) setPixel(grid, tailX + 1, anchor.baseY - 1, furLight)
}

function paintSofa(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, w } = ctx
  const fabric = anchor.color ?? mix(c.accent, c.ink, 0.34)
  // 16 色量化会把相近的色阶合并，坐垫与靠背要拉开一档才看得出结构
  const cushion = mix(fabric, c.cloud, 0.38)
  const shade = mix(fabric, c.ink, 0.44)
  const { width, seatHeight, backHeight, armWidth } = sofaMetrics(ctx, anchor.size)
  const left = Math.max(0, Math.min(w - width, anchor.x - Math.floor(width / 2)))
  const seatTop = anchor.baseY - seatHeight + 1

  // 靠背贴在坐垫上方
  fillRect(grid, left, seatTop - backHeight, width, backHeight, shade)
  fillRow(grid, seatTop - backHeight, left, width, mix(shade, c.cloud, 0.16))
  // 坐垫分两段，比底座亮一档
  fillRect(grid, left, seatTop, width, seatHeight, fabric)
  const innerLeft = left + armWidth
  const innerWidth = Math.max(1, width - armWidth * 2)
  const cushionWidth = Math.max(1, Math.floor(innerWidth / 2))
  const cushionRows = Math.max(1, seatHeight - 1)
  fillRect(grid, innerLeft, seatTop, cushionWidth, cushionRows, cushion)
  fillRect(
    grid,
    innerLeft + cushionWidth,
    seatTop,
    Math.max(1, innerWidth - cushionWidth),
    cushionRows,
    mix(cushion, fabric, 0.4)
  )
  // 两侧扶手：比靠背亮，才看得出「两臂夹着靠背与坐垫」的结构
  const arm = mix(fabric, c.cloud, 0.2)
  fillColumn(grid, left, seatTop, seatHeight, arm)
  fillColumn(grid, left + width - 1, seatTop, seatHeight, arm)
}

function paintTable(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, w } = ctx
  const top = anchor.color ?? c.structure
  const shade = mix(top, c.ink, 0.34)
  const { width, height } = tableMetrics(ctx, anchor.size)
  const left = Math.max(0, Math.min(w - width, anchor.x - Math.floor(width / 2)))
  const topRow = anchor.baseY - height + 1

  // 桌面（上亮下暗，做出厚度）
  fillRow(grid, topRow, left, width, mix(top, c.cloud, 0.12))
  const bodyTop = topRow + 1
  if (height >= 3) fillRow(grid, bodyTop, left, width, shade)
  // 两条腿
  const legTop = Math.min(anchor.baseY, bodyTop + 1)
  fillColumn(grid, left + 1, legTop, anchor.baseY - legTop + 1, shade)
  fillColumn(grid, left + width - 2, legTop, anchor.baseY - legTop + 1, shade)
}

function paintChair(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, w } = ctx
  const wood = anchor.color ?? c.structureShade
  const light = mix(wood, c.cloud, 0.18)
  const { width, seatHeight } = chairMetrics(ctx, anchor.size)
  const left = Math.max(0, Math.min(w - width, anchor.x - Math.floor(width / 2)))
  const seatY = Math.max(1, anchor.baseY - seatHeight)
  const backHeight = Math.max(2, Math.round(width * 0.9))

  // 椅背：两根立柱加一道横档
  fillColumn(grid, left, seatY - backHeight, backHeight, wood)
  fillColumn(grid, left + width - 1, seatY - backHeight, backHeight, mix(wood, c.ink, 0.22))
  fillRow(grid, seatY - backHeight, left, width, light)
  // 座面
  fillRow(grid, seatY, left, width, light)
  // 椅腿
  fillColumn(grid, left + 1, seatY + 1, anchor.baseY - seatY, wood)
  fillColumn(grid, left + width - 2, seatY + 1, anchor.baseY - seatY, wood)
}

function paintRug(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, w } = ctx
  const base = anchor.color ?? mix(c.accent, c.ink, 0.45)
  const width = clampSpan(Math.max(6, anchor.size * 3.4), w * 0.6)
  const rows = Math.max(1, Math.min(3, Math.round(anchor.size * 0.4)))

  // 平铺在地上：只占贴近地面的几行
  for (let i = 0; i < rows; i += 1) {
    const inset = Math.round(i * width * 0.08)
    fillRow(
      grid,
      anchor.baseY - i,
      anchor.x - Math.floor(width / 2) + inset,
      width - inset * 2,
      i % 2 === 0 ? base : mix(base, c.cloud, 0.16)
    )
  }
}

function paintLamp(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c } = ctx
  const pole = anchor.color ?? c.structureShade
  const shade = anchor.color ? mix(anchor.color, c.cloud, 0.2) : mix(c.glow, c.cloud, 0.4)
  const height = Math.max(4, Math.round(anchor.size * 2.2))
  const top = anchor.baseY - height + 1
  const shadeWidth = Math.max(2, Math.round(anchor.size * 1.1))
  const half = Math.floor(shadeWidth / 2)

  // 底座与灯杆
  fillRow(grid, anchor.baseY, anchor.x - 1, 3, pole)
  fillColumn(grid, anchor.x, top + 2, Math.max(1, anchor.baseY - top - 1), pole)
  // 灯罩：上窄下宽
  fillRow(grid, top, anchor.x - Math.max(0, half - 1), Math.max(1, shadeWidth - 2), shade)
  fillRow(grid, top + 1, anchor.x - half, shadeWidth, shade)
  // 灯下的光晕
  blendPixel(grid, anchor.x, top + 2, c.glow, 0.4)
  blendPixel(grid, anchor.x - 1, top + 2, c.glow, 0.2)
  blendPixel(grid, anchor.x + 1, top + 2, c.glow, 0.2)
}

function paintWindow(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c, w } = ctx
  const frame = anchor.color ?? c.structureShade
  const glass = mix(c.skyBottom, c.cloud, 0.3)
  const width = clampSpan(Math.max(3, anchor.size * 1.5), w * 0.28)
  const height = Math.max(2, Math.round(width * 0.95))
  const left = Math.max(0, Math.min(w - width, anchor.x - Math.floor(width / 2)))
  const top = anchor.baseY - height + 1

  fillRect(grid, left, top, width, height, glass)
  // 窗框
  fillRow(grid, top, left, width, frame)
  fillRow(grid, anchor.baseY, left, width, frame)
  fillColumn(grid, left, top, height, frame)
  fillColumn(grid, left + width - 1, top, height, frame)
  // 十字窗棂：太小就不画，免得糊成一格
  if (width >= 5 && height >= 4) {
    fillColumn(grid, left + Math.floor(width / 2), top + 1, height - 2, frame)
    fillRow(grid, top + Math.floor(height / 2), left + 1, width - 2, frame)
  }
  blendPixel(grid, left - 1, anchor.baseY, c.glow, 0.18)
}

function paintPerson(ctx: SceneContext, _object: SceneObject, anchor: Anchor): void {
  const { grid, c } = ctx
  const coat = anchor.color ?? mix(c.ink, c.structure, 0.3)
  const skin = mix(coat, c.cloud, 0.34)
  const pants = mix(coat, c.ink, 0.38)
  const height = clampSpan(Math.max(4, anchor.size * 1.7), ctx.h * 0.4)
  const headTop = anchor.baseY - height + 1
  const legHeight = Math.max(1, Math.round(height * 0.26))
  const legTop = anchor.baseY - legHeight + 1
  const left = anchor.x - 1

  // 头与躯干
  fillRect(grid, left, headTop, 2, 2, skin)
  const torsoTop = headTop + 2
  const torsoHeight = Math.max(1, legTop - torsoTop)
  fillRect(grid, left, torsoTop, 2, torsoHeight, coat)
  // 手臂
  const armY = torsoTop + Math.floor(torsoHeight / 2)
  setPixel(grid, left - 1, armY, coat)
  setPixel(grid, left + 2, armY, coat)
  // 双腿
  fillColumn(grid, left, legTop, legHeight, pants)
  fillColumn(grid, left + 1, legTop, legHeight, pants)
  blendPixel(grid, anchor.x, anchor.baseY + 1, c.ink, 0.22)
}

/* -------------------------------- 天气 -------------------------------- */

function drawWeather(ctx: SceneContext): void {
  const { grid, c, w, h, horizon, rand, plan } = ctx
  const kinds = new Set(plan.objects.map((object) => object.kind))
  const storm = plan.timeOfDay === 'storm'
  const rain = kinds.has('rain') || storm
  const snow = kinds.has('snow') || plan.timeOfDay === 'snow'
  const fog = kinds.has('fog')

  if (fog) {
    for (let y = Math.round(horizon * 0.5); y < h; y += 1) {
      for (let x = 0; x < w; x += 1) blendPixel(grid, x, y, c.cloud, 0.12)
    }
  }

  if (rain) {
    // 雨丝：数量多、颜色暗、以单像素为主，才不会看成雪花
    const drops = Math.max(10, Math.round((w * h) / (storm ? 22 : 40)))
    const drop = mix(c.cloud, c.skyTop, 0.34)
    for (let i = 0; i < drops; i += 1) {
      const x = rand.int(0, w - 1)
      const y = rand.int(0, h - 2)
      setPixel(grid, x, y, drop)
      if (rand.chance(0.35)) setPixel(grid, Math.min(w - 1, x + 1), y + 1, mix(drop, c.skyTop, 0.4))
    }
  }

  if (snow) {
    const flakes = Math.max(6, Math.round((w * h) / 30))
    for (let i = 0; i < flakes; i += 1) {
      setPixel(grid, rand.int(0, w - 1), rand.int(0, h - 1), c.cloud)
    }
  }
}

/** 供调试/测试使用：统计规划里实际会用到的绘制层 */
export function layerNames(plan: ScenePlan): SceneObjectKind[] {
  return [...new Set(plan.objects.map((object) => object.kind))]
}
