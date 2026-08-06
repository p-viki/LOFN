import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'
import { Seo } from '@/components/seo/Seo'
import { cn } from '@/utils/cn'
import type { RGB, HSV } from './colorUtils'
import {
  clamp, round, parseColor, rgbToHex, rgbToCss,
  rgbToHsl, rgbToHslCss, rgbToHsv, hsvToRgb, blendOver,
} from './colorUtils'
import { GradientTab } from './GradientSphere'

// ============ UI helpers ============

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [])
  return { copied, copy }
}

function CopyButton({ value }: { value: string }) {
  const { copied, copy } = useCopy()
  return (
    <button
      onClick={() => copy(value)}
      className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors"
      aria-label="复制"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

function FieldRow({ label, value, onChange, placeholder, error }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono uppercase tracking-wider text-text-tertiary">{label}</label>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent border-b px-0 py-2 text-sm text-text-primary',
            'placeholder:text-text-tertiary focus:outline-none transition-colors duration-300',
            error
              ? 'border-error'
              : 'border-border-default focus:border-info'
          )}
        />
        <CopyButton value={value} />
      </div>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
}

function Swatch({ color, label }: { color: string; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-full h-16 rounded-md border border-border-subtle shadow-inner"
        style={{ backgroundColor: color }}
      />
      {label && <span className="text-xs font-mono text-text-tertiary">{label}</span>}
    </div>
  )
}

// ============ Color Picker ============

interface ColorPickerProps {
  hsv: HSV
  onChange: (hsv: HSV) => void
  hideAlpha?: boolean
}

function ColorPicker({ hsv, onChange, hideAlpha }: ColorPickerProps) {
  const svRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const alphaRef = useRef<HTMLDivElement>(null)

  // SV panel drag
  const handleSVPointer = useCallback((e: ReactPointerEvent) => {
    const el = svRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clamp(e.clientX - rect.left, 0, rect.width)
    const y = clamp(e.clientY - rect.top, 0, rect.height)
    const s = round((x / rect.width) * 100)
    const v = round(100 - (y / rect.height) * 100)
    onChange({ ...hsv, s, v })
  }, [hsv, onChange])

  const handleSVDown = useCallback((e: ReactPointerEvent) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    handleSVPointer(e)
  }, [handleSVPointer])

  // Hue slider drag
  const handleHuePointer = useCallback((e: ReactPointerEvent) => {
    const el = hueRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clamp(e.clientX - rect.left, 0, rect.width)
    const h = round((x / rect.width) * 360)
    onChange({ ...hsv, h })
  }, [hsv, onChange])

  const handleHueDown = useCallback((e: ReactPointerEvent) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    handleHuePointer(e)
  }, [handleHuePointer])

  // Alpha slider drag
  const handleAlphaPointer = useCallback((e: ReactPointerEvent) => {
    const el = alphaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clamp(e.clientX - rect.left, 0, rect.width)
    const a = round(x / rect.width, 3)
    onChange({ ...hsv, a })
  }, [hsv, onChange])

  const handleAlphaDown = useCallback((e: ReactPointerEvent) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    handleAlphaPointer(e)
  }, [handleAlphaPointer])

  // Colors for rendering
  const hueColor = useMemo(() => {
    const c = hsvToRgb(hsv.h, 100, 100)
    return rgbToCss(c)
  }, [hsv.h])

  const svPointerStyle = {
    left: `${hsv.s}%`,
    top: `${100 - hsv.v}%`,
  }

  const hueThumbStyle = {
    left: `${(hsv.h / 360) * 100}%`,
  }

  const alphaThumbStyle = {
    left: `${hsv.a * 100}%`,
  }

  const alphaBg = useMemo(() => {
    const solid = hsvToRgb(hsv.h, hsv.s, hsv.v, 1)
    return `linear-gradient(to right, rgba(${solid.r},${solid.g},${solid.b},0), rgb(${solid.r},${solid.g},${solid.b}))`
  }, [hsv.h, hsv.s, hsv.v])

  return (
    <div className="space-y-4">
      {/* SV Panel */}
      <div
        ref={svRef}
        onPointerDown={handleSVDown}
        onPointerMove={(e) => {
          if (e.buttons === 1) handleSVPointer(e)
        }}
        className="relative w-full h-48 rounded-lg cursor-crosshair overflow-hidden touch-none"
        style={{
          background: `
            linear-gradient(to top, #000, transparent),
            linear-gradient(to right, #fff, ${hueColor})
          `,
        }}
      >
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            ...svPointerStyle,
            backgroundColor: rgbToCss(hsvToRgb(hsv.h, hsv.s, hsv.v, hsv.a)),
          }}
        />
      </div>

      {/* Hue Slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-text-tertiary w-10 shrink-0">H</span>
        <div
          ref={hueRef}
          onPointerDown={handleHueDown}
          onPointerMove={(e) => {
            if (e.buttons === 1) handleHuePointer(e)
          }}
          className="relative flex-1 h-3 rounded-full cursor-pointer touch-none"
          style={{
            background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
          }}
        >
          <div
            className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ ...hueThumbStyle, backgroundColor: hueColor }}
          />
        </div>
        <span className="text-xs font-mono text-text-secondary w-12 text-right shrink-0">{hsv.h}°</span>
      </div>

      {/* Alpha Slider */}
      {!hideAlpha && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-text-tertiary w-10 shrink-0">A</span>
          <div
            ref={alphaRef}
            onPointerDown={handleAlphaDown}
            onPointerMove={(e) => {
              if (e.buttons === 1) handleAlphaPointer(e)
            }}
            className="relative flex-1 h-3 rounded-full cursor-pointer touch-none"
            style={{
              backgroundColor: 'transparent',
              backgroundImage: `
                repeating-conic-gradient(#555 0% 25%, #888 25% 50%)`,
              backgroundSize: '8px 8px',
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: alphaBg }}
            />
            <div
              className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ ...alphaThumbStyle, backgroundColor: rgbToCss(hsvToRgb(hsv.h, hsv.s, hsv.v, hsv.a)) }}
            />
          </div>
          <span className="text-xs font-mono text-text-secondary w-12 text-right shrink-0">{round(hsv.a, 2)}</span>
        </div>
      )}

      {/* Quick swatches */}
      <div className="flex flex-wrap gap-2 pt-2">
        {[
          '#ff6b6b', '#f59e0b', '#fbbf24', '#22c55e', '#06b6d4',
          '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#000000',
          '#666666', '#ffffff',
        ].map((swatch) => (
          <button
            key={swatch}
            onClick={() => {
              const parsed = parseColor(swatch)
              if (parsed) {
                onChange(rgbToHsv(parsed))
              }
            }}
            className="w-6 h-6 rounded-md border border-border-subtle hover:scale-110 transition-transform"
            style={{ backgroundColor: swatch }}
            aria-label={swatch}
          />
        ))}
      </div>
    </div>
  )
}

// ============ Color Field with Popover Picker ============

interface ColorFieldWithPickerProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  /** Hide alpha slider (for opaque-only fields like background) */
  hideAlpha?: boolean
}

function ColorFieldWithPicker({ label, value, onChange, placeholder, error, hideAlpha }: ColorFieldWithPickerProps) {
  const [open, setOpen] = useState(false)
  const parsed = useMemo(() => parseColor(value), [value])
  const hsv = useMemo(() => {
    if (!parsed) return { h: 0, s: 0, v: 100, a: 1 }
    return rgbToHsv(parsed)
  }, [parsed])

  const handlePickerChange = useCallback((newHsv: HSV) => {
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v, hideAlpha ? 1 : newHsv.a)
    onChange(rgb.a < 1 ? rgbToCss(rgb) : rgbToHex(rgb))
  }, [onChange, hideAlpha])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div className="relative flex flex-col gap-1.5">
      <label className="text-xs font-mono uppercase tracking-wider text-text-tertiary">{label}</label>
      <div className="flex items-center gap-2">
        {/* Swatch trigger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'w-8 h-8 rounded-md border shrink-0 transition-all',
            open
              ? 'border-info ring-2 ring-info/20'
              : 'border-border-subtle hover:border-border-default'
          )}
          style={{
            backgroundColor: parsed ? rgbToCss(parsed) : 'transparent',
            backgroundImage: parsed ? undefined : 'repeating-conic-gradient(#555 0% 25%, #888 25% 50%)',
            backgroundSize: '8px 8px',
          }}
          aria-label="打开调色盘"
        />

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setOpen(false)}
          className={cn(
            'flex-1 bg-transparent border-b px-0 py-2 text-sm text-text-primary',
            'placeholder:text-text-tertiary focus:outline-none transition-colors duration-300',
            error
              ? 'border-error'
              : 'border-border-default focus:border-info'
          )}
        />
        <CopyButton value={value} />
      </div>
      {error && <span className="text-xs text-error">{error}</span>}

      {/* Popover picker */}
      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-50 w-full min-w-[280px] p-4 rounded-lg border border-border-subtle bg-bg-surface shadow-xl">
            <ColorPicker
              hsv={hsv}
              onChange={handlePickerChange}
              hideAlpha={hideAlpha}
            />
          </div>
        </>
      )}
    </div>
  )
}

// ============ Main Component ============

type Tab = 'convert' | 'blend' | 'gradient'

export function ColorTool() {
  const [tab, setTab] = useState<Tab>('convert')
  const [input, setInput] = useState('#22d3ee')
  const [fgInput, setFgInput] = useState('rgba(34, 211, 238, 0.35)')
  const [bgInput, setBgInput] = useState('#020408')
  const [gradientSelected, setGradientSelected] = useState<RGB | null>(null)

  const parsed = useMemo(() => parseColor(input), [input])
  const fgParsed = useMemo(() => parseColor(fgInput), [fgInput])
  const bgParsed = useMemo(() => parseColor(bgInput), [bgInput])
  const blended = useMemo(() => {
    if (!fgParsed || !bgParsed) return null
    return blendOver(fgParsed, { ...bgParsed, a: 1 })
  }, [fgParsed, bgParsed])

  // Sync HSV from parsed color (for picker)
  const hsv = useMemo(() => {
    if (!parsed) return { h: 187, s: 92, v: 93, a: 1 }
    return rgbToHsv(parsed)
  }, [parsed])

  // When picker changes, update the input string
  const handlePickerChange = useCallback((newHsv: HSV) => {
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v, newHsv.a)
    // Keep format consistent: use rgba if has alpha, hex otherwise
    if (newHsv.a < 1) {
      setInput(rgbToCss(rgb))
    } else {
      setInput(rgbToHex(rgb))
    }
  }, [])

  return (
    <>
      <Seo title="颜色转换" description="色值格式互转与透明色叠加计算" />
      <Section spacing="lg">
        <Container size="md">
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
          >
            <ArrowLeft size={16} /> 返回工具箱
          </Link>

          <h1 className="text-2xl font-semibold text-text-primary mb-2">颜色转换</h1>
          <p className="text-text-secondary text-sm mb-8">
            HEX / RGB / HSL 格式互转，支持透明色叠加计算。
          </p>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-bg-elevated rounded-lg w-fit mb-8">
            {([
              { key: 'convert', label: '色值转换' },
              { key: 'blend', label: '透明色叠加' },
              { key: 'gradient', label: '渐变色球' },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-4 py-2 text-sm rounded-md transition-all duration-300',
                  tab === t.key
                    ? 'bg-bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'convert' && (
            <Card hover={false} className="space-y-6">
              {/* Color Picker */}
              <ColorPicker hsv={hsv} onChange={handlePickerChange} />

              <FieldRow
                label="输入"
                value={input}
                onChange={setInput}
                placeholder="#22d3ee / rgb(34,211,238) / hsl(187,92%,64%)"
                error={input && !parsed ? '无法识别的颜色格式' : undefined}
              />

              {parsed && (
                <>
                  <Swatch color={rgbToCss(parsed)} label="预览" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FieldRow
                      label="HEX"
                      value={rgbToHex(parsed)}
                      onChange={(v) => setInput(v)}
                    />
                    <FieldRow
                      label="HEX (含 Alpha)"
                      value={rgbToHex(parsed)}
                      onChange={(v) => setInput(v)}
                    />
                    <FieldRow
                      label="RGB"
                      value={rgbToCss(parsed)}
                      onChange={(v) => setInput(v)}
                    />
                    <FieldRow
                      label="HSL"
                      value={rgbToHslCss(parsed)}
                      onChange={(v) => setInput(v)}
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-2 text-xs text-text-tertiary">
                    <span>R: {parsed.r}</span>
                    <span>G: {parsed.g}</span>
                    <span>B: {parsed.b}</span>
                    {parsed.a < 1 && <span>A: {round(parsed.a, 2)}</span>}
                    {(() => {
                      const { h, s, l } = rgbToHsl(parsed)
                      return (
                        <>
                          <span className="ml-4">H: {h}°</span>
                          <span>S: {s}%</span>
                          <span>L: {l}%</span>
                        </>
                      )
                    })()}
                  </div>
                </>
              )}
            </Card>
          )}

          {tab === 'blend' && (
            <Card hover={false} className="space-y-6">
              <p className="text-sm text-text-secondary">
                输入半透明前景色和不透明底色，计算叠加后的实色色值。
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ColorFieldWithPicker
                  label="前景色（可含透明度）"
                  value={fgInput}
                  onChange={setFgInput}
                  placeholder="rgba(34,211,238,0.35)"
                  error={fgInput && !fgParsed ? '无法识别的颜色格式' : undefined}
                />
                <ColorFieldWithPicker
                  label="底色（不透明）"
                  value={bgInput}
                  onChange={setBgInput}
                  placeholder="#020408"
                  hideAlpha
                  error={bgInput && !bgParsed ? '无法识别的颜色格式' : undefined}
                />
              </div>

              {fgParsed && bgParsed && blended && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-full h-16 rounded-md border border-border-subtle shadow-inner cursor-pointer hover:border-border-default transition-colors"
                        style={{ backgroundColor: rgbToCss(fgParsed) }}
                        title="前景色"
                      />
                      <span className="text-xs font-mono text-text-tertiary">前景色</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-full h-16 rounded-md border border-border-subtle shadow-inner cursor-pointer hover:border-border-default transition-colors"
                        style={{ backgroundColor: rgbToCss({ ...bgParsed, a: 1 }) }}
                        title="底色"
                      />
                      <span className="text-xs font-mono text-text-tertiary">底色</span>
                    </div>
                    <Swatch color={rgbToCss(blended)} label="叠加结果" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                    <FieldRow label="HEX" value={rgbToHex(blended)} onChange={() => {}} />
                    <FieldRow label="RGB" value={rgbToCss(blended)} onChange={() => {}} />
                    <FieldRow label="HSL" value={rgbToHslCss(blended)} onChange={() => {}} />
                  </div>

                  <div className="rounded-md bg-bg-elevated p-4 text-xs font-mono text-text-secondary leading-relaxed">
                    <div>计算公式: result = fg × alpha + bg × (1 - alpha)</div>
                    <div className="mt-2 text-text-tertiary">
                      R = {round(fgParsed.r)} × {round(fgParsed.a, 2)} + {round(bgParsed.r)} × {round(1 - fgParsed.a, 2)} = {round(blended.r)}
                    </div>
                    <div className="text-text-tertiary">
                      G = {round(fgParsed.g)} × {round(fgParsed.a, 2)} + {round(bgParsed.g)} × {round(1 - fgParsed.a, 2)} = {round(blended.g)}
                    </div>
                    <div className="text-text-tertiary">
                      B = {round(fgParsed.b)} × {round(fgParsed.a, 2)} + {round(bgParsed.b)} × {round(1 - fgParsed.a, 2)} = {round(blended.b)}
                    </div>
                  </div>
                </>
              )}
            </Card>
          )}
          {tab === 'gradient' && (
            <Card hover={false}>
              <GradientTab
                onPick={(color) => setGradientSelected(color)}
                selected={gradientSelected}
              />
            </Card>
          )}
        </Container>
      </Section>
    </>
  )
}

export default ColorTool
