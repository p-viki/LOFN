/**
 * 立体等高线环：参考"水平椭圆环堆叠成球体"的线框效果
 * 大量细密玫红/粉紫轮廓环在黑场中缓慢旋转、呼吸，形成三维线框体。
 * Canvas 2D + GSAP 呼吸时间线。
 */

import gsap from 'gsap'

export type WireframeQuality = 'low' | 'medium' | 'high'

interface Config {
  quality: WireframeQuality
}

const PALETTE: Array<[string, number]> = [
  ['#E8EDF5', 0.5], // 铬银（主体）
  ['#83DFFF', 0.28], // 冰蓝高光
  ['#A66BFF', 0.16], // 荧光紫点缀
  ['#B48CFF', 0.06], // 亮紫过渡
]

const QUALITY = {
  low: { rings: 30, segs: 60 },
  medium: { rings: 46, segs: 90 },
  high: { rings: 64, segs: 120 },
}

function pickColor(r: number): string {
  let acc = 0
  for (const [c, w] of PALETTE) {
    acc += w
    if (r <= acc) return c
  }
  return PALETTE[0][0]
}

export class WireframeText {
  private ctx: CanvasRenderingContext2D
  private rings: Array<{ v: number; color: string; phase: number; freq: number; wob: number; speed: number }> = []
  private breath = { v: 1 }
  private time = 0
  private raf = 0
  private W = 0
  private H = 0
  private dpr = 1
  private pointer = { x: 0, y: 0 }
  private target = { x: 0, y: 0 }
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  private tl: gsap.core.Timeline | null = null
  private ro: ResizeObserver

  constructor(
    private canvas: HTMLCanvasElement,
    config: Config,
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not supported')
    this.ctx = ctx
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)

    const { rings, segs } = QUALITY[config.quality]
    this.segs = segs
    this.pts = new Float32Array(segs * 2)
    for (let i = 0; i < rings; i++) {
      this.rings.push({
        v: i / (rings - 1),
        color: pickColor(Math.random()),
        phase: Math.random() * Math.PI * 2,
        freq: 2 + Math.random() * 4,
        wob: 0.025 + Math.random() * 0.05,
        speed: 0.25 + Math.random() * 0.5,
      })
    }

    this.resize()
    this.ro = new ResizeObserver(this.resize)
    this.ro.observe(canvas)
    window.addEventListener('pointermove', this.onMove)

    if (this.reduced) {
      this.render(0)
    } else {
      // 呼吸：半径缓慢胀缩
      this.tl = gsap.timeline({ repeat: -1, yoyo: true })
      this.tl.to(this.breath, { v: 1.16, duration: 5, ease: 'sine.inOut' })
      this.raf = requestAnimationFrame(this.tick)
    }
  }

  private segs: number
  private pts = new Float32Array(0)

  private onMove = (e: PointerEvent) => {
    this.target.x = (e.clientX / window.innerWidth - 0.5) * 2
    this.target.y = (e.clientY / window.innerHeight - 0.5) * 2
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    this.W = rect.width || window.innerWidth
    this.H = rect.height || window.innerHeight
    this.canvas.width = this.W * this.dpr
    this.canvas.height = this.H * this.dpr
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private render(t: number) {
    const { ctx, W, H } = this
    ctx.clearRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'lighter'
    ctx.lineCap = 'round'

    this.pointer.x += (this.target.x - this.pointer.x) * 0.04
    this.pointer.y += (this.target.y - this.pointer.y) * 0.04

    const cx = W / 2
    const cy = H / 2
    const R = Math.min(W, H) * 0.36 * this.breath.v
    const squash = 0.26 // 椭圆透视压扁率
    const segs = this.segs

    for (const ring of this.rings) {
      // 球体纵向轮廓：中部宽、两极收窄
      const profile = Math.pow(Math.sin(ring.v * Math.PI), 0.85)
      const yc = cy + (ring.v - 0.5) * R * 2.4 + Math.sin(t * 0.2 + ring.phase) * 6
      // 每环独立微呼吸：不同相位，形成波浪式胀缩
      const breathe = 1 + Math.sin(t * 0.45 + ring.phase) * 0.06
      const rx = R * profile * breathe
      const ry = rx * squash
      if (rx < 2) continue

      const tilt = this.pointer.x * 0.12 * (ring.v - 0.5)
      const wob = ring.wob
      const pts = this.pts

      for (let s = 0; s < segs; s++) {
        const a = (s / segs) * Math.PI * 2
        // 有机扰动：轮廓不是完美椭圆
        const r =
          1 +
          Math.sin(a * ring.freq + t * ring.speed + ring.phase) * wob +
          Math.sin(a * (ring.freq * 2.7) - t * ring.speed * 0.7 + ring.phase * 2) * wob * 0.6
        const x = cx + Math.cos(a) * rx * r + tilt * 40
        const y = yc + Math.sin(a) * ry * r + this.pointer.y * 10 * (ring.v - 0.5)
        pts[s * 2] = x
        pts[s * 2 + 1] = y
      }

      // 二次贝塞尔中点法平滑闭合
      ctx.beginPath()
      ctx.moveTo((pts[0] + pts[(segs - 1) * 2]) / 2, (pts[1] + pts[(segs - 1) * 2 + 1]) / 2)
      for (let s = 0; s < segs; s++) {
        const nx = pts[((s + 1) % segs) * 2]
        const ny = pts[((s + 1) % segs) * 2 + 1]
        ctx.quadraticCurveTo(pts[s * 2], pts[s * 2 + 1], (pts[s * 2] + nx) / 2, (pts[s * 2 + 1] + ny) / 2)
      }
      ctx.closePath()

      // 两极略暗、中部亮，亮度缓慢流动
      const glow = 0.35 + 0.65 * profile
      ctx.globalAlpha = glow * (0.4 + 0.3 * Math.sin(t * 0.8 + ring.phase))
      ctx.strokeStyle = ring.color
      ctx.lineWidth = 0.6 + profile * 0.6
      ctx.stroke()
    }
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick)
    if (document.hidden) return
    this.render(this.time)
    this.time += 0.016
  }

  pause() {
    cancelAnimationFrame(this.raf)
    this.tl?.pause()
  }

  resume() {
    if (this.reduced) return
    this.tl?.resume()
    this.raf = requestAnimationFrame(this.tick)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.tl?.kill()
    this.ro.disconnect()
    window.removeEventListener('pointermove', this.onMove)
  }
}
