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
    <div
      className={cn(
        layout === 'vertical' ? 'space-y-2.5 md:space-y-3' : 'grid grid-cols-2 xs:grid-cols-4 gap-2',
        className
      )}
    >
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
            className={cn(
              'flex items-center text-left transition-all duration-300',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-info/50',
              'active:scale-[0.99]',
              layout === 'vertical'
                ? 'w-full gap-3 md:gap-4 p-3.5 md:p-4 min-h-[52px] rounded-lg border'
                : 'justify-center gap-1.5 px-2 py-2.5 min-h-[44px] rounded-lg border text-sm text-center',
              'hover:bg-bg-elevated',
              showState && isCorrect && 'border-success bg-success/10',
              isWrongPick && 'border-error bg-error/10',
              !showState && isSelected && 'border-info bg-info/5 ring-1 ring-info/30',
              !showState && !isSelected && 'border-border-subtle bg-bg-elevated/30'
            )}
          >
            {layout === 'vertical' && (
              <span
                className={cn(
                  'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  isSelected ? 'border-info' : 'border-border-default',
                  showState && isCorrect && 'border-success',
                  isWrongPick && 'border-error'
                )}
              >
                {isSelected && (
                  <span
                    className={cn(
                      'w-2.5 h-2.5 rounded-full',
                      showState && isCorrect ? 'bg-success' : 'bg-info',
                      isWrongPick && 'bg-error'
                    )}
                  />
                )}
              </span>
            )}

            <span className={cn('flex-1 text-text-primary', layout === 'vertical' && 'flex-1')}>
              {option.text}
            </span>

            {showState && isCorrect && <Check size={18} className="shrink-0 text-success" />}
            {isWrongPick && <X size={18} className="shrink-0 text-error" />}
          </button>
        )
      })}
    </div>
  )
}

export default OptionList
