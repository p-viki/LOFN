import { useEffect, useState } from 'react'
import { motion, animate } from 'framer-motion'
import { CheckCircle, XCircle, MinusCircle, Trophy, Award, RotateCcw, ChevronDown } from 'lucide-react'
import type { BankScoreResult } from '../lib/scoring'

interface ScoreResultProps {
  result: BankScoreResult
  onReset?: () => void
}

/**
 * 计算结果控件：百分制环形得分 + 及格判定 + 每题得分明细
 */
export function ScoreResult({ result, onReset }: ScoreResultProps) {
  const { score, passed, passScore, correctCount, wrongCount, unansweredCount, perQuestion } = result
  const [displayScore, setDisplayScore] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  // 得分数字动画
  useEffect(() => {
    const controls = animate(0, score, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    })
    return () => controls.stop()
  }, [score])

  // 环形进度（SVG）
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - score / 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="lofn-score-result"
    >
      <div className="lofn-score-result__body">
        {/* 环形得分 */}
        <div className="lofn-score-result__ring">
          <svg width="160" height="160" viewBox="0 0 160 160" className="lofn-score-result__svg">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="var(--color-border-subtle)"
              strokeWidth="10"
            />
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#score-gradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="lofn-score-result__score-wrap">
            <span className="lofn-score-result__score">{displayScore}</span>
            <span className="lofn-score-result__score-label">/ 100 分</span>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="lofn-score-result__stats">
          <div className="lofn-score-result__title">
            {passed ? (
              <Trophy size={22} className="lofn-score-result__title-icon" />
            ) : (
              <Award size={22} className="lofn-score-result__title-icon" />
            )}
            <h2 className="lofn-score-result__title-text">
              {passed ? '恭喜通过' : '未达标'}
            </h2>
            <span className="lofn-score-result__badge" data-passed={passed}>
              及格线 {passScore} 分
            </span>
          </div>

          <div className="lofn-score-result__stat-list">
            <div className="lofn-score-result__stat">
              <span className="lofn-score-result__stat-value lofn-score-result__stat-value--correct">
                <CheckCircle size={14} />
                <span>{correctCount}</span>
              </span>
              <span className="lofn-score-result__stat-label">正确</span>
            </div>
            <div className="lofn-score-result__stat">
              <span className="lofn-score-result__stat-value lofn-score-result__stat-value--wrong">
                <XCircle size={14} />
                <span>{wrongCount}</span>
              </span>
              <span className="lofn-score-result__stat-label">错误</span>
            </div>
            <div className="lofn-score-result__stat">
              <span className="lofn-score-result__stat-value lofn-score-result__stat-value--empty">
                <MinusCircle size={14} />
                <span>{unansweredCount}</span>
              </span>
              <span className="lofn-score-result__stat-label">未答</span>
            </div>
          </div>

          <p className="lofn-score-result__summary">
            得分 {result.earned} / {result.total}
          </p>

          {onReset && <ButtonReset onReset={onReset} />}
        </div>
      </div>

      {/* 每题明细 */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="lofn-score-result__details-toggle"
        data-open={showDetails || undefined}
      >
        每题得分明细
        <ChevronDown size={16} className="lofn-score-result__details-icon" />
      </button>

      {showDetails && (
        <div className="lofn-score-result__details">
          {perQuestion.map((s) => {
            const state = s.correct && s.answered ? 'correct' : s.answered ? 'wrong' : 'empty'
            return (
              <div key={s.index} className="lofn-score-result__detail">
                <span className="lofn-score-result__detail-icon" data-state={state}>
                  {s.answered
                    ? s.correct
                      ? <CheckCircle size={14} />
                      : <XCircle size={14} />
                    : <MinusCircle size={14} />}
                </span>
                <span className="lofn-score-result__detail-index">第 {s.index + 1} 题</span>
                <span className="lofn-score-result__detail-score">
                  {s.earned} / {s.total}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

function ButtonReset({ onReset }: { onReset: () => void }) {
  return (
    <button onClick={onReset} className="lofn-score-result__reset">
      <RotateCcw size={14} /> 重新测试
    </button>
  )
}

export default ScoreResult
