import { useState, useEffect } from 'react'
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
    <Card hover={false} className="lofn-question-single">
      <div className="lofn-question-single__header">
        <span className="lofn-question-single__badge">{badge}</span>
        <h3 className="lofn-question-single__title">{question}</h3>
      </div>

      <OptionList
        options={options}
        selectedId={selectedId}
        onSelect={handleSelect}
        disabled={submitted || showCorrectAnswer}
        showState={showState}
        correctId={correctOptionId}
      />

      <div className="lofn-question-single__footer">
        {!isPureChoice && !isBatch && !submitted && !showCorrectAnswer && (
          <Button onClick={handleSubmit} disabled={!selectedId} size="sm">
            提交答案
          </Button>
        )}

        {showState && (
          <p
            className="lofn-question-single__result"
            data-correct={selectedId === correctOptionId}
          >
            {selectedId === correctOptionId ? '回答正确' : '回答错误'}
          </p>
        )}
      </div>
    </Card>
  )
}

export default SingleChoiceQuestion
