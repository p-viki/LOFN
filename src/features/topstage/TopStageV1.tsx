import { useRef } from 'react'
import { useCountdown } from './useCountdown'
import './topstage.less'

export default function TopStageV1() {
  const countdownRef = useRef<HTMLDivElement>(null)
  useCountdown(countdownRef)

  return (
    <div className="ts-poster">
      {/* 顶部信息层 */}
      <header className="ts-poster__row ts-poster__row--top">
        <div className="ts-poster__brand">
          <h1 className="ts-poster__logo">TOPSTAGE<sup>®</sup></h1>
          <p className="ts-poster__tagline">10 YEARS OF MOVEMENT.<br />DANCE · CULTURE · COMMUNITY</p>
        </div>
        <div className="ts-poster__anniv">
          <span className="ts-poster__years">2016 — 2026</span>
          <span className="ts-poster__anniv-label">10TH<br />ANNIVERSARY</span>
        </div>
      </header>

      {/* 主标题 */}
      <div className="ts-poster__title">
        <p className="ts-poster__kicker">ANNIVERSARY</p>
        <h2 className="ts-poster__headline">
          <span className="ts-chrome">TOPSTAGE</span>
          <span className="ts-chrome ts-poster__ten">10<sup>TH</sup></span>
        </h2>
      </div>

      {/* 倒计时 */}
      <div className="ts-poster__countdown" ref={countdownRef} role="timer" aria-label="距离活动开始倒计时">
        {(['DAYS', 'HRS', 'MIN', 'SEC'] as const).map((u) => (
          <div className="ts-count" key={u}>
            <span className="ts-count__num ts-chrome" data-unit>--</span>
            <span className="ts-count__label">{u}</span>
          </div>
        ))}
      </div>

      {/* 底部信息层 */}
      <footer className="ts-poster__row ts-poster__row--bottom">
        <div className="ts-poster__meta">
          <div className="ts-poster__dt">
            <div><span className="ts-poster__dt-label">DATE</span><strong>11.28 <small>SAT.</small></strong></div>
            <div className="ts-poster__dt-divider" aria-hidden="true" />
            <div><span className="ts-poster__dt-label">TIME</span><strong>14:00–18:00</strong></div>
          </div>
          <p className="ts-poster__invite">TOPSTAGE 10TH ANNIVERSARY<br />YOU ARE INVITED</p>
        </div>
        <p className="ts-poster__slogan">NEXT STAGE<br />TOGETHER</p>
      </footer>
    </div>
  )
}
