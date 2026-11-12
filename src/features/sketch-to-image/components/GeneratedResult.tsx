import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'

interface GeneratedResultProps {
  imageUrl: string
  busy: boolean
  /** 非阻塞说明，例如当前返回的是占位图 */
  notice: string | null
  onRegenerate: () => void
}

export function GeneratedResult({ imageUrl, busy, notice, onRegenerate }: GeneratedResultProps) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  /**
   * 下载图片。
   * 生成结果可能是跨域地址，直接用 <a download> 无效，
   * 因此先取回 blob 再触发浏览器下载。
   */
  const handleDownload = async () => {
    setDownloadError(null)
    setDownloading(true)
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error(`Failed to download: ${response.status}`)

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      // 出图服务可能返回 jpeg / svg（占位图），按实际 MIME 决定扩展名
      const extension = blob.type.includes('jpeg')
        ? 'jpg'
        : blob.type.includes('svg')
          ? 'svg'
          : 'png'
      link.download = `sketch-to-image-${Date.now()}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      setDownloadError('下载失败，可右键图片选择「图片另存为」。')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card hover={false} className="lofn-sketch-result">
      <h2 className="lofn-sketch-result__title">生成结果</h2>

      {notice && (
        <p className="lofn-sketch-result__notice" role="status">
          {notice}
        </p>
      )}

      <div className="lofn-sketch-result__frame">
        <img className="lofn-sketch-result__image" src={imageUrl} alt="根据草图生成的图片" />
      </div>

      {downloadError && (
        <p className="lofn-sketch-result__error" role="alert">
          {downloadError}
        </p>
      )}

      <div className="lofn-sketch-result__actions">
        <Button variant="secondary" disabled={busy} onClick={onRegenerate}>
          <RefreshCw size={16} />
          重新生成
        </Button>
        <Button variant="secondary" disabled={downloading} onClick={handleDownload}>
          <Download size={16} />
          {downloading ? '下载中…' : '下载图片'}
        </Button>
      </div>
    </Card>
  )
}
