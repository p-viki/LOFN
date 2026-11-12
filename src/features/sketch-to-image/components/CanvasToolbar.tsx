import { Minus, Plus, Redo2, Sparkles, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/ui/Button'

/** 画笔粗细档位（px） */
const BRUSH_SIZES = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32]

/** 画笔颜色：深色笔迹在白底上最适合作为 AI 输入，另提供几种常用颜色 */
const BRUSH_COLORS = [
  { value: '#0f172a', label: '黑色' },
  { value: '#2563eb', label: '蓝色' },
  { value: '#dc2626', label: '红色' },
  { value: '#16a34a', label: '绿色' },
]

interface CanvasToolbarProps {
  brushSize: number
  brushColor: string
  canUndo: boolean
  canRedo: boolean
  canClear: boolean
  canSendToStudio: boolean
  onBrushSizeChange: (size: number) => void
  onBrushColorChange: (color: string) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  /** 把当前画板内容带去「像素工坊」作为参考图 */
  onSendToStudio: () => void
}

export function CanvasToolbar({
  brushSize,
  brushColor,
  canUndo,
  canRedo,
  canClear,
  canSendToStudio,
  onBrushSizeChange,
  onBrushColorChange,
  onUndo,
  onRedo,
  onClear,
  onSendToStudio,
}: CanvasToolbarProps) {
  const currentIndex = Math.max(0, BRUSH_SIZES.indexOf(brushSize))
  const canDecrease = currentIndex > 0
  const canIncrease = currentIndex < BRUSH_SIZES.length - 1

  return (
    <div className="lofn-sketch-toolbar">
      <div className="lofn-sketch-toolbar__group">
        <span className="lofn-sketch-toolbar__label">画笔</span>

        <div className="lofn-sketch-toolbar__colors" role="group" aria-label="画笔颜色">
          {BRUSH_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              className="lofn-sketch-toolbar__color"
              style={{ backgroundColor: color.value }}
              aria-label={`画笔颜色：${color.label}`}
              aria-pressed={brushColor === color.value}
              onClick={() => onBrushColorChange(color.value)}
            />
          ))}
        </div>

        <div className="lofn-sketch-toolbar__size">
          <Button
            variant="icon"
            size="sm"
            aria-label="减小画笔"
            disabled={!canDecrease}
            onClick={() => onBrushSizeChange(BRUSH_SIZES[currentIndex - 1])}
          >
            <Minus size={16} />
          </Button>
          <span className="lofn-sketch-toolbar__size-value" aria-live="polite">
            {brushSize}px
          </span>
          <Button
            variant="icon"
            size="sm"
            aria-label="增大画笔"
            disabled={!canIncrease}
            onClick={() => onBrushSizeChange(BRUSH_SIZES[currentIndex + 1])}
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>

      <div className="lofn-sketch-toolbar__group">
        <Button
          variant="ghost"
          size="sm"
          aria-label="发送到像素工坊"
          disabled={!canSendToStudio}
          onClick={onSendToStudio}
        >
          <Sparkles size={16} />
          <span className="lofn-sketch-toolbar__action-text">像素工坊</span>
        </Button>
        <Button variant="ghost" size="sm" aria-label="撤销上一笔" disabled={!canUndo} onClick={onUndo}>
          <Undo2 size={16} />
          <span className="lofn-sketch-toolbar__action-text">撤销</span>
        </Button>
        <Button variant="ghost" size="sm" aria-label="重做" disabled={!canRedo} onClick={onRedo}>
          <Redo2 size={16} />
          <span className="lofn-sketch-toolbar__action-text">重做</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          aria-label="清空画板"
          disabled={!canClear}
          onClick={onClear}
        >
          <Trash2 size={16} />
          <span className="lofn-sketch-toolbar__action-text">清空</span>
        </Button>
      </div>
    </div>
  )
}
