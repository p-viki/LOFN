import { Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Option } from './types'

interface OptionListProps {
  options: Option[]
  selectedId: string | null
  onSelect: (id: string) => void
  disabled?: boolean
  /** 是否显示对错状态（需要 correctId） */
  showState?: boolean
  /** 正确选项 id（showState 时使用） */
  correctId?: string | null
  /** vertical = 纵向全宽列表（默认）；horizontal = 横向等分按钮（如等级量表） */
  layout?: 'vertical' | 'horizontal'
  className?: string
}

/**
 * 通用选项选择列表。
 * 单选、多选、量表等需要"点选选项"的场景复用；对错高亮逻辑内置。
 */
export function OptionList({
  options,
  selectedId,
  onSelect,
  disabled = false,
  showState = false,
  correctId,
  layout = 'vertical',
  className,
}: OptionListProps) {
  return (
    <div className={cn('lofn-option-list', `lofn-option-list--${layout}`, className)}>
      {options.map((option) => {
        const isSelected = selectedId === option.id
        const isCorrect = option.id === correctId
        const isWrongPick = showState && isSelected && !isCorrect

        return (
          <button
            key={option.id}
            disabled={disabled}
            onClick={() => onSelect(option.id)}
            aria-pressed={isSelected}
            className="lofn-option-item"
            data-layout={layout}
            data-selected={isSelected || undefined}
            data-correct={isCorrect || undefined}
            data-wrong={isWrongPick || undefined}
            data-show-state={showState || undefined}
          >
            {layout === 'vertical' && (
              <span className="lofn-option-item__radio">
                {isSelected && (
                  <span
                    className="lofn-option-item__radio-dot"
                    data-correct={isCorrect || undefined}
                    data-wrong={isWrongPick || undefined}
                  />
                )}
              </span>
            )}

            <span className="lofn-option-item__text">{option.text}</span>

            {showState && isCorrect && <Check size={18} className="lofn-option-item__mark lofn-option-item__mark--correct" />}
            {isWrongPick && <X size={18} className="lofn-option-item__mark lofn-option-item__mark--wrong" />}
          </button>
        )
      })}
    </div>
  )
}

export default OptionList
