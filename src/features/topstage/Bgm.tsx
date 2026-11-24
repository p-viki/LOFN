import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import './bgm.less'

const SRC = 'https://media.1010diy.com/aimusic/90c90e10-64b1-4da3-af10-639c89e9e7b2/90c90e10-64b1-4da3-af10-639c89e9e7b2.m4a'

export default function Bgm() {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  // 浏览器禁止带声自动播放：先尝试，被拦则等首次交互再起
  useEffect(() => {
    const el = audio.current!
    const start = () => el.play().then(() => setPlaying(true)).catch(() => {})
    el.play().then(() => setPlaying(true)).catch(() => {
      window.addEventListener('pointerdown', start, { once: true })
      window.addEventListener('keydown', start, { once: true })
    })
    return () => {
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
    }
  }, [])

  const toggle = () => {
    const el = audio.current!
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      el.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  return (
    <>
      <audio ref={audio} src={SRC} loop preload="auto" />
      <button
        className={`ts-bgm${playing ? ' is-playing' : ''}`}
        type="button"
        onClick={toggle}
        aria-label={playing ? '关闭背景音乐' : '播放背景音乐'}
        aria-pressed={playing}
      >
        {playing ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>
    </>
  )
}
