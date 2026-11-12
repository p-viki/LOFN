/**
 * 限色管线：真彩网格 → 像素画。
 *
 * 三个步骤，两条渲染路径共用：
 *   1. downsample  参考图按面积平均降采样（透明区域按白底合成）
 *   2. extractPalette 从画面自身提取主色（中位切分）
 *   3. quantize    按调色板限色，可选抖动与描边
 */

import type { DitherMode, PixelGrid, RgbGrid } from '../types'
import { hexToRgb, luminance, medianCut, nearestIndex, rgbToHex } from './color'
import type { Rgb } from './color'
import { createRgbGrid, setPixel } from './raster'

/** 4×4 有序抖动矩阵，可稳定地把渐变打成棋盘格，是像素画的经典手法 */
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

/** 降采样：把任意尺寸的图片压到「最长边 = maxSide」的网格上 */
export function downsample(image: ImageData, maxSide: number): RgbGrid {
  const target = Math.max(8, Math.round(maxSide))
  const scale = target / Math.max(image.width, image.height)
  const width = Math.max(8, Math.round(image.width * scale))
  const height = Math.max(8, Math.round(image.height * scale))
  const grid = createRgbGrid(width, height, [255, 255, 255])
  const { data } = image

  for (let y = 0; y < height; y += 1) {
    const sourceY0 = Math.floor((y * image.height) / height)
    const sourceY1 = Math.max(sourceY0 + 1, Math.floor(((y + 1) * image.height) / height))
    for (let x = 0; x < width; x += 1) {
      const sourceX0 = Math.floor((x * image.width) / width)
      const sourceX1 = Math.max(sourceX0 + 1, Math.floor(((x + 1) * image.width) / width))

      let r = 0
      let g = 0
      let b = 0
      let count = 0
      for (let sy = sourceY0; sy < sourceY1; sy += 1) {
        for (let sx = sourceX0; sx < sourceX1; sx += 1) {
          const offset = (sy * image.width + sx) * 4
          const alpha = data[offset + 3] / 255
          // 透明像素按白色合成，避免出现黑边或透明洞
          r += data[offset] * alpha + 255 * (1 - alpha)
          g += data[offset + 1] * alpha + 255 * (1 - alpha)
          b += data[offset + 2] * alpha + 255 * (1 - alpha)
          count += 1
        }
      }

      if (count > 0) setPixel(grid, x, y, [r / count, g / count, b / count])
    }
  }

  return grid
}

/** 从画面自身的颜色分布中提取 count 种主色 */
export function extractPalette(grid: RgbGrid, count: number): string[] {
  const total = grid.width * grid.height
  const samples: Rgb[] = []
  // 大图按步长抽样，既够用又避免无谓开销
  const step = Math.max(1, Math.floor(total / 4096))
  for (let i = 0; i < total; i += step) {
    const offset = i * 4
    samples.push([grid.data[offset], grid.data[offset + 1], grid.data[offset + 2]])
  }
  const limit = Math.max(2, Math.min(count, 32))
  return medianCut(samples, limit).map(rgbToHex)
}

/** 限色（可含抖动与描边）：真彩网格 → 像素画 */
export function quantize(
  grid: RgbGrid,
  paletteHex: readonly string[],
  options: { dither: DitherMode; outline: boolean }
): PixelGrid {
  const palette: Rgb[] = paletteHex.length > 0 ? paletteHex.map(hexToRgb) : [[0, 0, 0]]
  const { width, height, data } = grid
  const indices = new Uint8Array(width * height)

  if (options.dither === 'floyd') {
    // 误差扩散：连渐变照片也能压出有层次的像素画
    const buffer = new Float32Array(width * height * 3)
    for (let i = 0; i < width * height; i += 1) {
      buffer[i * 3] = data[i * 4]
      buffer[i * 3 + 1] = data[i * 4 + 1]
      buffer[i * 3 + 2] = data[i * 4 + 2]
    }

    const diffuse = (x: number, y: number, r: number, g: number, b: number, factor: number): void => {
      if (x < 0 || y < 0 || x >= width || y >= height) return
      const offset = (y * width + x) * 3
      buffer[offset] += r * factor
      buffer[offset + 1] += g * factor
      buffer[offset + 2] += b * factor
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x
        const offset = index * 3
        const color: Rgb = [buffer[offset], buffer[offset + 1], buffer[offset + 2]]
        const paletteIndex = nearestIndex(color, palette)
        indices[index] = paletteIndex
        const target = palette[paletteIndex]
        const errR = color[0] - target[0]
        const errG = color[1] - target[1]
        const errB = color[2] - target[2]
        diffuse(x + 1, y, errR, errG, errB, 7 / 16)
        diffuse(x - 1, y + 1, errR, errG, errB, 3 / 16)
        diffuse(x, y + 1, errR, errG, errB, 5 / 16)
        diffuse(x + 1, y + 1, errR, errG, errB, 1 / 16)
      }
    }
  } else {
    const amplitude =
      options.dither === 'bayer' ? Math.min(48, 255 / Math.max(4, palette.length)) : 0
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x
        const offset = index * 4
        let color: Rgb = [data[offset], data[offset + 1], data[offset + 2]]
        if (amplitude > 0) {
          const threshold = (BAYER_4[y % 4][x % 4] / 16 - 0.5) * amplitude
          color = [color[0] + threshold, color[1] + threshold, color[2] + threshold]
        }
        indices[index] = nearestIndex(color, palette)
      }
    }
  }

  if (options.outline) applyOutline(indices, width, height, palette)

  return { width, height, palette: palette.map(rgbToHex), indices }
}

/** 描边判定的亮度差阈值：低于该值视为同一色块（抖动产生的相邻色差不描边） */
const OUTLINE_LUMINANCE_GAP = 40

/** 描边：用调色板中最深的颜色勾出区域轮廓，强化像素画的「块面感」 */
function applyOutline(
  indices: Uint8Array,
  width: number,
  height: number,
  palette: readonly Rgb[]
): void {
  const source = indices.slice()
  const brightness = palette.map(luminance)
  let inkIndex = 0
  let darkest = Number.POSITIVE_INFINITY
  for (let i = 0; i < palette.length; i += 1) {
    if (brightness[i] < darkest) {
      darkest = brightness[i]
      inkIndex = i
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      const current = source[index]
      if (current === inkIndex) continue

      const value = brightness[current]
      const neighbors = [
        x > 0 ? source[index - 1] : current,
        x < width - 1 ? source[index + 1] : current,
        y > 0 ? source[index - width] : current,
        y < height - 1 ? source[index + width] : current,
      ]

      const isEdge = neighbors.some(
        (neighbor) =>
          neighbor !== current &&
          Math.abs(brightness[neighbor] - value) > OUTLINE_LUMINANCE_GAP
      )
      if (isEdge) indices[index] = inkIndex
    }
  }
}
