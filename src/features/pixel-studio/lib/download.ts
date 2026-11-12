/** 下载与复制：仅使用浏览器标准能力 */

export function downloadText(
  filename: string,
  text: string,
  mime = 'text/html;charset=utf-8'
): void {
  downloadBlob(filename, new Blob([text], { type: mime }))
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  triggerDownload(filename, url)
  // 等浏览器读取完再释放
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadDataUrl(filename: string, dataUrl: string): void {
  if (!dataUrl) return
  triggerDownload(filename, dataUrl)
}

function triggerDownload(filename: string, href: string): void {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

/** 复制到剪贴板；剪贴板 API 不可用（非 HTTPS 等）时退化为 execCommand */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 继续尝试退化方案
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '-1000px'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}
