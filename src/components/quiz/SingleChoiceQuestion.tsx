import { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { Card } from '@/ui/Card'
import { Button } from '@/ui/Button'
import { OptionList } from './OptionList'
import type { SingleChoiceQuestionProps } from './types'

export function SingleChoiceQuestion({
  question,
  options,
  correctOptionId,
  badge = '单选',
  submissionMode = 'batch',
  onSubmit,
  onChange,
  value,
  showCorrectAnswer = false,
}: SingleChoiceQuestionProps) {
  const isBatch = submissionMode === 'batch'
  /** 是否为纯选择模式（自评量表等无标准答案场景） */
  const isPureChoice = correctOptionId === undefined
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
    setSubmitted(true)
    onSubmit?.(selectedId)
  }

  // 纯选择模式下永不显示对错
  const showState = !isPureChoice && (submitted || showCorrectAnswer)

  return (
    <Card hover={false} className="space-y-4 md:space-y-6">
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded-sm bg-info/10 text-info text-xs font-mono">
          {badge}
        </span>
        <h3 className="text-base sm:text-lg font-medium text-text-primary leading-relaxed">
          {question}
        </h3>
      </div>

      <OptionList
        options={options}
        selectedId={selectedId}
        onSelect={handleSelect}
        disabled={submitted || showCorrectAnswer}
        showState={showState}
        correctId={correctOptionId}
      />

      <div className="flex items-center justify-between pt-2">
        {!isPureChoice && !isBatch && !submitted && !showCorrectAnswer && (
          <Button onClick={handleSubmit} disabled={!selectedId} size="sm">
            提交答案
          </Button>
        )}

        {showState && (
          <p
            className={cn(
              'text-sm font-medium',
              selectedId === correctOptionId ? 'text-success' : 'text-error'
            )}
          >
            {selectedId === correctOptionId ? '回答正确' : '回答错误'}
          </p>
        )}
      </div>
    </Card>
  )
}

export default SingleChoiceQuestion
