/**
 * 颜色工具：像素画只关心「限色」，因此这里提供
 * 十六进制互转、混合、亮度、最近色查找与中位切分取色。
 */

export type Rgb = readonly [number, number, number]

export function hexToRgb(hex: string): Rgb {
  let value = hex.trim().replace(/^#/, '')
  if (value.length === 3) {
    value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2]
  }
  if (value.length !== 6) return [0, 0, 0]
  const num = Number.parseInt(value, 16)
  if (Number.isNaN(num)) return [0, 0, 0]
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export function rgbToHex(color: Rgb): string {
  const toHex = (value: number): string => {
    const clamped = Math.max(0, Math.min(255, Math.round(value)))
    return clamped.toString(16).padStart(2, '0')
  }
  return `#${toHex(color[0])}${toHex(color[1])}${toHex(color[2])}`
}

/** 判断是否为合法的十六进制颜色（含 #rrggbb / #rgb / 无 # 写法） */
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
}

export function luminance(color: Rgb): number {
  return 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]
}

/** 线性混合，t 会被截断到 [0, 1] */
export function mix(from: Rgb, to: Rgb, t: number): Rgb {
  const k = t < 0 ? 0 : t > 1 ? 1 : t
  return [
    from[0] + (to[0] - from[0]) * k,
    from[1] + (to[1] - from[1]) * k,
    from[2] + (to[2] - from[2]) * k,
  ]
}

/** 用 alpha 把前景色叠到背景色上 */
export function blend(base: Rgb, over: Rgb, alpha: number): Rgb {
  return mix(base, over, alpha)
}

/** 调色板中距离最近的颜色下标（按人眼感知加权） */
export function nearestIndex(color: Rgb, palette: readonly Rgb[]): number {
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  for (let i = 0; i < palette.length; i += 1) {
    const candidate = palette[i]
    const dr = color[0] - candidate[0]
    const dg = color[1] - candidate[1]
    const db = color[2] - candidate[2]
    const distance = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  }
  return best
}

function averageColor(colors: readonly Rgb[]): Rgb {
  let r = 0
  let g = 0
  let b = 0
  for (const color of colors) {
    r += color[0]
    g += color[1]
    b += color[2]
  }
  return [r / colors.length, g / colors.length, b / colors.length]
}

/**
 * 中位切分取色：不断挑选「颜色跨度最大」的色桶沿最长通道对半切，
 * 直到得到 count 个色桶，取每桶均值为代表色。
 */
export function medianCut(colors: readonly Rgb[], count: number): Rgb[] {
  if (colors.length === 0) return [[0, 0, 0]]

  let buckets: Rgb[][] = [[...colors]]

  while (buckets.length < count) {
    let targetIndex = -1
    let targetChannel = 0
    let targetRange = 0

    for (let index = 0; index < buckets.length; index += 1) {
      const bucket = buckets[index]
      if (bucket.length < 2) continue
      for (let channel = 0; channel < 3; channel += 1) {
        let min = 255
        let max = 0
        for (const color of bucket) {
          const value = color[channel]
          if (value < min) min = value
          if (value > max) max = value
        }
        if (max - min > targetRange) {
          targetRange = max - min
          targetIndex = index
          targetChannel = channel
        }
      }
    }

    // 所有色桶都无法再切分（颜色高度集中）时提前结束
    if (targetIndex < 0 || targetRange === 0) break

    const bucket = buckets[targetIndex]
    bucket.sort((a, b) => a[targetChannel] - b[targetChannel])
    const middle = bucket.length >> 1
    buckets = [
      ...buckets.slice(0, targetIndex),
      bucket.slice(0, middle),
      bucket.slice(middle),
      ...buckets.slice(targetIndex + 1),
    ]
  }

  return buckets.filter((bucket) => bucket.length > 0).map(averageColor)
}
