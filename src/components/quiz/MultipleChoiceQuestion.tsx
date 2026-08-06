import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card } from '@/ui/Card'
import { Button } from '@/ui/Button'
import type { MultipleChoiceQuestionProps } from './types'

export function MultipleChoiceQuestion({
  question,
  options,
  correctOptionIds,
  submissionMode = 'batch',
  onSubmit,
  onChange,
  value,
  showCorrectAnswer = false,
}: MultipleChoiceQuestionProps) {
  const isBatch = submissionMode === 'batch'
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(value ?? [])
  const [submitted, setSubmitted] = useState(false)

  const selectedIds = isBatch ? (value ?? internalSelectedIds) : internalSelectedIds

  useEffect(() => {
    if (value !== undefined) {
      setInternalSelectedIds(value)
    }
  }, [value])

  const toggleOption = (id: string) => {
    if (submitted || showCorrectAnswer) return
    setInternalSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      if (isBatch) {
        onChange?.(next)
      }
      return next
    })
  }

  const handleSubmit = () => {
    if (selectedIds.length === 0 || submitted || isBatch) return
    const correct =
      selectedIds.length === correctOptionIds.length &&
      selectedIds.every((id) => correctOptionIds.includes(id))
    setSubmitted(true)
    onSubmit?.(correct)
  }

  const showState = submitted || showCorrectAnswer
  const isCorrect =
    selectedIds.length === correctOptionIds.length &&
    selectedIds.every((id) => correctOptionIds.includes(id))

  return (
    <Card hover={false} className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded-sm bg-warning/10 text-warning text-xs font-mono">
          多选
        </span>
        <h3 className="text-lg font-medium text-text-primary leading-relaxed">{question}</h3>
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id)
          const isCorrectOption = correctOptionIds.includes(option.id)

          return (
            <button
              key={option.id}
              disabled={submitted || showCorrectAnswer}
              onClick={() => toggleOption(option.id)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all duration-300',
                'hover:bg-bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-info/50',
                showState && isCorrectOption && 'border-success bg-success/10',
                showState && isSelected && !isCorrectOption && 'border-error bg-error/10',
                !showState && isSelected && 'border-info bg-info/5 ring-1 ring-info/30',
                !showState && !isSelected && 'border-border-subtle bg-bg-elevated/30'
              )}
            >
              <span
                className={cn(
                  'shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                  isSelected ? 'border-info bg-info' : 'border-border-default',
                  showState && isCorrectOption && 'border-success bg-success',
                  showState && isSelected && !isCorrectOption && 'border-error bg-error'
                )}
              >
                {isSelected && <Check size={12} className="text-white" />}
              </span>

              <span className="flex-1 text-text-primary">{option.text}</span>

              {showState && isCorrectOption && !isSelected && (
                <span className="text-xs text-success font-medium">正确答案</span>
              )}
              {showState && isSelected && !isCorrectOption && (
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
            disabled={selectedIds.length === 0}
            size="sm"
          >
            提交答案
          </Button>
        )}

        {showState && (
          <p className={cn(
            'text-sm font-medium',
            isCorrect ? 'text-success' : 'text-error'
          )}>
            {isCorrect ? '回答正确' : '回答错误'}
          </p>
        )}
      </div>
    </Card>
  )
}

export default MultipleChoiceQuestion
