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
  PawPrint,
  type LucideIcon,
} from 'lucide-react'
import type { LsasScoreResult } from '../lib/scoring'
import { SI_SUBSCALE_MAX, PS_SUBSCALE_MAX, QUADRANT_SHORT_LABELS } from '../lib/scoring'
import { cn } from '@/utils/cn'
import {
  LSAS_REPORT_CONFIG,
  type LsasReportConfig,
  type LsasReportSectionConfig,
  type LsasFactorKey,
} from './lsasReportConfig'

interface LsasReportProps {
  result: LsasScoreResult
  onReset?: () => void
  /** 报告配置（可选，默认使用全局配置） */
  config?: LsasReportConfig
}

/**
 * LSAS 量表报告（配置驱动）。
 *
 * 报告结构与展示内容由 `lsasReportConfig.ts` 中的配置声明：
 * - sections 数组决定模块顺序与显隐，改 enabled 即可开关模块
 * - 模块 title / subtitle 可自定义文案
 * - quadrant 模块的 subscale 指定渲染总体 / SI / PS 四象限
 * - overview 模块的 factors 可配置因子得分卡片
 */

/** 因子图标注册表：配置里用字符串 key 引用，避免在数据中写 JSX */
const FACTOR_ICONS: Record<string, LucideIcon> = {
  heart: HeartPulse,
  shuffle: Shuffle,
  users: Users,
  mic: Mic,
}

/** 模块图标注册表 */
const SECTION_ICONS: Record<LsasReportSectionConfig['type'], LucideIcon> = {
  overview: ShieldAlert,
  quadrant: Compass,
  combined: PawPrint,
  scene: Lightbulb,
  advice: CheckCircle2,
}

export function LsasReport({ result, onReset, config = LSAS_REPORT_CONFIG }: LsasReportProps) {
  const {
    total,
    fearTotal,
    avoidanceTotal,
    siScore,
    psScore,
    levelInfo,
    quadrant,
    siQuadrant,
    psQuadrant,
    siFearTotal,
    siAvoidanceTotal,
    psFearTotal,
    psAvoidanceTotal,
    combinedProfile,
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

  const sections = config.sections.filter((s) => s.enabled)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="lofn-lsas-report rounded-lg border border-border-subtle bg-bg-surface overflow-hidden"
    >
      {sections.map((section, index) => {
        const key = `${section.type}-${section.subscale ?? 'all'}-${index}`
        const SectionIcon = SECTION_ICONS[section.type]
        switch (section.type) {
          case 'overview':
            return (
              <OverviewSection
                key={key}
                section={section}
                displayTotal={displayTotal}
                total={total}
                totalLabel={config.totalLabel}
                levelColor={levelColor}
                levelLabel={levelInfo.label}
                level={levelInfo.level}
                levelDescription={levelInfo.description}
                factorValues={{
                  fear: fearTotal,
                  avoidance: avoidanceTotal,
                  si: siScore,
                  ps: psScore,
                }}
              />
            )
          case 'quadrant': {
            const isSi = section.subscale === 'si'
            const isPs = section.subscale === 'ps'
            const quadrantData = isSi ? siQuadrant : isPs ? psQuadrant : quadrant
            const mapFear = isSi ? siFearTotal : isPs ? psFearTotal : fearTotal
            const mapAvoidance = isSi ? siAvoidanceTotal : isPs ? psAvoidanceTotal : avoidanceTotal
            const max = isSi ? SI_SUBSCALE_MAX : isPs ? PS_SUBSCALE_MAX : 72
            return (
              <ReportSection
                key={key}
                title={section.title}
                subtitle={section.subtitle}
                icon={<SectionIcon size={16} />}
              >
                <div className="mb-4">
                  <p className="text-sm font-medium text-text-primary mb-1">{quadrantData.label}</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {quadrantData.description}
                  </p>
                </div>
                <QuadrantMap
                  fearTotal={mapFear}
                  avoidanceTotal={mapAvoidance}
                  fearMax={max}
                  avoidanceMax={max}
                />
              </ReportSection>
            )
          }
          case 'combined':
            return (
              <ReportSection
                key={key}
                title={section.title}
                subtitle={section.subtitle}
                icon={<SectionIcon size={16} />}
              >
                <div className="flex items-center gap-3.5 mb-4">
                  <span
                    aria-hidden
                    className="shrink-0 w-14 h-14 flex items-center justify-center rounded-full bg-bg-elevated border border-border-subtle text-3xl"
                  >
                    {combinedProfile.animal.split(' ')[0]}
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-text-primary">
                      {combinedProfile.name}
                    </p>
                    <p className="text-xs text-text-tertiary font-mono mt-0.5">
                      PS {QUADRANT_SHORT_LABELS[psQuadrant.type]} × SI{' '}
                      {QUADRANT_SHORT_LABELS[siQuadrant.type]} ·{' '}
                      {combinedProfile.animal.split(' ').slice(1).join(' ')}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <p className="text-sm text-text-primary">
                    <span className="inline-flex items-center gap-1.5 text-info font-medium">
                      <PawPrint size={14} /> 核心特性
                    </span>
                    <span className="ml-1.5">{combinedProfile.core}</span>
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {combinedProfile.behavior}
                  </p>
                  <div className="mt-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
                    <p className="text-xs font-medium text-warning mb-1 flex items-center gap-1">
                      <PawPrint size={12} /> 毒舌点评
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {combinedProfile.satire}
                    </p>
                  </div>
                </div>
              </ReportSection>
            )
          case 'scene':
            return (
              <ReportSection
                key={key}
                title={section.title}
                subtitle={section.subtitle}
                icon={<SectionIcon size={16} />}
              >
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {sceneProfile.description}
                </p>
                <SceneBar siScore={siScore} psScore={psScore} dominant={sceneProfile.dominant} />
              </ReportSection>
            )
          case 'advice':
            return (
              <ReportSection
                key={key}
                title={section.title}
                subtitle={section.subtitle}
                icon={<SectionIcon size={16} />}
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
            )
        }
      })}

      {/* 操作区 */}
      {config.showReset && onReset && (
        <div className="flex items-center justify-center px-5 py-4 border-t border-border-subtle">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border-default text-sm text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <RotateCcw size={14} /> 重新测试
          </button>
        </div>
      )}

      {/* 免责声明 */}
      <div className="px-5 py-3 border-t border-border-subtle">
        <p className="text-xs text-text-tertiary leading-relaxed">{config.disclaimer}</p>
      </div>
    </motion.div>
  )
}

/* ===== 综合评价模块（配置驱动因子卡片） ===== */

function OverviewSection({
  section,
  displayTotal,
  total,
  totalLabel,
  levelColor,
  levelLabel,
  level,
  levelDescription,
  factorValues,
}: {
  section: LsasReportSectionConfig
  displayTotal: number
  total: number
  totalLabel: string
  levelColor: Record<string, string>
  levelLabel: string
  level: string
  levelDescription: string
  factorValues: Record<LsasFactorKey, number>
}) {
  return (
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
          <span className="text-4xl font-semibold text-text-primary font-mono">{displayTotal}</span>
          <span className="text-xs text-text-tertiary mt-0.5">{totalLabel}</span>
        </div>
      </div>

      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
          <h2 className="text-xl font-semibold text-text-primary">{section.title}</h2>
          <span
            className={cn(
              'inline-flex items-center justify-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border w-fit mx-auto sm:mx-0',
              levelColor[level]
            )}
          >
            <ShieldAlert size={14} /> {levelLabel}
          </span>
        </div>
        {section.subtitle && (
          <p className="text-xs text-text-tertiary mb-4">{section.subtitle}</p>
        )}
        <p className="text-sm text-text-secondary mb-5 leading-relaxed">{levelDescription}</p>

        {/* 因子得分（由配置 factors 决定显示哪些卡片） */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(section.factors ?? []).map((factor) => {
            const Icon = FACTOR_ICONS[factor.icon]
            return (
              <FactorCard
                key={factor.key}
                icon={Icon ? <Icon size={16} /> : null}
                label={factor.label}
                value={factorValues[factor.key]}
                max={factor.max}
              />
            )
          })}
        </div>
      </div>
    </div>
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

/** 四象限图：X = 行为回避，Y = 内心消耗（阈值取各维度满分的 50%） */
function QuadrantMap({
  fearTotal,
  avoidanceTotal,
  fearMax,
  avoidanceMax,
}: {
  fearTotal: number
  avoidanceTotal: number
  fearMax: number
  avoidanceMax: number
}) {
  const highFear = fearTotal >= Math.ceil(fearMax / 2)
  const highAvoidance = avoidanceTotal >= Math.ceil(avoidanceMax / 2)

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
