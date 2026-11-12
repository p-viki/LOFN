import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { Card } from '@/ui/Card'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { HtmlOutput } from './components/HtmlOutput'
import { PixelArtPreview } from './components/PixelArtPreview'
import { PixelControls } from './components/PixelControls'
import type { PixelPhase } from './components/PixelControls'
import { ReferenceInput } from './components/ReferenceInput'
import { fileToDataUrl, imageDataToDataUrl, loadImageData } from './lib/image'
import { planFromText } from './lib/keywords'
import { DEFAULT_PALETTE_ID } from './lib/palettes'
import { pixelizeImage, renderPlan } from './lib/pipeline'
import { randomSeed } from './lib/random'
import { renderPixelHtml } from './lib/renderHtml'
import { analyzeScene } from './services/analyzeScene'
import type { ArtworkKind, ReferenceImage, RenderOptions, ScenePlan } from './types'

const DEFAULT_OPTIONS: RenderOptions = {
  cols: 32,
  paletteId: DEFAULT_PALETTE_ID,
  dither: 'none',
  outline: false,
}

/** 送给模型的参考图最长边：够看清内容，又不浪费 token */
const ANALYZE_IMAGE_MAX_SIDE = 768

const KINDS: Array<{ kind: ArtworkKind; label: string }> = [
  { kind: 'faithful', label: '保真像素化' },
  { kind: 'rebuilt', label: 'AI 绘制' },
]

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败，请重试。'
}

/**
 * 像素工坊：描述 / 参考图 → AI 画面规划 → 前端渲染引擎绘制 → 可预览的 index.html。
 *
 *   1. 点生成：参考图在本地立即完成保真像素化（不依赖网络）；
 *   2. 同时把描述（或参考图）交给 AI，解析成「画面构成」——时间光线、地貌、物件及其远近位置；
 *   3. 前端渲染器按这份规划逐层绘制，得到「AI 绘制」版本；
 *   4. AI 不可用时回退到关键词兜底，画质降级但流程不断。
 */
export default function PixelStudio() {
  const location = useLocation()
  /** 解码后的参考图缓存，避免重复解码同一张图 */
  const imageCacheRef = useRef<{ key: string; data: ImageData } | null>(null)

  const [reference, setReference] = useState<ReferenceImage | null>(null)
  const [sourceImage, setSourceImage] = useState<{ key: string; data: ImageData } | null>(null)
  const [text, setText] = useState('')
  const [options, setOptions] = useState<RenderOptions>(DEFAULT_OPTIONS)
  const [seed, setSeed] = useState(() => randomSeed())
  const [phase, setPhase] = useState<PixelPhase>('idle')
  const [generated, setGenerated] = useState(false)
  const [tab, setTab] = useState<ArtworkKind>('rebuilt')
  const [plan, setPlan] = useState<ScenePlan | null>(null)
  /** 规划对应的输入，用于判断能否复用、避免重复调用 AI */
  const [planKey, setPlanKey] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const inputKey = `${reference?.dataUrl ?? ''}|${text.trim()}`

  // 从「草图生图」跳转过来时，直接把画板内容作为参考图
  useEffect(() => {
    const state = location.state as { referenceImage?: string; fromSketchBoard?: boolean } | null
    const dataUrl = state?.referenceImage
    if (!dataUrl) return

    let cancelled = false
    void (async () => {
      try {
        const { image, data } = await loadImageData(dataUrl)
        if (cancelled) return
        imageCacheRef.current = { key: dataUrl, data }
        setSourceImage({ key: dataUrl, data })
        setReference({
          dataUrl,
          name: '草图生图画板',
          width: image.naturalWidth,
          height: image.naturalHeight,
          fromSketchBoard: state?.fromSketchBoard === true,
        })
      } catch (err) {
        if (!cancelled) setError(toMessage(err))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [location.state])

  /**
   * 画面由「规划 + 渲染参数」决定，全部在本地同步完成：
   *   保真像素化 = 参考图降采样 + 限色
   *   AI 绘制    = 规划逐层合成 + 限色
   * 调整分辨率/调色板/抖动/描边会立即重绘，不会重新调用 AI。
   */
  const artworks = useMemo(() => {
    const image =
      sourceImage && sourceImage.key === (reference?.dataUrl ?? '') ? sourceImage.data : null
    const faithful = image ? pixelizeImage(image, options) : null
    const rebuilt = plan ? renderPlan(plan, options) : null
    return { faithful, rebuilt }
  }, [sourceImage, reference, plan, options])

  const active =
    tab === 'faithful'
      ? (artworks.faithful ?? artworks.rebuilt)
      : (artworks.rebuilt ?? artworks.faithful)

  const artworkTitle = useMemo(() => {
    if (plan?.title) return plan.title
    if (reference) return reference.fromSketchBoard ? '草图像素化' : '参考图像素化'
    const firstLine = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0)
    return firstLine ? firstLine.slice(0, 16) : '像素画面'
  }, [plan, reference, text])

  const html = useMemo(
    () =>
      active
        ? renderPixelHtml(active, {
            title: artworkTitle,
            description: plan?.description || text.trim(),
          })
        : '',
    [active, artworkTitle, plan, text]
  )

  const loadSource = useCallback(async (dataUrl: string): Promise<ImageData> => {
    if (imageCacheRef.current?.key === dataUrl) return imageCacheRef.current.data
    const { data } = await loadImageData(dataUrl)
    imageCacheRef.current = { key: dataUrl, data }
    return data
  }, [])

  const handleSelectFile = useCallback(
    async (file: File) => {
      setError(null)
      setNotice(null)
      setPlan(null)
      setPlanKey('')
      try {
        const dataUrl = await fileToDataUrl(file)
        const data = await loadSource(dataUrl)
        setReference({
          dataUrl,
          name: file.name || '参考图',
          width: data.width,
          height: data.height,
          fromSketchBoard: false,
        })
        setSourceImage({ key: dataUrl, data })
      } catch (err) {
        setError(toMessage(err))
      }
    },
    [loadSource]
  )

  const handleClearReference = useCallback(() => {
    setReference(null)
    setSourceImage(null)
    setPlan(null)
    setPlanKey('')
    setNotice(null)
    setError(null)
  }, [])

  /** 换种子：同一份画面规划重绘细节（云、星、浪花），构图不变 */
  const handleSeedChange = useCallback((next: number) => {
    setSeed(next)
    setPlan((current) => (current ? { ...current, seed: next } : current))
  }, [])

  const handleGenerate = useCallback(async () => {
    // 防止重复点击造成多次解析请求
    if (phase !== 'idle') return

    const currentReference = reference
    const prompt = text.trim()

    if (!currentReference && !prompt) {
      setGenerated(false)
      setError('请先填写画面描述，或上传一张参考图。')
      return
    }

    setError(null)
    setNotice(null)

    // 1) 参考图解码 + 本地保真像素化（不依赖网络，立即出结果）
    let image: ImageData | null = null
    if (currentReference) {
      setPhase('rendering')
      try {
        image = await loadSource(currentReference.dataUrl)
        setSourceImage({ key: currentReference.dataUrl, data: image })
      } catch (err) {
        setPhase('idle')
        setError(toMessage(err))
        return
      }
    }

    setGenerated(true)
    setTab(currentReference ? 'faithful' : 'rebuilt')

    // 同一输入已经有规划 → 直接复用，不重复调用 AI
    if (planKey === inputKey && plan) {
      setPhase('idle')
      return
    }

    // 2) AI 解析：描述（可附参考图）→ 画面规划
    setPhase('analyzing')
    try {
      let payload: string | undefined
      if (image) {
        payload = imageDataToDataUrl(image, ANALYZE_IMAGE_MAX_SIDE) || undefined
      }
      const result = await analyzeScene({
        prompt: prompt || undefined,
        image: payload,
        seed,
      })
      setPlan(result)
      setPlanKey(inputKey)
    } catch (err) {
      // 降级：有描述就用关键词兜底，没有描述则只保留保真像素化
      if (prompt) {
        setPlan(planFromText(prompt, seed))
        setPlanKey(inputKey)
        setNotice(`AI 画面解析不可用（${toMessage(err)}），已改用关键词兜底绘制。`)
      } else {
        setPlan(null)
        setPlanKey('')
        setNotice(`AI 画面解析不可用（${toMessage(err)}）。填写一句画面描述即可得到 AI 绘制版本。`)
      }
    } finally {
      setPhase('idle')
    }
  }, [phase, reference, text, seed, plan, planKey, inputKey, loadSource])

  const availableKinds = KINDS.filter((item) =>
    item.kind === 'faithful' ? artworks.faithful !== null : artworks.rebuilt !== null
  )
  const canGenerate = reference !== null || text.trim().length > 0

  return (
    <>
      <Seo
        title="像素工坊"
        description="用一句话描述画面，AI 解析成画面构成，再由前端渲染引擎绘制成像素画，并导出可预览的 index.html"
      />

      <Section spacing="lg" className="lofn-pixel">
        <Container size="md">
          <header className="lofn-pixel__header">
            <h1 className="lofn-pixel__title">Pixel Studio</h1>
            <p className="lofn-pixel__desc">
              一句话描述，或一张参考图 → AI 解析画面构成 → 前端逐层绘制 → index.html
            </p>
          </header>

          <Card hover={false} className="lofn-pixel__card">
            <h2 className="lofn-pixel__card-title">1. 画面描述</h2>
            <PixelControls
              text={text}
              onTextChange={setText}
              options={options}
              onOptionsChange={(patch) => setOptions((current) => ({ ...current, ...patch }))}
              seed={seed}
              onSeedChange={handleSeedChange}
              phase={phase}
              error={error}
              notice={notice}
              plan={plan}
              canGenerate={canGenerate}
              onGenerate={handleGenerate}
            />
          </Card>

          <Card hover={false} className="lofn-pixel__card">
            <h2 className="lofn-pixel__card-title">2. 参考图（可选）</h2>
            <ReferenceInput
              value={reference}
              disabled={phase !== 'idle'}
              onSelect={handleSelectFile}
              onClear={handleClearReference}
            />
            <p className="lofn-pixel__card-note">
              上传参考图后会同时给出两个版本：「保真像素化」忠实还原原图，「AI 绘制」由 AI
              读懂画面后重新构图绘制。只描述不上传图片也完全可以。
            </p>
          </Card>

          {generated && active && (
            <Card hover={false} className="lofn-pixel__card">
              <h2 className="lofn-pixel__card-title">3. 生成结果</h2>

              {availableKinds.length > 1 && (
                <div className="lofn-pixel-result__tabs" role="group" aria-label="渲染结果切换">
                  {availableKinds.map((item) => (
                    <button
                      key={item.kind}
                      type="button"
                      className="lofn-pixel-result__tab"
                      aria-pressed={tab === item.kind}
                      onClick={() => setTab(item.kind)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              <PixelArtPreview grid={active} />

              {reference && !plan && (
                <p className="lofn-pixel-result__note" role="status">
                  当前仅展示「保真像素化」。填写一句画面描述后重新生成，即可得到 AI 绘制版本。
                </p>
              )}

              <HtmlOutput html={html} title={artworkTitle} grid={active} />
            </Card>
          )}
        </Container>
      </Section>
    </>
  )
}
