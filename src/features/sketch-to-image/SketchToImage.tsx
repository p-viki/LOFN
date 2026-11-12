import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { Card } from '@/ui/Card'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { SketchCanvas } from './components/SketchCanvas'
import { CanvasToolbar } from './components/CanvasToolbar'
import { GeneratePanel } from './components/GeneratePanel'
import { GeneratedResult } from './components/GeneratedResult'
import { useSketchHistory } from './hooks/useSketchHistory'
import { analyzeSketch } from './services/analyzeSketch'
import { generateSketchImage } from './services/sketchToImage'
import type { GeneratedImage } from './services/sketchToImage'
import type { SketchCanvasHandle, Stroke } from './types'

const DEFAULT_BRUSH_SIZE = 4
const DEFAULT_BRUSH_COLOR = '#0f172a'

/** 生成流程阶段：先分析草图，再生成图片 */
type GeneratePhase = 'idle' | 'analyzing' | 'generating'

/** 草图分析结果的缓存：同一份草图 + 同一段描述只分析一次 */
interface AnalysisCache {
  strokes: Stroke[]
  hint: string
  prompt: string
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : '请求失败，请稍后重试。'
}

/**
 * Sketch to Image：绘制草图 + 可选描述
 * → DeepSeek 视觉分析草图得到提示词 → 调用出图接口生成图片。
 */
export default function SketchToImage() {
  const { strokes, canUndo, canRedo, commitStroke, undo, redo, clear } = useSketchHistory()
  const canvasRef = useRef<SketchCanvasHandle>(null)
  const analysisCacheRef = useRef<AnalysisCache | null>(null)
  const navigate = useNavigate()

  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE)
  const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH_COLOR)
  const [prompt, setPrompt] = useState('')
  const [phase, setPhase] = useState<GeneratePhase>('idle')
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  /** AI 根据草图得到的提示词（用于向用户透明展示实际提交的内容） */
  const [analyzedPrompt, setAnalyzedPrompt] = useState<string | null>(null)
  /** 非阻塞提示：草图分析被跳过等 */
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClear = useCallback(() => {
    clear()
    setGeneratedImage(null)
    setAnalyzedPrompt(null)
    setNotice(null)
    setError(null)
  }, [clear])

  /** 把当前画板导出后带去「像素工坊」当作参考图（像素画同样在本地生成） */
  const handleSendToStudio = useCallback(() => {
    const exported = canvasRef.current?.exportSketch()
    if (!exported) {
      setError('画板导出失败，请重试。')
      return
    }
    navigate('/pixel-studio', {
      state: { referenceImage: exported.dataUrl, fromSketchBoard: true },
    })
  }, [navigate])

  const handleGenerate = useCallback(async () => {
    // 防止连续点击产生多个请求（分析阶段同样禁止重复触发）
    if (phase !== 'idle') return

    if (strokes.length === 0) {
      setError('请先在画板上画一些内容。')
      return
    }

    // 导出当前画板（白底 PNG），保持用户看到的内容与提交内容一致
    const exported = canvasRef.current?.exportSketch()
    if (!exported) {
      setError('画板导出失败，请重试。')
      return
    }

    const hint = prompt.trim()
    setError(null)
    setNotice(null)
    setAnalyzedPrompt(null)

    // 1) 先用视觉模型读懂草图，得到最终提示词；失败不阻塞出图，降级为用户的原始描述
    let finalPrompt = hint
    const cached = analysisCacheRef.current
    if (cached && cached.strokes === strokes && cached.hint === hint) {
      finalPrompt = cached.prompt
      setAnalyzedPrompt(cached.prompt)
    } else {
      setPhase('analyzing')
      try {
        const analysis = await analyzeSketch({ image: exported.dataUrl, hint: hint || undefined })
        finalPrompt = analysis.prompt
        analysisCacheRef.current = { strokes, hint, prompt: analysis.prompt }
        setAnalyzedPrompt(analysis.prompt)
      } catch (err) {
        analysisCacheRef.current = null
        setNotice(`已跳过 AI 草图分析（${toMessage(err)}），直接使用你的描述生成。`)
      }
    }

    // 2) 出图
    setPhase('generating')
    try {
      const result = await generateSketchImage({
        image: exported.dataUrl,
        prompt: finalPrompt || undefined,
        width: exported.width,
        height: exported.height,
      })
      setGeneratedImage(result)
    } catch (err) {
      setError(toMessage(err))
    } finally {
      setPhase('idle')
    }
  }, [phase, prompt, strokes])

  return (
    <>
      <Seo
        title="Sketch to Image"
        description="在画板上绘制草图并描述你的想法，由 AI 生成对应图片"
      />

      <Section spacing="lg" className="lofn-sketch">
        <Container size="md">
          <header className="lofn-sketch__header">
            <h1 className="lofn-sketch__title">Sketch to Image</h1>
            <p className="lofn-sketch__desc">画出你的想法，让它变成一张图片</p>
          </header>

          <Card hover={false} className="lofn-sketch__board">
            <SketchCanvas
              ref={canvasRef}
              strokes={strokes}
              brushSize={brushSize}
              brushColor={brushColor}
              onCommitStroke={commitStroke}
            />

            <CanvasToolbar
              brushSize={brushSize}
              brushColor={brushColor}
              canUndo={canUndo}
              canRedo={canRedo}
              canClear={strokes.length > 0}
              canSendToStudio={strokes.length > 0}
              onBrushSizeChange={setBrushSize}
              onBrushColorChange={setBrushColor}
              onUndo={undo}
              onRedo={redo}
              onClear={handleClear}
              onSendToStudio={handleSendToStudio}
            />
          </Card>

          <GeneratePanel
            prompt={prompt}
            phase={phase}
            error={error}
            notice={notice}
            analyzedPrompt={analyzedPrompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
          />

          {generatedImage && (
            <GeneratedResult
              imageUrl={generatedImage.imageUrl}
              busy={phase !== 'idle'}
              notice={
                generatedImage.placeholder
                  ? (generatedImage.note ?? '当前为本地占位图：未配置出图服务。')
                  : null
              }
              onRegenerate={handleGenerate}
            />
          )}
        </Container>
      </Section>
    </>
  )
}
