import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowUp, ArrowDown, Check, X, GripVertical } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card } from '@/ui/Card'
import { Button } from '@/ui/Button'
import type { OrderingQuestionProps } from './types'

interface SortableItemProps {
  id: string
  index: number
  item: { id: string; text: string }
  isCorrectPosition: boolean
  isWrongPosition: boolean
  showState: boolean
  onButtonMove: (index: number, direction: -1 | 1) => void
  isFirst: boolean
  isLast: boolean
}

function SortableItem({
  id,
  index,
  item,
  isCorrectPosition,
  isWrongPosition,
  showState,
  onButtonMove,
  isFirst,
  isLast,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: showState })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    touchAction: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 min-h-[52px] rounded-lg border transition-all duration-200',
        'select-none touch-none',
        showState && isCorrectPosition && 'border-success bg-success/10',
        showState && isWrongPosition && 'border-error bg-error/10',
        !showState && 'border-border-subtle bg-bg-elevated/30',
        !showState && !isDragging && 'hover:bg-bg-elevated/60',
        !showState && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-90 shadow-xl ring-2 ring-info/40 bg-bg-surface'
      )}
    >
      <span
        {...attributes}
        {...listeners}
        className={cn(
          'shrink-0 text-text-tertiary p-1.5 -m-1.5 rounded',
          'min-w-[36px] min-h-[36px] flex items-center justify-center',
          !showState && 'cursor-grab active:cursor-grabbing touch-none'
        )}
      >
        <GripVertical size={18} />
      </span>

      <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-bg-elevated text-xs font-mono text-text-secondary">
        {index + 1}
      </span>

      <span className={cn(
        'flex-1 text-text-primary',
        showState && isWrongPosition && 'text-error'
      )}>
        {item.text}
      </span>

      {!showState && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onButtonMove(index, -1)}
            disabled={isFirst}
            className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="上移"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={() => onButtonMove(index, 1)}
            disabled={isLast}
            className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="下移"
          >
            <ArrowDown size={16} />
          </button>
        </div>
      )}

      {showState && (
        <span className="shrink-0 text-xs font-mono">
          {isCorrectPosition ? (
            <Check size={18} className="text-success" />
          ) : (
            <X size={18} className="text-error" />
          )}
        </span>
      )}
    </div>
  )
}

export function OrderingQuestion({
  question,
  items,
  correctOrder,
  submissionMode = 'batch',
  onSubmit,
  onChange,
  value,
  showCorrectAnswer = false,
}: OrderingQuestionProps) {
  const isBatch = submissionMode === 'batch'
  const initialOrder = useMemo(() => {
    if (value && value.length === items.length) return value
    return items.map((item) => item.id)
  }, [items, value])

  const [internalOrder, setInternalOrder] = useState<string[]>(initialOrder)
  const [submitted, setSubmitted] = useState(false)

  const order = isBatch ? (value ?? internalOrder) : internalOrder
  const showState = submitted || showCorrectAnswer
  const correct = order.every((id, index) => id === correctOrder[index])

  useEffect(() => {
    if (value !== undefined) {
      setInternalOrder(value)
    }
  }, [value])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = order.indexOf(String(active.id))
    const newIndex = order.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    const next = arrayMove(order, oldIndex, newIndex)
    setInternalOrder(next)
    if (isBatch) {
      onChange?.(next)
    }
  }

  const handleButtonMove = useCallback((index: number, direction: -1 | 1) => {
    if (showState) return
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= order.length) return
    setInternalOrder((prev) => {
      const next = arrayMove(prev, index, newIndex)
      if (isBatch) {
        onChange?.(next)
      }
      return next
    })
  }, [order.length, isBatch, onChange, showState])

  const handleSubmit = () => {
    if (submitted || isBatch) return
    setSubmitted(true)
    onSubmit?.(order)
  }

  return (
    <Card hover={false} className="space-y-4 md:space-y-6">
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded-sm bg-purple-500/10 text-purple-500 text-xs font-mono">
          排序
        </span>
        <h3 className="text-base sm:text-lg font-medium text-text-primary leading-relaxed">
          {question}
        </h3>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={order}
          strategy={verticalListSortingStrategy}
          disabled={showState}
        >
          <div className="space-y-2">
            {order.map((id, index) => {
              const item = items.find((x) => x.id === id)!
              return (
                <SortableItem
                  key={id}
                  id={id}
                  index={index}
                  item={item}
                  isCorrectPosition={id === correctOrder[index]}
                  isWrongPosition={showState && id !== correctOrder[index]}
                  showState={showState}
                  onButtonMove={handleButtonMove}
                  isFirst={index === 0}
                  isLast={index === order.length - 1}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {!showState && (
        <p className="text-xs text-text-tertiary flex items-center gap-1.5">
          <GripVertical size={14} /> 拖拽项目或点击上下按钮调整顺序
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        {!isBatch && !submitted && !showCorrectAnswer && (
          <Button
            onClick={handleSubmit}
            size="sm"
          >
            提交答案
          </Button>
        )}

        {showState && (
          <p className={cn(
            'text-sm font-medium',
            correct ? 'text-success' : 'text-error'
          )}>
            {correct ? '排序正确' : '排序错误'}
          </p>
        )}
      </div>
    </Card>
  )
}

export default OrderingQuestion
