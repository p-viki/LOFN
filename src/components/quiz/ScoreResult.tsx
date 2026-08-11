import { useEffect, useState } from 'react'
import { motion, animate } from 'framer-motion'
import { CheckCircle, XCircle, MinusCircle, Trophy, Award, RotateCcw, ChevronDown } from 'lucide-react'
import type { BankScoreResult } from '@/lib/scoring'
import { cn } from '@/utils/cn'

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
      className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-5 sm:p-8">
        {/* 环形得分 */}
        <div className="relative shrink-0 mx-auto sm:mx-0">
          <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold text-text-primary font-mono">
              {displayScore}
            </span>
            <span className="text-xs text-text-tertiary mt-0.5">/ 100 分</span>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
            {passed ? (
              <Trophy size={22} className="text-success" />
            ) : (
              <Award size={22} className="text-warning" />
            )}
            <h2 className="text-xl font-semibold text-text-primary">
              {passed ? '恭喜通过' : '未达标'}
            </h2>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-md border',
                passed
                  ? 'text-success border-success/30 bg-success/10'
                  : 'text-warning border-warning/30 bg-warning/10'
              )}
            >
              及格线 {passScore} 分
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto sm:mx-0">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <span className="flex items-center gap-1 text-success">
                <CheckCircle size={14} />
                <span className="text-lg font-semibold font-mono text-text-primary">{correctCount}</span>
              </span>
              <span className="text-xs text-text-tertiary">正确</span>
            </div>
            <div className="flex flex-col items-center sm:items-start gap-1">
              <span className="flex items-center gap-1 text-error">
                <XCircle size={14} />
                <span className="text-lg font-semibold font-mono text-text-primary">{wrongCount}</span>
              </span>
              <span className="text-xs text-text-tertiary">错误</span>
            </div>
            <div className="flex flex-col items-center sm:items-start gap-1">
              <span className="flex items-center gap-1 text-text-tertiary">
                <MinusCircle size={14} />
                <span className="text-lg font-semibold font-mono text-text-primary">{unansweredCount}</span>
              </span>
              <span className="text-xs text-text-tertiary">未答</span>
            </div>
          </div>

          <p className="text-sm text-text-secondary mt-3">
            得分 {result.earned} / {result.total}
          </p>

          {onReset && (
            <ButtonReset onReset={onReset} />
          )}
        </div>
      </div>

      {/* 每题明细 */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-3 border-t border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-colors min-h-[44px]"
      >
        每题得分明细
        <ChevronDown
          size={16}
          className={cn('transition-transform duration-300', showDetails && 'rotate-180')}
        />
      </button>

      {showDetails && (
        <div className="border-t border-border-subtle divide-y divide-border-subtle/60">
          {perQuestion.map((s) => (
            <div key={s.index} className="flex items-center gap-3 px-5 py-3">
              <span
                className={cn(
                  'shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs',
                  s.correct && s.answered
                    ? 'bg-success/10 text-success'
                    : s.answered
                      ? 'bg-error/10 text-error'
                      : 'bg-bg-elevated text-text-tertiary'
                )}
              >
                {s.answered ? (s.correct ? <CheckCircle size={14} /> : <XCircle size={14} />) : <MinusCircle size={14} />}
              </span>
              <span className="flex-1 text-sm text-text-primary truncate">
                第 {s.index + 1} 题
              </span>
              <span className="shrink-0 text-sm font-mono text-text-secondary">
                {s.earned} / {s.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function ButtonReset({ onReset }: { onReset: () => void }) {
  return (
    <button
      onClick={onReset}
      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border-default text-sm text-text-primary hover:bg-bg-elevated transition-colors"
    >
      <RotateCcw size={14} /> 重新测试
    </button>
  )
}

export default ScoreResult
