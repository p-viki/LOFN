/** 真彩网格的绘制原语：两条渲染路径（参考图降采样、程序化合成）共用 */

import type { RgbGrid } from '../types'
import { mix } from './color'
import type { Rgb } from './color'

export function createRgbGrid(width: number, height: number, fill: Rgb): RgbGrid {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4
    data[offset] = fill[0]
    data[offset + 1] = fill[1]
    data[offset + 2] = fill[2]
    data[offset + 3] = 255
  }
  return { width, height, data }
}

export function setPixel(grid: RgbGrid, x: number, y: number, color: Rgb): void {
  const px = Math.round(x)
  const py = Math.round(y)
  if (px < 0 || py < 0 || px >= grid.width || py >= grid.height) return
  const offset = (py * grid.width + px) * 4
  grid.data[offset] = color[0]
  grid.data[offset + 1] = color[1]
  grid.data[offset + 2] = color[2]
}

/** 按 alpha 叠加，用于柔光、倒影、噪点等半透明笔触 */
export function blendPixel(grid: RgbGrid, x: number, y: number, color: Rgb, alpha: number): void {
  const px = Math.round(x)
  const py = Math.round(y)
  if (px < 0 || py < 0 || px >= grid.width || py >= grid.height) return
  const offset = (py * grid.width + px) * 4
  const base: Rgb = [grid.data[offset], grid.data[offset + 1], grid.data[offset + 2]]
  const result = mix(base, color, alpha)
  grid.data[offset] = result[0]
  grid.data[offset + 1] = result[1]
  grid.data[offset + 2] = result[2]
}

export function getPixel(grid: RgbGrid, x: number, y: number): Rgb {
  const px = Math.max(0, Math.min(grid.width - 1, Math.round(x)))
  const py = Math.max(0, Math.min(grid.height - 1, Math.round(y)))
  const offset = (py * grid.width + px) * 4
  return [grid.data[offset], grid.data[offset + 1], grid.data[offset + 2]]
}

export function fillRow(grid: RgbGrid, y: number, x: number, width: number, color: Rgb): void {
  const py = Math.round(y)
  if (py < 0 || py >= grid.height) return
  const startX = Math.max(0, Math.round(x))
  const endX = Math.min(grid.width, Math.round(x + width))
  for (let px = startX; px < endX; px += 1) {
    const offset = (py * grid.width + px) * 4
    grid.data[offset] = color[0]
    grid.data[offset + 1] = color[1]
    grid.data[offset + 2] = color[2]
  }
}

export function fillColumn(grid: RgbGrid, x: number, y: number, height: number, color: Rgb): void {
  const px = Math.round(x)
  if (px < 0 || px >= grid.width) return
  const startY = Math.max(0, Math.round(y))
  const endY = Math.min(grid.height, Math.round(y + height))
  for (let py = startY; py < endY; py += 1) {
    const offset = (py * grid.width + px) * 4
    grid.data[offset] = color[0]
    grid.data[offset + 1] = color[1]
    grid.data[offset + 2] = color[2]
  }
}

export function fillRect(
  grid: RgbGrid,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Rgb
): void {
  for (let py = 0; py < height; py += 1) {
    fillRow(grid, y + py, x, width, color)
  }
}

export function fillCircle(
  grid: RgbGrid,
  cx: number,
  cy: number,
  radius: number,
  color: Rgb,
  alpha = 1
): void {
  const r = Math.max(0, radius)
  const top = Math.round(cy - r)
  const bottom = Math.round(cy + r)
  for (let y = top; y <= bottom; y += 1) {
    const dy = y - cy
    const span = Math.sqrt(Math.max(0, r * r - dy * dy))
    const startX = Math.round(cx - span)
    const width = Math.round(cx + span) - startX + 1
    if (alpha >= 1) {
      fillRow(grid, y, startX, width, color)
    } else {
      for (let x = startX; x < startX + width; x += 1) {
        blendPixel(grid, x, y, color, alpha)
      }
    }
  }
}

/** 椭圆：按行扫描，逐行求出该行的宽度（宽高相等时即圆） */
export function fillEllipse(
  grid: RgbGrid,
  left: number,
  top: number,
  width: number,
  height: number,
  color: Rgb,
  alpha = 1
): void {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  const cx = left + (w - 1) / 2
  const cy = top + (h - 1) / 2

  for (let i = 0; i < h; i += 1) {
    const dy = (top + i - cy) / (h / 2)
    const span = Math.sqrt(Math.max(0, 1 - dy * dy))
    const rowWidth = Math.max(1, Math.round(w * span))
    const rowX = Math.round(cx - (rowWidth - 1) / 2)
    if (alpha >= 1) {
      fillRow(grid, top + i, rowX, rowWidth, color)
    } else {
      for (let x = rowX; x < rowX + rowWidth; x += 1) blendPixel(grid, x, top + i, color, alpha)
    }
  }
}

/** 多边形描边：填充不到一个像素的窄形（如细长尾巴、天线）靠它保住可见性 */
export function strokePolygon(
  grid: RgbGrid,
  points: readonly (readonly [number, number])[],
  color: Rgb,
  alpha = 1
): void {
  for (let i = 0; i < points.length; i += 1) {
    const from = points[i]
    const to = points[(i + 1) % points.length]
    if (alpha >= 1) {
      drawLine(grid, from[0], from[1], to[0], to[1], color)
      continue
    }
    // 半透明描边按步进采样，避免 drawLine 只支持实心色
    const steps = Math.max(1, Math.round(Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]))))
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps
      blendPixel(grid, from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, color, alpha)
    }
  }
}

/**
 * 多边形填充：逐行扫描 + 奇偶规则，因此凹形（轮拱、月牙）也能正确挖空。
 * 顶点为像素坐标（可含小数），顺序不限。
 */
export function fillPolygon(
  grid: RgbGrid,
  points: readonly (readonly [number, number])[],
  color: Rgb,
  alpha = 1
): void {
  if (points.length < 3) return

  let minY = Infinity
  let maxY = -Infinity
  for (const [, y] of points) {
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }

  const startY = Math.max(0, Math.floor(minY))
  const endY = Math.min(grid.height - 1, Math.ceil(maxY))
  let painted = 0

  for (let y = startY; y <= endY; y += 1) {
    // 取像素行中心作采样线，避免顶点正好落在整数坐标时重复计数
    const scanY = y + 0.5
    const crossings: number[] = []

    for (let i = 0; i < points.length; i += 1) {
      const from = points[i]
      const to = points[(i + 1) % points.length]
      const [ax, ay] = from
      const [bx, by] = to
      // 半开区间 [ay, by)：保证顶点处只与一条边相交
      if ((ay <= scanY && by > scanY) || (by <= scanY && ay > scanY)) {
        crossings.push(ax + ((scanY - ay) / (by - ay)) * (bx - ax))
      }
    }

    if (crossings.length < 2) continue
    crossings.sort((a, b) => a - b)

    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const from = Math.round(crossings[i])
      const to = Math.round(crossings[i + 1]) - 1
      if (to < from) {
        // 该行只切到不足一个像素，落单点保证细形不消失
        blendPixel(grid, crossings[i], y, color, alpha)
        painted += 1
        continue
      }
      if (alpha >= 1) {
        fillRow(grid, y, from, to - from + 1, color)
      } else {
        for (let x = from; x <= to; x += 1) blendPixel(grid, x, y, color, alpha)
      }
      painted += 1
    }
  }

  // 整体高度不足一个像素，或恰好卡在行边界上：退化为描边，保证看得见
  if (painted === 0) strokePolygon(grid, points, color, alpha)
}

/** Bresenham 直线（单像素宽），用于枝干、光束、扇叶等 */
export function drawLine(
  grid: RgbGrid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: Rgb
): void {
  let startX = Math.round(x0)
  let startY = Math.round(y0)
  const endX = Math.round(x1)
  const endY = Math.round(y1)
  const dx = Math.abs(endX - startX)
  const dy = -Math.abs(endY - startY)
  const stepX = startX < endX ? 1 : -1
  const stepY = startY < endY ? 1 : -1
  let error = dx + dy

  for (;;) {
    setPixel(grid, startX, startY, color)
    if (startX === endX && startY === endY) break
    const doubled = 2 * error
    if (doubled >= dy) {
      error += dy
      startX += stepX
    }
    if (doubled <= dx) {
      error += dx
      startY += stepY
    }
  }
}
