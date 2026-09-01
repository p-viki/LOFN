import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
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
    setSubmitted(true)
    onSubmit?.(selectedIds)
  }

  const showState = submitted || showCorrectAnswer
  const isCorrect =
    selectedIds.length === correctOptionIds.length &&
    selectedIds.every((id) => correctOptionIds.includes(id))

  return (
    <Card hover={false} className="lofn-question-multiple">
      <div className="lofn-question-multiple__header">
        <span className="lofn-question-multiple__badge">多选</span>
        <h3 className="lofn-question-multiple__title">{question}</h3>
      </div>

      <div className="lofn-question-multiple__options">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id)
          const isCorrectOption = correctOptionIds.includes(option.id)

          return (
            <button
              key={option.id}
              disabled={submitted || showCorrectAnswer}
              onClick={() => toggleOption(option.id)}
              className="lofn-option-item"
              data-selected={isSelected || undefined}
              data-correct={isCorrectOption || undefined}
              data-wrong={(showState && isSelected && !isCorrectOption) || undefined}
              data-show-state={showState || undefined}
            >
              <span className="lofn-option-item__checkbox">
                {isSelected && <Check size={12} />}
              </span>

              <span className="lofn-option-item__text">{option.text}</span>

              {showState && isCorrectOption && !isSelected && (
                <span className="lofn-option-item__meta">正确答案</span>
              )}
              {showState && isSelected && !isCorrectOption && (
                <X size={18} className="lofn-option-item__meta lofn-option-item__meta--wrong" />
              )}
            </button>
          )
        })}
      </div>

      <div className="lofn-question-multiple__footer">
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
          <p className="lofn-question-multiple__result" data-correct={isCorrect}>
            {isCorrect ? '回答正确' : '回答错误'}
          </p>
        )}
      </div>
    </Card>
  )
}

export default MultipleChoiceQuestion
