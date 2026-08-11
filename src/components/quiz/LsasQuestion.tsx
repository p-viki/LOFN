import { cn } from '@/utils/cn'
import { Card } from '@/ui/Card'
import { OptionList } from './OptionList'
import type { LsasQuestionProps, LsasAnswer } from './types'

/**
 * LSAS 量表单场景：每个场景拆分为「内心体感题」与「行为应对题」两个子题。
 *
 * - 内心体感题（fear 维度）：评估该场景下的生理应激与主观感受（去术语化描述）
 * - 行为应对题（avoidance 维度）：评估为躲避该场景的实际外显行为
 *
 * 完全受控组件：不维护内部 state，选中态由 `value` 驱动。
 */
export function LsasQuestion({
  scenario,
  subscale,
  fearQuestion,
  fearOptions,
  avoidanceQuestion,
  avoidanceOptions,
  onChange,
  value,
}: LsasQuestionProps) {
  const answer: LsasAnswer = value ?? { fear: null, avoidance: null }

  const answered = answer.fear !== null && answer.avoidance !== null

  const handleFear = (id: string) => {
    onChange?.({ ...answer, fear: Number(id) })
  }

  const handleAvoidance = (id: string) => {
    onChange?.({ ...answer, avoidance: Number(id) })
  }

  return (
    <Card hover={false} className="space-y-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'shrink-0 mt-0.5 px-2 py-0.5 rounded-sm text-xs font-mono',
            subscale === 'si'
              ? 'bg-info/10 text-info'
              : 'bg-purple-500/10 text-purple-500'
          )}
        >
          {subscale === 'si' ? 'SI' : 'PS'}
        </span>
        <h3 className="text-base sm:text-lg font-medium text-text-primary leading-relaxed flex-1">
          {scenario}
        </h3>
        {/* 作答状态指示 */}
        <span
          className={cn(
            'shrink-0 text-[11px] px-1.5 py-0.5 rounded-md border mt-1',
            answered
              ? 'text-success border-success/30 bg-success/10'
              : 'text-text-tertiary border-border-subtle bg-bg-elevated'
          )}
        >
          {answered ? '已完成' : '未完成'}
        </span>
      </div>

      <div className="space-y-4">
        {/* 内心体感子题 */}
        <div className="rounded-lg border border-border-subtle bg-bg-elevated/20 p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-secondary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-info" />
              内心体感
            </p>
            {answer.fear === null && (
              <span className="text-[11px] text-warning">请选择</span>
            )}
          </div>
          <p className="text-sm text-text-primary mb-3 leading-relaxed">{fearQuestion}</p>
          <OptionList
            options={fearOptions.map((o) => ({ id: String(o.value), text: o.text }))}
            selectedId={answer.fear === null ? null : String(answer.fear)}
            onSelect={handleFear}
            layout="vertical"
          />
        </div>

        {/* 行为应对子题 */}
        <div className="rounded-lg border border-border-subtle bg-bg-elevated/20 p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-secondary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              行为应对
            </p>
            {answer.avoidance === null && (
              <span className="text-[11px] text-warning">请选择</span>
            )}
          </div>
          <p className="text-sm text-text-primary mb-3 leading-relaxed">{avoidanceQuestion}</p>
          <OptionList
            options={avoidanceOptions.map((o) => ({ id: String(o.value), text: o.text }))}
            selectedId={answer.avoidance === null ? null : String(answer.avoidance)}
            onSelect={handleAvoidance}
            layout="vertical"
          />
        </div>
      </div>
    </Card>
  )
}

export default LsasQuestion
