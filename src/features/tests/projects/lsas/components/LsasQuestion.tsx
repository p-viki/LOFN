import { Card } from '@/ui/Card'
import { OptionList } from '../../../components/OptionList'
import type { LsasQuestionProps, LsasAnswer } from '../types'

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
    <Card hover={false} className="lofn-question-lsas">
      <div className="lofn-question-lsas__header">
        <span className="lofn-question-lsas__badge" data-subscale={subscale}>
          {subscale === 'si' ? 'SI' : 'PS'}
        </span>
        <h3 className="lofn-question-lsas__title">{scenario}</h3>
        {/* 作答状态指示 */}
        <span className="lofn-question-lsas__status" data-answered={answered}>
          {answered ? '已完成' : '未完成'}
        </span>
      </div>

      <div className="lofn-question-lsas__subs">
        {/* 内心体感子题 */}
        <div className="lofn-question-sub lofn-question-sub--fear">
          <div className="lofn-question-sub__header">
            <p className="lofn-question-sub__label" data-type="fear">
              内心体感
            </p>
            {answer.fear === null && (
              <span className="lofn-question-sub__required">请选择</span>
            )}
          </div>
          <p className="lofn-question-sub__question">{fearQuestion}</p>
          <OptionList
            options={fearOptions.map((o) => ({ id: String(o.value), text: o.text }))}
            selectedId={answer.fear === null ? null : String(answer.fear)}
            onSelect={handleFear}
            layout="vertical"
          />
        </div>

        {/* 行为应对子题 */}
        <div className="lofn-question-sub lofn-question-sub--avoidance">
          <div className="lofn-question-sub__header">
            <p className="lofn-question-sub__label" data-type="avoidance">
              行为应对
            </p>
            {answer.avoidance === null && (
              <span className="lofn-question-sub__required">请选择</span>
            )}
          </div>
          <p className="lofn-question-sub__question">{avoidanceQuestion}</p>
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
