import { useEffect, useRef } from 'react'
import { hexToRgb } from '../lib/color'
import type { PixelGrid } from '../types'

interface PixelArtPreviewProps {
  grid: PixelGrid
}

/** 预览最大显示宽度：按整数倍放大，避免像素边界被插值糊掉 */
const MAX_DISPLAY_WIDTH = 560

/** 像素画预览：以 1:1 像素绘制到 canvas，再用 CSS 放大（image-rendering: pixelated） */
export function PixelArtPreview({ grid }: PixelArtPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = grid.width
    canvas.height = grid.height

    const context = canvas.getContext('2d')
    if (!context) return

    const image = context.createImageData(grid.width, grid.height)
    for (let i = 0; i < grid.indices.length; i += 1) {
      const color = hexToRgb(grid.palette[grid.indices[i]] ?? '#000000')
      image.data[i * 4] = color[0]
      image.data[i * 4 + 1] = color[1]
      image.data[i * 4 + 2] = color[2]
      image.data[i * 4 + 3] = 255
    }
    context.putImageData(image, 0, 0)
  }, [grid])

  const zoom = Math.max(1, Math.floor(MAX_DISPLAY_WIDTH / grid.width))

  return (
    <div className="lofn-pixel-preview">
      <div className="lofn-pixel-preview__frame">
        <canvas
          ref={canvasRef}
          className="lofn-pixel-preview__canvas"
          style={{ maxWidth: `${grid.width * zoom}px` }}
          role="img"
          aria-label={`像素画预览：${grid.width} × ${grid.height} 像素，${grid.palette.length} 色`}
        />
      </div>
      <p className="lofn-pixel-preview__meta">
        {grid.width} × {grid.height} 像素 · {grid.palette.length} 色调色板 · 显示放大 {zoom}×
      </p>
    </div>
  )
}
