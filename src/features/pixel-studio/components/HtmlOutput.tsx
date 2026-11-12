import { useCallback, useEffect, useState } from 'react'
import { Check, ClipboardCopy, Code2, Download, Eye, ImageDown } from 'lucide-react'
import { Button } from '@/ui/Button'
import { copyText, downloadDataUrl, downloadText } from '../lib/download'
import { pixelGridToDataUrl } from '../lib/image'
import type { PixelGrid } from '../types'

interface HtmlOutputProps {
  html: string
  title: string
  grid: PixelGrid
}

/** 导出的 PNG 放大倍数 */
const PNG_SCALE = 8

type Tab = 'preview' | 'code'

/** index.html 产物：可预览、可看源码、可复制/下载 */
export function HtmlOutput({ html, title, grid }: HtmlOutputProps) {
  const [tab, setTab] = useState<Tab>('preview')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCopied(false)
  }, [html])

  const handleCopy = useCallback(async () => {
    const ok = await copyText(html)
    if (!ok) {
      setError('复制失败，请手动选择源码复制。')
      return
    }
    setError(null)
    setCopied(true)
  }, [html])

  const handleDownloadPng = useCallback(() => {
    const dataUrl = pixelGridToDataUrl(grid, PNG_SCALE)
    if (!dataUrl) {
      setError('导出 PNG 失败，请重试。')
      return
    }
    setError(null)
    downloadDataUrl('pixel-art.png', dataUrl)
  }, [grid])

  return (
    <div className="lofn-pixel-html">
      <div className="lofn-pixel-html__head">
        <div className="lofn-pixel-html__tabs" role="group" aria-label="index.html 查看方式">
          <button
            type="button"
            className="lofn-pixel-html__tab"
            aria-pressed={tab === 'preview'}
            onClick={() => setTab('preview')}
          >
            <Eye size={14} aria-hidden="true" />
            预览
          </button>
          <button
            type="button"
            className="lofn-pixel-html__tab"
            aria-pressed={tab === 'code'}
            onClick={() => setTab('code')}
          >
            <Code2 size={14} aria-hidden="true" />
            源码
          </button>
        </div>
        <p className="lofn-pixel-html__meta">
          index.html · {(html.length / 1024).toFixed(1)} KB · 自包含，无外部依赖
        </p>
      </div>

      {tab === 'preview' ? (
        // 产物内含内联脚本，必须用 sandbox 隔离运行
        <iframe
          className="lofn-pixel-html__frame"
          title={`${title} 的 index.html 预览`}
          srcDoc={html}
          sandbox="allow-scripts allow-downloads"
          loading="lazy"
        />
      ) : (
        <pre className="lofn-pixel-html__code">
          <code>{html}</code>
        </pre>
      )}

      {error && (
        <p className="lofn-pixel-html__error" role="alert">
          {error}
        </p>
      )}

      <div className="lofn-pixel-html__actions">
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? <Check size={16} aria-hidden="true" /> : <ClipboardCopy size={16} aria-hidden="true" />}
          <span>{copied ? '已复制' : '复制代码'}</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => downloadText('index.html', html)}
        >
          <Download size={16} aria-hidden="true" />
          <span>下载 index.html</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDownloadPng}>
          <ImageDown size={16} aria-hidden="true" />
          <span>下载 PNG</span>
        </Button>
      </div>
    </div>
  )
}
