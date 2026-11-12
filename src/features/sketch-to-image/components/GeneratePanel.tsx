import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/ui/Button'

type GeneratePhase = 'idle' | 'analyzing' | 'generating'

interface GeneratePanelProps {
  prompt: string
  phase: GeneratePhase
  error: string | null
  notice: string | null
  analyzedPrompt: string | null
  onPromptChange: (value: string) => void
  onGenerate: () => void
}

const PHASE_LABEL: Record<GeneratePhase, string> = {
  idle: '生成图片',
  analyzing: '分析草图…',
  generating: '生成中…',
}

export function GeneratePanel({
  prompt,
  phase,
  error,
  notice,
  analyzedPrompt,
  onPromptChange,
  onGenerate,
}: GeneratePanelProps) {
  const busy = phase !== 'idle'

  return (
    <div className="lofn-sketch-generate">
      <label className="lofn-sketch-generate__label" htmlFor="sketch-prompt">
        描述你想要的图片（可选，AI 会结合草图一起理解）
      </label>
      <textarea
        id="sketch-prompt"
        className="lofn-sketch-generate__input"
        value={prompt}
        rows={3}
        maxLength={500}
        disabled={busy}
        placeholder="例如：山间的一栋温馨小屋，黄昏时分，窗内透出暖黄灯光"
        onChange={(event) => onPromptChange(event.target.value)}
      />

      {analyzedPrompt && (
        <p className="lofn-sketch-generate__analysis" aria-live="polite">
          <strong>AI 草图分析</strong>
          <span>{analyzedPrompt}</span>
        </p>
      )}

      {notice && (
        <p className="lofn-sketch-generate__notice" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p className="lofn-sketch-generate__error" role="alert">
          {error}
        </p>
      )}

      <div className="lofn-sketch-generate__actions">
        <Button
          size="lg"
          className="lofn-sketch-generate__submit"
          disabled={busy}
          aria-busy={busy}
          onClick={onGenerate}
        >
          {busy ? (
            <>
              <Loader2 size={18} className="lofn-sketch-generate__spinner" />
              {PHASE_LABEL[phase]}
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {PHASE_LABEL.idle}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
