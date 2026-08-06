import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { RGB } from './colorUtils'
import {
  rgbToHex, rgbToCss, rgbToHslCss, hslToRgb, round,
} from './colorUtils'

// ============ Sphere math ============

/** Compute the color for a point on the unit sphere given base hue and rotation */
function sphereColor(
  sx: number, sy: number, sz: number,
  baseHue: number,
): RGB {
  // Latitude (y) -> lightness: top=92%, bottom=18%
  const l = ((sy + 1) / 2) * 74 + 18
  // Longitude -> hue shift ±40°
  const theta = Math.atan2(sz, sx) // -π ~ π
  const hueOffset = ((theta + Math.PI) / (Math.PI * 2)) * 80 - 40
  const h = (baseHue + hueOffset + 360) % 360
  // Saturation slightly lower at poles
  const s = 88 - Math.abs(sy) * 18
  const { r, g, b } = hslToRgb(h, s, l)
  return { r, g, b, a: 1 }
}

/** Rotate a 3D vector around X then Y axis */
function rotateVec(x: number, y: number, z: number, rotX: number, rotY: number) {
  const rx = (rotX * Math.PI) / 180
  const ry = (rotY * Math.PI) / 180
  // Rotate around X
  const cosX = Math.cos(rx), sinX = Math.sin(rx)
  const y1 = y * cosX - z * sinX
  const z1 = y * sinX + z * cosX
  // Rotate around Y
  const cosY = Math.cos(ry), sinY = Math.sin(ry)
  const x2 = x * cosY + z1 * sinY
  const z2 = -x * sinY + z1 * cosY
  return { x: x2, y: y1, z: z2 }
}

// ============ Canvas renderer ============

function renderSphere(
  ctx: CanvasRenderingContext2D,
  size: number,
  radius: number,
  baseHue: number,
  rotX: number,
  rotY: number,
) {
  const imageData = ctx.createImageData(size, size)
  const data = imageData.data
  const cx = size / 2
  const cy = size / 2
  const r2 = radius * radius

  // Light direction (normalized) - upper left front
  const lx = -0.5, ly = -0.6, lz = 0.8
  const lLen = Math.sqrt(lx * lx + ly * ly + lz * lz)
  const lxn = lx / lLen, lyn = ly / lLen, lzn = lz / lLen

  // Ambient light
  const ambient = 0.25

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = px - cx
      const dy = py - cy
      const dist2 = dx * dx + dy * dy

      if (dist2 > r2) continue

      // Reconstruct sphere point (screen space, y is down so flip)
      const sz = Math.sqrt(r2 - dist2) / radius
      const sx = dx / radius
      const sy = -dy / radius // flip y for screen->world

      // Rotate the sphere point to get the "original" position on the sphere
      const rotated = rotateVec(sx, sy, sz, rotX, rotY)

      // Base color from gradient mapping
      const color = sphereColor(rotated.x, rotated.y, rotated.z, baseHue)

      // Lighting: diffuse shading using the screen-space normal (sx, sy, sz)
      // Normal at this pixel is (sx, sy, sz) in screen space
      const dot = sx * lxn + sy * lyn + sz * lzn
      const diffuse = Math.max(0, dot)
      const lightFactor = ambient + (1 - ambient) * diffuse

      // Rim light for edge glow
      const rim = Math.pow(1 - sz, 2) * 0.15

      const idx = (py * size + px) * 4
      data[idx] = Math.min(255, color.r * lightFactor + rim * 255)
      data[idx + 1] = Math.min(255, color.g * lightFactor + rim * 255)
      data[idx + 2] = Math.min(255, color.b * lightFactor + rim * 255)
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

// ============ Copy hook ============

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [])
  return { copied, copy }
}

// ============ Gradient Sphere (Canvas) ============

interface GradientSphereProps {
  radius?: number
  baseHue: number
  onPick: (color: RGB) => void
  selected: RGB | null
}

function GradientSphere({ radius = 140, baseHue, onPick, selected }: GradientSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rotX, setRotX] = useState(-15)
  const [rotY, setRotY] = useState(20)
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef({ startX: 0, startY: 0, baseRotX: 0, baseRotY: 0, moved: false })

  const size = radius * 2 + 4 // padding for anti-alias edge

  // Render on state change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    renderSphere(ctx, size, radius, baseHue, rotX, rotY)
  }, [size, radius, baseHue, rotX, rotY])

  const handlePointerDown = useCallback((e: ReactPointerEvent) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseRotX: rotX,
      baseRotY: rotY,
      moved: false,
    }
    setIsDragging(true)
  }, [rotX, rotY])

  const handlePointerMove = useCallback((e: ReactPointerEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragState.current.moved = true
    }
    setRotY(dragState.current.baseRotY + dx * 0.5)
    setRotX(Math.max(-89, Math.min(89, dragState.current.baseRotX - dy * 0.5)))
  }, [isDragging])

  const handlePointerUp = useCallback((e: ReactPointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsDragging(false)
  }, [])

  const handleClick = useCallback((e: ReactPointerEvent) => {
    if (dragState.current.moved) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const px = Math.round((e.clientX - rect.left) * scaleX)
    const py = Math.round((e.clientY - rect.top) * scaleY)
    const pixel = ctx.getImageData(px, py, 1, 1).data
    if (pixel[3] === 0) return // transparent = outside sphere
    onPick({ r: pixel[0], g: pixel[1], b: pixel[2], a: 1 })
  }, [onPick])

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size, cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}
      />
      {/* Selected indicator */}
      {selected && (
        <div className="absolute -bottom-2 -right-2 flex items-center gap-2 px-2 py-1 rounded-lg bg-bg-surface border border-border-subtle shadow-lg">
          <div
            className="w-5 h-5 rounded-full border border-white/30"
            style={{ backgroundColor: rgbToCss(selected) }}
          />
          <span className="text-xs font-mono text-text-primary">{rgbToHex(selected)}</span>
        </div>
      )}
    </div>
  )
}

// ============ Gradient Tab ============

interface GradientTabProps {
  onPick: (color: RGB) => void
  selected: RGB | null
}

export function GradientTab({ onPick, selected }: GradientTabProps) {
  const [baseHue, setBaseHue] = useState(187)
  const { copied, copy } = useCopy()

  const selectedHex = selected ? rgbToHex(selected) : ''
  const selectedCss = selected ? rgbToCss(selected) : ''
  const selectedHsl = selected ? rgbToHslCss(selected) : ''

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        拖动球体旋转查看，点击球面选取颜色。底部色相条选择基础色相。
      </p>

      {/* 3D Sphere */}
      <div className="flex justify-center py-4">
        <GradientSphere
          radius={140}
          baseHue={baseHue}
          onPick={onPick}
          selected={selected}
        />
      </div>

      {/* Base hue bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-text-tertiary w-12 shrink-0">色相</span>
        <div
          className="relative flex-1 h-4 rounded-full cursor-pointer touch-none"
          style={{
            background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
          }}
        >
          <input
            type="range"
            min={0}
            max={360}
            value={baseHue}
            onChange={(e) => setBaseHue(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${(baseHue / 360) * 100}%`,
              backgroundColor: rgbToCss(hslToRgb(baseHue, 90, 55)),
            }}
          />
        </div>
        <span className="text-xs font-mono text-text-secondary w-12 text-right shrink-0">{baseHue}°</span>
      </div>

      {/* Selected color display */}
      {selected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-text-tertiary">选中颜色</label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border border-border-subtle shadow-inner shrink-0"
                style={{ backgroundColor: selectedCss }}
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => copy(selectedHex)}
                  className="flex items-center gap-2 text-sm font-mono text-text-primary hover:text-info transition-colors"
                >
                  {selectedHex}
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <span className="text-xs font-mono text-text-tertiary">{selectedCss}</span>
                <span className="text-xs font-mono text-text-tertiary">{selectedHsl}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-text-tertiary">色值</label>
            <div className="grid grid-cols-3 gap-2">
              <ValueChip label="R" value={selected.r} />
              <ValueChip label="G" value={selected.g} />
              <ValueChip label="B" value={selected.b} />
              {(() => {
                const rn = selected.r / 255, gn = selected.g / 255, bn = selected.b / 255
                const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
                const l = (max + min) / 2
                let h = 0, s = 0
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
                const hsl = { h: round(h), s: round(s * 100), l: round(l * 100) }
                return (
                  <>
                    <ValueChip label="H" value={`${hsl.h}°`} />
                    <ValueChip label="S" value={`${hsl.s}%`} />
                    <ValueChip label="L" value={`${hsl.l}%`} />
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ValueChip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-bg-elevated border border-border-subtle">
      <span className="text-xs font-mono text-text-tertiary">{label}</span>
      <span className="text-sm font-mono text-text-primary">{value}</span>
    </div>
  )
}

export default GradientTab
