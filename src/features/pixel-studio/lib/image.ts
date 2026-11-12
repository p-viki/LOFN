/** 图片读取与导出：全部在浏览器本地完成，图片不会上传到任何服务器 */

import type { PixelGrid } from '../types'
import { hexToRgb } from './color'

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('读取图片失败，请重试。'))
    reader.readAsDataURL(file)
  })
}

export function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片解析失败，请换一张图片重试。'))
    image.src = dataUrl
  })
}

/** 解码为 ImageData；透明区域先合成到白底，与像素化的取色规则保持一致 */
export async function loadImageData(
  dataUrl: string
): Promise<{ image: HTMLImageElement; data: ImageData }> {
  const image = await loadImageElement(dataUrl)
  const canvas = createCanvas(image.naturalWidth, image.naturalHeight)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器不支持 Canvas 2D，无法进行像素化。')

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0)

  return { image, data: context.getImageData(0, 0, canvas.width, canvas.height) }
}

/** 把参考图缩到最长边 maxSide 的 PNG，用于送给视觉模型（省 token、避免超大图） */
export function imageDataToDataUrl(image: ImageData, maxSide: number): string {
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const source = createCanvas(image.width, image.height)
  const sourceContext = source.getContext('2d')
  if (!sourceContext) return ''
  sourceContext.putImageData(image, 0, 0)

  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')
  if (!context) return ''
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.drawImage(source, 0, 0, width, height)

  return canvas.toDataURL('image/png')
}

/** 像素画 → PNG data URL（整数倍放大，保持硬边） */
export function pixelGridToDataUrl(grid: PixelGrid, scale = 8): string {
  const source = createCanvas(grid.width, grid.height)
  const sourceContext = source.getContext('2d')
  if (!sourceContext) return ''

  const image = sourceContext.createImageData(grid.width, grid.height)
  for (let i = 0; i < grid.indices.length; i += 1) {
    const color = hexToRgb(grid.palette[grid.indices[i]] ?? '#000000')
    image.data[i * 4] = color[0]
    image.data[i * 4 + 1] = color[1]
    image.data[i * 4 + 2] = color[2]
    image.data[i * 4 + 3] = 255
  }
  sourceContext.putImageData(image, 0, 0)

  const canvas = createCanvas(grid.width * scale, grid.height * scale)
  const context = canvas.getContext('2d')
  if (!context) return ''
  context.imageSmoothingEnabled = false
  context.drawImage(source, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/png')
}
