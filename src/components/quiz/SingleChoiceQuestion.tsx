import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card } from '@/ui/Card'
import { Button } from '@/ui/Button'
import type { SingleChoiceQuestionProps } from './types'

export function SingleChoiceQuestion({
  question,
  options,
  correctOptionId,
  submissionMode = 'batch',
  onSubmit,
  onChange,
  value,
  showCorrectAnswer = false,
}: SingleChoiceQuestionProps) {
  const isBatch = submissionMode === 'batch'
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(value ?? null)
  const [submitted, setSubmitted] = useState(false)

  const selectedId = isBatch ? (value ?? internalSelectedId) : internalSelectedId

  useEffect(() => {
    if (value !== undefined) {
      setInternalSelectedId(value)
    }
  }, [value])

  const handleSelect = (id: string) => {
    if (submitted) return
    setInternalSelectedId(id)
    if (isBatch) {
      onChange?.(id)
    }
  }

  const handleSubmit = () => {
    if (!selectedId || submitted || isBatch) return
    const correct = selectedId === correctOptionId
    setSubmitted(true)
    onSubmit?.(correct)
  }

  const showState = submitted || showCorrectAnswer

  return (
    <Card hover={false} className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded-sm bg-info/10 text-info text-xs font-mono">
          单选
        </span>
        <h3 className="text-lg font-medium text-text-primary leading-relaxed">{question}</h3>
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedId === option.id
          const isCorrect = option.id === correctOptionId

          return (
            <button
              key={option.id}
              disabled={submitted || showCorrectAnswer}
              onClick={() => handleSelect(option.id)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all duration-300',
                'hover:bg-bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-info/50',
                showState && isCorrect && 'border-success bg-success/10',
                showState && isSelected && !isCorrect && 'border-error bg-error/10',
                !showState && isSelected && 'border-info bg-info/5 ring-1 ring-info/30',
                !showState && !isSelected && 'border-border-subtle bg-bg-elevated/30'
              )}
            >
              <span
                className={cn(
                  'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  isSelected ? 'border-info' : 'border-border-default',
                  showState && isCorrect && 'border-success',
                  showState && isSelected && !isCorrect && 'border-error'
                )}
              >
                {isSelected && (
                  <span className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    showState && isCorrect ? 'bg-success' : 'bg-info',
                    showState && isSelected && !isCorrect && 'bg-error'
                  )} />
                )}
              </span>

              <span className="flex-1 text-text-primary">{option.text}</span>

              {showState && isCorrect && (
                <Check size={18} className="shrink-0 text-success" />
              )}
              {showState && isSelected && !isCorrect && (
                <X size={18} className="shrink-0 text-error" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        {!isBatch && !submitted && !showCorrectAnswer && (
          <Button
            onClick={handleSubmit}
            disabled={!selectedId}
            size="sm"
          >
            提交答案
          </Button>
        )}

        {showState && (
          <p className={cn(
            'text-sm font-medium',
            selectedId === correctOptionId ? 'text-success' : 'text-error'
          )}>
            {selectedId === correctOptionId ? '回答正确' : '回答错误'}
          </p>
        )}
      </div>
    </Card>
  )
}

export default SingleChoiceQuestion
