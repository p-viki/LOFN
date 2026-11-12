import { Dices, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/ui/Button'
import { PALETTES } from '../lib/palettes'
import { randomSeed } from '../lib/random'
import { TIME_LABELS, planGroups } from '../lib/scenePlan'
import type { DitherMode, RenderOptions, ScenePlan } from '../types'

export type PixelPhase = 'idle' | 'analyzing' | 'rendering'

/** 分辨率档位：数值为最长边的像素数 */
const COLS_OPTIONS = [16, 24, 32, 48, 64, 96]

const DITHER_OPTIONS: Array<{ value: DitherMode; label: string }> = [
  { value: 'none', label: '无抖动 · 色块分明' },
  { value: 'bayer', label: 'Bayer 有序抖动' },
  { value: 'floyd', label: 'Floyd–Steinberg 扩散' },
]

interface PixelControlsProps {
  text: string
  onTextChange: (text: string) => void
  options: RenderOptions
  onOptionsChange: (patch: Partial<RenderOptions>) => void
  seed: number
  onSeedChange: (seed: number) => void
  phase: PixelPhase
  error: string | null
  notice: string | null
  /** AI（或关键词兜底）解析出的画面规划 */
  plan: ScenePlan | null
  canGenerate: boolean
  onGenerate: () => void
}

/** 描述输入 + 渲染参数 + 生成按钮 + 画面规划摘要 */
export function PixelControls({
  text,
  onTextChange,
  options,
  onOptionsChange,
  seed,
  onSeedChange,
  phase,
  error,
  notice,
  plan,
  canGenerate,
  onGenerate,
}: PixelControlsProps) {
  const busy = phase !== 'idle'
  const groups = plan ? planGroups(plan) : []

  return (
    <div className="lofn-pixel-controls">
      <label className="lofn-pixel-controls__label" htmlFor="pixel-prompt">
        描述你想要的画面
      </label>
      <textarea
        id="pixel-prompt"
        className="lofn-pixel-controls__input"
        value={text}
        rows={3}
        disabled={busy}
        placeholder="例如：黄昏时的山间小屋，屋前有一条小路，天上飞过几只鸟"
        onChange={(event) => onTextChange(event.target.value)}
      />
      <p className="lofn-pixel-controls__hint">
        点「生成」后，AI 会先把描述解析成一份画面构成（时间光线、地貌、物件及其远近与位置），
        再由前端渲染引擎逐层绘制成像素画；AI 不可用时自动回退到关键词兜底。
      </p>

      <div className="lofn-pixel-controls__row">
        <label className="lofn-pixel-controls__field">
          <span className="lofn-pixel-controls__field-label">分辨率（最长边）</span>
          <select
            value={options.cols}
            disabled={busy}
            onChange={(event) => onOptionsChange({ cols: Number(event.target.value) })}
          >
            {COLS_OPTIONS.map((cols) => (
              <option key={cols} value={cols}>
                {cols} 像素
              </option>
            ))}
          </select>
        </label>

        <label className="lofn-pixel-controls__field">
          <span className="lofn-pixel-controls__field-label">调色板</span>
          <select
            value={options.paletteId}
            disabled={busy}
            onChange={(event) =>
              onOptionsChange({ paletteId: event.target.value as RenderOptions['paletteId'] })
            }
          >
            {PALETTES.map((palette) => (
              <option key={palette.id} value={palette.id}>
                {palette.name}
              </option>
            ))}
          </select>
        </label>

        <label className="lofn-pixel-controls__field">
          <span className="lofn-pixel-controls__field-label">抖动</span>
          <select
            value={options.dither}
            disabled={busy}
            onChange={(event) =>
              onOptionsChange({ dither: event.target.value as RenderOptions['dither'] })
            }
          >
            {DITHER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="lofn-pixel-controls__field">
          <span className="lofn-pixel-controls__field-label">随机种子</span>
          <span className="lofn-pixel-controls__seed">
            <input
              type="number"
              min={0}
              value={seed}
              disabled={busy}
              aria-label="随机种子"
              onChange={(event) => onSeedChange(Number(event.target.value) >>> 0)}
            />
            <Button
              variant="icon"
              size="sm"
              aria-label="换一个随机种子"
              disabled={busy}
              onClick={() => onSeedChange(randomSeed())}
            >
              <Dices size={16} />
            </Button>
          </span>
        </label>

        <label className="lofn-pixel-controls__check">
          <input
            type="checkbox"
            checked={options.outline}
            disabled={busy}
            onChange={(event) => onOptionsChange({ outline: event.target.checked })}
          />
          <span>自动描边</span>
        </label>
      </div>

      {plan && (
        <div className="lofn-pixel-controls__plan">
          <p className="lofn-pixel-controls__plan-head">
            <strong>{plan.source === 'ai' ? 'AI 画面规划' : '关键词兜底'}</strong>
            <span>{plan.description || plan.title}</span>
          </p>
          {groups.length > 0 && (
            <ul className="lofn-pixel-controls__plan-layers">
              {groups.map((group) => (
                <li key={group.depth}>
                  <em>{group.label}</em>
                  <span>
                    {group.items
                      .map((item) => (item.count > 1 ? `${item.label}×${item.count}` : item.label))
                      .join('、')}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="lofn-pixel-controls__plan-meta">
            {TIME_LABELS[plan.timeOfDay]} · 地平线 {Math.round(plan.horizon * 100)}%
            {plan.source === 'ai' ? ' · 由 AI 解析' : ' · AI 不可用时由关键词解析'}
          </p>
          {plan.unsupported.length > 0 && (
            <p className="lofn-pixel-controls__plan-skipped">
              未能画进画面：{plan.unsupported.join('、')}
              （模型没给出可用的造型描述，换个说法重新生成试试）
            </p>
          )}
        </div>
      )}

      {notice && <p className="lofn-pixel-controls__notice">{notice}</p>}
      {error && (
        <p className="lofn-pixel-controls__error" role="alert">
          {error}
        </p>
      )}

      <div className="lofn-pixel-controls__actions">
        <Button
          className="lofn-pixel-controls__submit"
          disabled={busy || !canGenerate}
          aria-busy={busy}
          onClick={onGenerate}
        >
          {busy ? (
            <>
              <Loader2 className="lofn-pixel-controls__spinner" size={18} aria-hidden="true" />
              <span>{phase === 'analyzing' ? 'AI 解析画面…' : '正在绘制…'}</span>
            </>
          ) : (
            <>
              <Sparkles size={18} aria-hidden="true" />
              <span>生成像素画</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
