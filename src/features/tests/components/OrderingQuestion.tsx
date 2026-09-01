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
      className="lofn-ordering-item"
      data-show-state={showState || undefined}
      data-correct={isCorrectPosition || undefined}
      data-wrong={isWrongPosition || undefined}
      data-dragging={isDragging || undefined}
    >
      <span
        {...attributes}
        {...listeners}
        className="lofn-ordering-item__handle"
      >
        <GripVertical size={18} />
      </span>

      <span className="lofn-ordering-item__index">{index + 1}</span>

      <span className="lofn-ordering-item__text">{item.text}</span>

      {!showState && (
        <div className="lofn-ordering-item__controls">
          <button
            onClick={() => onButtonMove(index, -1)}
            disabled={isFirst}
            className="lofn-ordering-item__control"
            aria-label="上移"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={() => onButtonMove(index, 1)}
            disabled={isLast}
            className="lofn-ordering-item__control"
            aria-label="下移"
          >
            <ArrowDown size={16} />
          </button>
        </div>
      )}

      {showState && (
        <span className="lofn-ordering-item__status">
          {isCorrectPosition ? (
            <Check size={18} className="lofn-ordering-item__status-icon lofn-ordering-item__status-icon--correct" />
          ) : (
            <X size={18} className="lofn-ordering-item__status-icon lofn-ordering-item__status-icon--wrong" />
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
    <Card hover={false} className="lofn-question-ordering">
      <div className="lofn-question-ordering__header">
        <span className="lofn-question-ordering__badge">排序</span>
        <h3 className="lofn-question-ordering__title">{question}</h3>
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
          <div className="lofn-question-ordering__items">
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
        <p className="lofn-question-ordering__hint">
          <GripVertical size={14} /> 拖拽项目或点击上下按钮调整顺序
        </p>
      )}

      <div className="lofn-question-ordering__footer">
        {!isBatch && !submitted && !showCorrectAnswer && (
          <Button onClick={handleSubmit} size="sm">
            提交答案
          </Button>
        )}

        {showState && (
          <p className="lofn-question-ordering__result" data-correct={correct}>
            {correct ? '排序正确' : '排序错误'}
          </p>
        )}
      </div>
    </Card>
  )
}

export default OrderingQuestion
