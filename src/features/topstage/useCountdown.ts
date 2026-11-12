import { useEffect } from 'react'

const TARGET = new Date('2026-11-28T14:00:00+08:00').getTime()
const pad = (n: number) => String(n).padStart(2, '0')

/** 倒计时直接写 DOM，避免每秒触发 React 重渲染 */
export function useCountdown(ref: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const cells = ref.current?.querySelectorAll<HTMLElement>('[data-unit]')
    if (!cells) return
    let raf = 0
    let last = ''
    const update = () => {
      const diff = Math.max(0, TARGET - Date.now())
      const d = Math.floor(diff / 86400000)
      const h = Math.floor(diff / 3600000) % 24
      const m = Math.floor(diff / 60000) % 60
      const s = Math.floor(diff / 1000) % 60
      const key = `${d}-${h}-${m}-${s}`
      if (key !== last) {
        last = key
        const vals = [pad(d), pad(h), pad(m), pad(s)]
        cells.forEach((c, i) => (c.textContent = vals[i]))
      }
      raf = requestAnimationFrame(update)
    }
    update()
    return () => cancelAnimationFrame(raf)
  }, [ref])
}
