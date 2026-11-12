import { Fragment, useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { WireframeText } from './WireframeText'
import type { WireframeQuality } from './WireframeText'
import './topstage-v2.less'

const TARGET = new Date('2026-11-28T14:00:00+08:00').getTime()
const pad = (n: number) => String(n).padStart(2, '0')

// 活动地点真实坐标（伽里 Music Nook · 厦门集美石鼓路97号），点击跳转高德地图
const VENUE = { lat: 24.574102, lng: 118.098876 }
const AMAP_URL = `https://uri.amap.com/marker?position=${VENUE.lng},${VENUE.lat}&name=${encodeURIComponent('伽里 Music Nook')}`

function remaining() {
  const diff = Math.max(0, TARGET - Date.now())
  return {
    d: pad(Math.floor(diff / 86400000)),
    h: pad(Math.floor(diff / 3600000) % 24),
    m: pad(Math.floor(diff / 60000) % 60),
    s: pad(Math.floor(diff / 1000) % 60),
  }
}

function detectQuality(): WireframeQuality {
  if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768) return 'low'
  const cores = navigator.hardwareConcurrency || 4
  return cores >= 8 ? 'high' : 'medium'
}

export default function TopStageV2() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [t, setT] = useState(remaining)

  useEffect(() => {
    const id = setInterval(() => setT(remaining()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    const wf = new WireframeText(canvasRef.current, { quality: detectQuality() })
    const onVis = () => (document.hidden ? wf.pause() : wf.resume())
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      wf.destroy()
    }
  }, [])

  const units = [
    { label: 'DAYS', value: t.d },
    { label: 'HRS', value: t.h },
    { label: 'MIN', value: t.m },
    { label: 'SEC', value: t.s },
  ]

  return (
    <div className="ts2">
      <canvas ref={canvasRef} className="ts2__canvas" aria-hidden="true" />

      <header className="ts2__top">
        <span className="ts2__logo">TOPSTAGE<sup>®</sup></span>
        <span className="ts2__anniv">2016 — 2026<br />10TH ANNIVERSARY</span>
      </header>

      <main className="ts2__hero">
        <h1 className="ts2__title">TOPSTAGE</h1>
        <p className="ts2__subtitle">10TH&nbsp;&nbsp;ANNIVERSARY</p>
      </main>

      <div className="ts2__count" role="timer" aria-label="距离活动开始倒计时">
        {units.map((u, i) => (
          <Fragment key={u.label}>
            {i > 0 && <span className="ts2__colon" aria-hidden="true">:</span>}
            <div className="ts2__unit">
              <span className="ts2__num" key={u.value}>{u.value}</span>
              <span className="ts2__label">{u.label}</span>
            </div>
          </Fragment>
        ))}
      </div>

      <footer className="ts2__foot">
        <div className="ts2__item"><span>DATE</span><strong>11.28 SAT.</strong></div>
        <div className="ts2__item"><span>TIME</span><strong>14:00–18:00</strong></div>
        <div className="ts2__item ts2__item--right">
          <a className="ts2__addr" href={AMAP_URL} target="_blank" rel="noreferrer">
            <span>NEXT STAGE</span>
            <strong>伽里 Music Nook</strong>
            <small className="ts2__addr-hint">
              AMOY · JIMEI
              <span className="ts2__addr-pin">
                <i className="ts2__addr-pin-halo" aria-hidden="true" />
                <MapPin size={12} />
              </span>
            </small>
          </a>
        </div>
      </footer>
    </div>
  )
}
