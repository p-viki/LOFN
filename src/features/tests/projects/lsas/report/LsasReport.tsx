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

  const sections = config.sections.filter((s) => s.enabled)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="lofn-lsas-report"
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
                <div className="lofn-lsas-report__quadrant-intro">
                  <p className="lofn-lsas-report__quadrant-label">{quadrantData.label}</p>
                  <p className="lofn-lsas-report__quadrant-text">
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
                <div className="lofn-lsas-report__combined">
                  <span aria-hidden className="lofn-lsas-report__combined-icon">
                    {combinedProfile.animal.split(' ')[0]}
                  </span>
                  <div className="lofn-lsas-report__combined-info">
                    <p className="lofn-lsas-report__combined-name">
                      {combinedProfile.name}
                    </p>
                    <p className="lofn-lsas-report__combined-meta">
                      PS {QUADRANT_SHORT_LABELS[psQuadrant.type]} × SI{' '}
                      {QUADRANT_SHORT_LABELS[siQuadrant.type]} ·{' '}
                      {combinedProfile.animal.split(' ').slice(1).join(' ')}
                    </p>
                  </div>
                </div>
                <div className="lofn-lsas-report__combined-body">
                  <p className="lofn-lsas-report__combined-core">
                    <span>
                      <PawPrint size={14} /> 核心特性
                    </span>
                    {combinedProfile.core}
                  </p>
                  <p className="lofn-lsas-report__combined-behavior">
                    {combinedProfile.behavior}
                  </p>
                  <div className="lofn-lsas-report__satire">
                    <p className="lofn-lsas-report__satire-title">
                      <PawPrint size={12} /> 毒舌点评
                    </p>
                    <p className="lofn-lsas-report__satire-text">
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
                <p className="lofn-lsas-report__scene-desc">
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
                <ul className="lofn-lsas-report__advice-list">
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
        <div className="lofn-lsas-report__actions">
          <button onClick={onReset} className="lofn-lsas-report__reset">
            <RotateCcw size={14} /> 重新测试
          </button>
        </div>
      )}

      {/* 免责声明 */}
      <div className="lofn-lsas-report__footer">
        <p className="lofn-lsas-report__disclaimer">{config.disclaimer}</p>
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
  levelLabel,
  level,
  levelDescription,
  factorValues,
}: {
  section: LsasReportSectionConfig
  displayTotal: number
  total: number
  totalLabel: string
  levelLabel: string
  level: string
  levelDescription: string
  factorValues: Record<LsasFactorKey, number>
}) {
  return (
    <div className="lofn-lsas-report__overview">
      <div className="lofn-lsas-report__ring">
        <svg width="160" height="160" viewBox="0 0 160 160" className="lofn-lsas-report__svg">
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
        <div className="lofn-lsas-report__score-wrap">
          <span className="lofn-lsas-report__score">{displayTotal}</span>
          <span className="lofn-lsas-report__score-label">{totalLabel}</span>
        </div>
      </div>

      <div className="lofn-lsas-report__summary">
        <div className="lofn-lsas-report__title-row">
          <h2 className="lofn-lsas-report__section-title">{section.title}</h2>
          <span className="lofn-lsas-report__level-badge" data-level={level}>
            <ShieldAlert size={14} /> {levelLabel}
          </span>
        </div>
        {section.subtitle && (
          <p className="lofn-lsas-report__subtitle">{section.subtitle}</p>
        )}
        <p className="lofn-lsas-report__description">{levelDescription}</p>

        {/* 因子得分（由配置 factors 决定显示哪些卡片） */}
        <div className="lofn-lsas-report__factors">
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
    <div className="lofn-lsas-report__factor">
      <span className="lofn-lsas-report__factor-label">
        {icon} {label}
      </span>
      <span className="lofn-lsas-report__factor-value">
        {value}
        <span className="lofn-lsas-report__factor-max"> / {max}</span>
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
    <div className="lofn-lsas-report__section">
      <div className="lofn-lsas-report__section-header">
        <span className="lofn-lsas-report__section-icon">{icon}</span>
        <h3 className="lofn-lsas-report__section-heading">{title}</h3>
      </div>
      <p className="lofn-lsas-report__section-subtitle">{subtitle}</p>
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
    <div className="lofn-lsas-report__quadrant">
      <QuadrantCell
        active={!highFear && !highAvoidance}
        title="低消耗 · 低回避"
        desc="高社交适应"
        tone="success"
      />
      <QuadrantCell
        active={highFear && !highAvoidance}
        title="高消耗 · 低回避"
        desc="高功能/硬撑"
        tone="warning"
      />
      <QuadrantCell
        active={!highFear && highAvoidance}
        title="低消耗 · 高回避"
        desc="偏好/习惯回避"
        tone="info"
      />
      <QuadrantCell
        active={highFear && highAvoidance}
        title="高消耗 · 高回避"
        desc="全面受阻"
        tone="error"
      />
    </div>
  )
}

function QuadrantCell({
  active,
  title,
  desc,
  tone,
}: {
  active: boolean
  title: string
  desc: string
  tone: 'success' | 'warning' | 'info' | 'error'
}) {
  return (
    <div
      className="lofn-lsas-report__quadrant-cell"
      data-active={active || undefined}
      data-tone={tone}
    >
      <span className="lofn-lsas-report__quadrant-title">{title}</span>
      <span className="lofn-lsas-report__quadrant-desc">{desc}</span>
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
    <div className="lofn-lsas-report__scene-bars">
      <SceneRow label="社交互动 SI" ratio={siRatio} type="si" active={dominant === 'si'} />
      <SceneRow label="表演 PS" ratio={psRatio} type="ps" active={dominant === 'ps'} />
    </div>
  )
}

function SceneRow({
  label,
  ratio,
  type,
  active,
}: {
  label: string
  ratio: number
  type: 'si' | 'ps'
  active: boolean
}) {
  return (
    <div className="lofn-lsas-report__scene-row">
      <div className="lofn-lsas-report__scene-labels">
        <span className="lofn-lsas-report__scene-label" data-active={active || undefined}>{label}</span>
        <span className="lofn-lsas-report__scene-ratio">{Math.round(ratio)}%</span>
      </div>
      <div className="lofn-lsas-report__scene-track">
        <div
          className="lofn-lsas-report__scene-fill"
          data-type={type}
          data-active={active || undefined}
          style={{ width: `${Math.min(ratio, 100)}%` }}
        />
      </div>
    </div>
  )
}

function AdviceItem({ text }: { text: string }) {
  return (
    <li className="lofn-lsas-report__advice-item">
      <CheckCircle2 size={16} className="lofn-lsas-report__advice-icon" />
      <span>{text}</span>
    </li>
  )
}

export default LsasReport
