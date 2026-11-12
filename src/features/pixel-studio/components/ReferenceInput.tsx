import { useEffect, useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { Button } from '@/ui/Button'
import type { ReferenceImage } from '../types'

interface ReferenceInputProps {
  value: ReferenceImage | null
  disabled?: boolean
  onSelect: (file: File) => void
  onClear: () => void
}

function pickImageFile(files: FileList | null | undefined): File | null {
  if (!files) return null
  for (const file of Array.from(files)) {
    if (file.type.startsWith('image/')) return file
  }
  return null
}

/**
 * 参考图输入：本地上传 / 拖拽 / 粘贴（⌘V），
 * 图片只在浏览器内解码，不会上传到任何服务器。
 */
export function ReferenceInput({ value, disabled = false, onSelect, onClear }: ReferenceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  // 直接粘贴图片（截图后 ⌘V 的常见操作）
  useEffect(() => {
    if (disabled) return
    const handlePaste = (event: ClipboardEvent) => {
      const file = pickImageFile(event.clipboardData?.files)
      if (!file) return
      event.preventDefault()
      onSelect(file)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [disabled, onSelect])

  const openPicker = () => inputRef.current?.click()

  return (
    <div className="lofn-pixel-input">
      <div
        className="lofn-pixel-input__drop"
        data-dragging={dragging || undefined}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (disabled) return
          const file = pickImageFile(event.dataTransfer?.files)
          if (file) onSelect(file)
        }}
      >
        {value ? (
          <>
            <img className="lofn-pixel-input__thumb" src={value.dataUrl} alt={`参考图：${value.name}`} />
            <div className="lofn-pixel-input__meta">
              <p className="lofn-pixel-input__name">{value.name}</p>
              <p className="lofn-pixel-input__size">
                {value.width} × {value.height} 像素
                {value.fromSketchBoard ? ' · 来自草图生图画板' : ''}
              </p>
              <div className="lofn-pixel-input__actions">
                <Button variant="secondary" size="sm" disabled={disabled} onClick={openPicker}>
                  更换图片
                </Button>
                <Button variant="ghost" size="sm" disabled={disabled} onClick={onClear}>
                  移除
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="lofn-pixel-input__empty">
            <ImagePlus size={22} aria-hidden="true" />
            <p className="lofn-pixel-input__tip">
              拖拽图片到这里，或
              <button
                type="button"
                className="lofn-pixel-input__link"
                disabled={disabled}
                onClick={openPicker}
              >
                选择图片
              </button>
            </p>
            <p className="lofn-pixel-input__hint">
              支持 PNG / JPG / WebP，也可以直接粘贴（Ctrl / ⌘ + V）；图片仅在本机处理
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        id="pixel-reference"
        className="lofn-pixel-input__file"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = pickImageFile(event.target.files)
          if (file) onSelect(file)
          // 允许重复选择同一个文件
          event.target.value = ''
        }}
      />
    </div>
  )
}
