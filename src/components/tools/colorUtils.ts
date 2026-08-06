// ============ Types ============

export interface RGB { r: number; g: number; b: number; a: number }

export interface HSV { h: number; s: number; v: number; a: number }

// ============ Utilities ============

export function clamp(v: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, v))
}

export function clampAlpha(v: number) {
  return Math.min(1, Math.max(0, v))
}

export function round(n: number, d = 0) {
  const f = Math.pow(10, d)
  return Math.round(n * f) / f
}

// ============ Parsing ============

/** Parse any supported color string into {r,g,b,a} */
export function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase()
  if (!s) return null

  // #hex / #hex8
  let m = s.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/)
  if (m) {
    const hex = m[1]
    if (hex.length <= 4) {
      const expand = hex.split('').map((c) => c + c).join('')
      return hexToRgb('#' + expand)
    }
    return hexToRgb('#' + hex)
  }

  // rgb() / rgba()
  m = s.match(/^rgba?\(\s*(\d{1,3}%?)\s*[,\s]\s*(\d{1,3}%?)\s*[,\s]\s*(\d{1,3}%?)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i)
  if (m) {
    const r = parseChannel(m[1])
    const g = parseChannel(m[2])
    const b = parseChannel(m[3])
    const a = m[4] ? parseAlpha(m[4]) : 1
    if (r === null || g === null || b === null) return null
    return { r, g, b, a }
  }

  // hsl() / hsla()
  m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i)
  if (m) {
    const h = parseFloat(m[1])
    const s = parseFloat(m[2])
    const l = parseFloat(m[3])
    const a = m[4] ? parseAlpha(m[4]) : 1
    const { r, g, b } = hslToRgb(h, s, l)
    return { r, g, b, a }
  }

  return null
}

function parseChannel(str: string): number | null {
  if (str.endsWith('%')) {
    const v = parseFloat(str)
    if (isNaN(v)) return null
    return Math.round((v / 100) * 255)
  }
  const v = parseInt(str, 10)
  if (isNaN(v)) return null
  return clamp(v)
}

function parseAlpha(str: string): number {
  if (str.endsWith('%')) return clampAlpha(parseFloat(str) / 100)
  return clampAlpha(parseFloat(str))
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
  }
}

// ============ Conversions ============

export function rgbToHex({ r, g, b, a }: RGB): string {
  const toHex = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, '0')
  const base = `#${toHex(r)}${toHex(g)}${toHex(b)}`
  return a < 1 ? `${base}${toHex(a * 255)}` : base
}

export function rgbToCss({ r, g, b, a }: RGB): string {
  return a < 1
    ? `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${round(a, 2)})`
    : `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

export function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break
      case gn: h = (bn - rn) / d + 2; break
      case bn: h = (rn - gn) / d + 4; break
    }
    h *= 60
  }
  return { h: round(h), s: round(s * 100), l: round(l * 100) }
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hn = ((h % 360) + 360) % 360 / 360
  const sn = clamp(s, 0, 100) / 100
  const ln = clamp(l, 0, 100) / 100

  if (sn === 0) {
    const v = round(ln * 255)
    return { r: v, g: v, b: v }
  }

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  const hue = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  return {
    r: round(hue(hn + 1 / 3) * 255),
    g: round(hue(hn) * 255),
    b: round(hue(hn - 1 / 3) * 255),
  }
}

export function rgbToHslCss({ r, g, b, a }: RGB): string {
  const { h, s, l } = rgbToHsl({ r, g, b, a })
  return a < 1
    ? `hsla(${h}, ${s}%, ${l}%, ${round(a, 2)})`
    : `hsl(${h}, ${s}%, ${l}%)`
}

export function rgbToHsv({ r, g, b, a }: RGB): HSV {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case rn: h = ((gn - bn) / d) % 6; break
      case gn: h = (bn - rn) / d + 2; break
      case bn: h = (rn - gn) / d + 4; break
    }
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h: round(h), s: round(s * 100), v: round(max * 100), a }
}

export function hsvToRgb(h: number, s: number, v: number, a = 1): RGB {
  const hn = (((h % 360) + 360) % 360) / 60
  const sn = clamp(s, 0, 100) / 100
  const vn = clamp(v, 0, 100) / 100
  const c = vn * sn
  const x = c * (1 - Math.abs((hn % 2) - 1))
  const m = vn - c
  let r = 0, g = 0, b = 0
  if (hn < 1) { r = c; g = x }
  else if (hn < 2) { r = x; g = c }
  else if (hn < 3) { g = c; b = x }
  else if (hn < 4) { g = x; b = c }
  else if (hn < 5) { r = x; b = c }
  else { r = c; b = x }
  return { r: round((r + m) * 255), g: round((g + m) * 255), b: round((b + m) * 255), a }
}

// ============ Blend ============

/** Blend a semi-transparent foreground over an opaque background -> opaque result */
export function blendOver(fg: RGB, bg: RGB): RGB {
  const a = fg.a
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  }
}
