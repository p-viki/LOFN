import { useEffect, useState } from 'react'
import { motion, animate } from 'framer-motion'
import {
  ShieldAlert,
  RotateCcw,
  HeartPulse,
  Shuffle,
  Users,
  Mic,
  Compass,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react'
import type { LsasScoreResult } from '@/lib/scoring-lsas'
import { cn } from '@/utils/cn'

interface LsasReportProps {
  result: LsasScoreResult
  onReset?: () => void
}

/**
 * LSAS 量表报告（四维）：
 * 1. 综合评价：总分 + 五级严重程度
 * 2. 维度交叉诊断：Fear × Avoidance 四象限
 * 3. 触发场景画像：ps vs si 对比
 * 4. 定制化建议
 */
export function LsasReport({ result, onReset }: LsasReportProps) {
  const {
    total,
    fearTotal,
    avoidanceTotal,
    siScore,
    psScore,
    levelInfo,
    quadrant,
    sceneProfile,
  } = result
  const [displayTotal, setDisplayTotal] = useState(0)

  useEffect(() => {
    const controls = animate(0, total, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayTotal(Math.round(v)),
    })
    return () => controls.stop()
  }, [total])

  const levelColor: Record<string, string> = {
    none: 'text-success border-success/30 bg-success/10',
    mild: 'text-info border-info/30 bg-info/10',
    moderate: 'text-warning border-warning/30 bg-warning/10',
    severe: 'text-error border-error/30 bg-error/10',
    extreme: 'text-error border-error/50 bg-error/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden"
    >
      {/* 一、综合评价 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-5 sm:p-8">
        <div className="relative shrink-0 mx-auto sm:mx-0">
          <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
            <circle
              cx="80"
              cy="80"
              r="64"
              fill="none"
              stroke="var(--color-border-subtle)"
              strokeWidth="10"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="64"
              fill="none"
              stroke="url(#lsas-gradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 64}
              initial={{ strokeDashoffset: 2 * Math.PI * 64 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 64 * (1 - Math.min(total / 144, 1)) }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="lsas-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold text-text-primary font-mono">
              {displayTotal}
            </span>
            <span className="text-xs text-text-tertiary mt-0.5">/ 144 分</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-text-primary">综合评价</h2>
            <span
              className={cn(
                'inline-flex items-center justify-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border w-fit mx-auto sm:mx-0',
                levelColor[levelInfo.level]
              )}
            >
              <ShieldAlert size={14} /> {levelInfo.label}
            </span>
          </div>
          <p className="text-sm text-text-secondary mb-5 leading-relaxed">{levelInfo.description}</p>

          {/* 因子得分 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FactorCard icon={<HeartPulse size={16} />} label="内心体感" value={fearTotal} max={72} />
            <FactorCard icon={<Shuffle size={16} />} label="行为回避" value={avoidanceTotal} max={72} />
            <FactorCard icon={<Users size={16} />} label="社交互动 (SI)" value={siScore} max={66} />
            <FactorCard icon={<Mic size={16} />} label="表演 (PS)" value={psScore} max={78} />
          </div>
        </div>
      </div>

      {/* 二、维度交叉诊断（四象限） */}
      <ReportSection
        title="维度交叉诊断"
        subtitle="内心消耗 × 行为回避 双轴画像"
        icon={<Compass size={16} />}
      >
        <div className="mb-4">
          <p className="text-sm font-medium text-text-primary mb-1">{quadrant.label}</p>
          <p className="text-sm text-text-secondary leading-relaxed">{quadrant.description}</p>
        </div>
        <QuadrantMap fearTotal={fearTotal} avoidanceTotal={avoidanceTotal} />
      </ReportSection>

      {/* 三、触发场景画像 */}
      <ReportSection
        title="触发场景画像"
        subtitle="社交互动 (SI) vs 表演 (PS) 对比"
        icon={<Lightbulb size={16} />}
      >
        <p className="text-sm text-text-secondary leading-relaxed mb-4">{sceneProfile.description}</p>
        <SceneBar siScore={siScore} psScore={psScore} dominant={sceneProfile.dominant} />
      </ReportSection>

      {/* 四、定制化建议 */}
      <ReportSection
        title="定制化建议"
        subtitle="针对你的画像给出的行动参考"
        icon={<CheckCircle2 size={16} />}
      >
        <ul className="space-y-2">
          {quadrant.advice.map((a) => (
            <AdviceItem key={a} text={a} />
          ))}
          {sceneProfile.advice.map((a) => (
            <AdviceItem key={a} text={a} />
          ))}
        </ul>
      </ReportSection>

      {/* 操作区 */}
      <div className="flex items-center justify-center px-5 py-4 border-t border-border-subtle">
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border-default text-sm text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <RotateCcw size={14} /> 重新测试
          </button>
        )}
      </div>

      {/* 免责声明 */}
      <div className="px-5 py-3 border-t border-border-subtle">
        <p className="text-xs text-text-tertiary leading-relaxed">
          本量表结果仅供自我评估与了解参考，不构成医学诊断。如有困扰，请咨询专业心理医生或精神科医师。
        </p>
      </div>
    </motion.div>
  )
}

/* ===== 内部子组件 ===== */

function FactorCard({
  icon,
  label,
  value,
  max,
}: {
  icon: React.ReactNode
  label: string
  value: number
  max: number
}) {
  return (
    <div className="flex flex-col items-center sm:items-start gap-1 rounded-lg border border-border-subtle bg-bg-elevated/40 p-3">
      <span className="flex items-center gap-1.5 text-xs text-text-secondary">
        {icon} {label}
      </span>
      <span className="text-lg font-semibold font-mono text-text-primary">
        {value}
        <span className="text-xs text-text-tertiary font-normal"> / {max}</span>
      </span>
    </div>
  )
}

function ReportSection({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="px-5 sm:px-8 py-5 border-t border-border-subtle">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-info">{icon}</span>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      </div>
      <p className="text-xs text-text-tertiary mb-4">{subtitle}</p>
      {children}
    </div>
  )
}

/** 四象限图：X = 行为回避，Y = 内心消耗 */
function QuadrantMap({ fearTotal, avoidanceTotal }: { fearTotal: number; avoidanceTotal: number }) {
  const highFear = fearTotal >= 36
  const highAvoidance = avoidanceTotal >= 36

  return (
    <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
      <QuadrantCell
        active={!highFear && !highAvoidance}
        title="低消耗 · 低回避"
        desc="高社交适应"
        className="border-success/30"
      />
      <QuadrantCell
        active={highFear && !highAvoidance}
        title="高消耗 · 低回避"
        desc="高功能/硬撑"
        className="border-warning/30"
      />
      <QuadrantCell
        active={!highFear && highAvoidance}
        title="低消耗 · 高回避"
        desc="偏好/习惯回避"
        className="border-info/30"
      />
      <QuadrantCell
        active={highFear && highAvoidance}
        title="高消耗 · 高回避"
        desc="全面受阻"
        className="border-error/40"
      />
    </div>
  )
}

function QuadrantCell({
  active,
  title,
  desc,
  className,
}: {
  active: boolean
  title: string
  desc: string
  className: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 p-3 rounded-lg border transition-colors',
        active
          ? 'bg-info/10 border-info/50'
          : 'bg-bg-elevated/30 border-border-subtle opacity-60'
      )}
    >
      <span className={cn('text-xs font-medium text-text-primary', !active && 'text-text-tertiary')}>
        {title}
      </span>
      <span className={cn('text-[11px] text-text-tertiary', active && className)}>{desc}</span>
    </div>
  )
}

/** SI vs PS 占比条 */
function SceneBar({
  siScore,
  psScore,
  dominant,
}: {
  siScore: number
  psScore: number
  dominant: 'ps' | 'si' | 'balanced'
}) {
  const siRatio = (siScore / 66) * 100
  const psRatio = (psScore / 78) * 100

  return (
    <div className="space-y-3">
      <SceneRow label="社交互动 SI" ratio={siRatio} color="bg-info" active={dominant === 'si'} />
      <SceneRow label="表演 PS" ratio={psRatio} color="bg-purple-500" active={dominant === 'ps'} />
    </div>
  )
}

function SceneRow({
  label,
  ratio,
  color,
  active,
}: {
  label: string
  ratio: number
  color: string
  active: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={cn('text-xs', active ? 'text-text-primary font-medium' : 'text-text-tertiary')}>
          {label}
        </span>
        <span className="text-xs font-mono text-text-secondary">{Math.round(ratio)}%</span>
      </div>
      <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color, !active && 'opacity-50')}
          style={{ width: `${Math.min(ratio, 100)}%` }}
        />
      </div>
    </div>
  )
}

function AdviceItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-text-secondary leading-relaxed">
      <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-info" />
      <span>{text}</span>
    </li>
  )
}

export default LsasReport
