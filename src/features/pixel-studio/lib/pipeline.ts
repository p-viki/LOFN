/**
 * 两条渲染管线的入口：都产出同一种「像素画」结构。
 *
 *   参考图   → downsample   → 限色   （保真像素化）
 *   画面规划 → composeScene → 限色   （AI 绘制）
 *
 * 中间产物统一是真彩网格，因此抖动、描边、调色板只实现一次。
 */

import type { PixelGrid, RenderOptions, RgbGrid, ScenePlan } from '../types'
import { hexToRgb, luminance, mix, rgbToHex } from './color'
import type { Rgb } from './color'
import { composeScene } from './composer'
import { paletteColors } from './palettes'
import { downsample, extractPalette, quantize } from './quantize'

/** 自动提取调色板时的色数：16 色是像素画最通用的档位 */
const AUTO_PALETTE_SIZE = 16

/** 描边能看清的前提：调色板里得有一个足够深的颜色 */
const INK_LUMINANCE_LIMIT = 70
const INK_DARKEN = 0.72

/** 参考图 → 像素画 */
export function pixelizeImage(image: ImageData, options: RenderOptions): PixelGrid {
  return toPixelArt(downsample(image, options.cols), options)
}

/** 画面规划 → 像素画 */
export function renderPlan(plan: ScenePlan, options: RenderOptions): PixelGrid {
  return toPixelArt(composeScene(plan, options.cols), options)
}

function toPixelArt(grid: RgbGrid, options: RenderOptions): PixelGrid {
  const fixed = paletteColors(options.paletteId)
  let palette = fixed ?? extractPalette(grid, AUTO_PALETTE_SIZE)
  if (options.outline) palette = withInk(palette)

  return quantize(grid, palette, { dither: options.dither, outline: options.outline })
}

/**
 * 描边要用「最深的颜色」勾轮廓，而自动提取的调色板可能整体偏亮，
 * 此时轮廓会发白。这里在最深色基础上压暗一档，保证轮廓始终是深色。
 */
function withInk(palette: readonly string[]): string[] {
  if (palette.length === 0) return [...palette]

  let darkest: Rgb = hexToRgb(palette[0])
  for (const hex of palette) {
    const color = hexToRgb(hex)
    if (luminance(color) < luminance(darkest)) darkest = color
  }

  if (luminance(darkest) <= INK_LUMINANCE_LIMIT) return [...palette]
  return [...palette, rgbToHex(mix(darkest, [0, 0, 0], INK_DARKEN))]
}
