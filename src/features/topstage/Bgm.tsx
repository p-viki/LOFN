import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import './bgm.less'

const SRC = 'https://media.1010diy.com/aimusic/90c90e10-64b1-4da3-af10-639c89e9e7b2/90c90e10-64b1-4da3-af10-639c89e9e7b2.m4a'
// 从第 3 秒开始播放
const START_AT = 5

export default function Bgm() {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  const play = (rewind = false) => {
    const el = audio.current!
    // rewind：播完一轮后回卷到第 3 秒（loop 会从头播，故不用 loop）
    if (rewind || el.currentTime < START_AT) el.currentTime = START_AT
    el.play().then(() => setPlaying(true)).catch(() => {})
  }

  // 浏览器禁止带声自动播放：先尝试，被拦则等首次交互再起
  useEffect(() => {
    play()
    const start = () => play()
    window.addEventListener('pointerdown', start, { once: true })
    window.addEventListener('keydown', start, { once: true })
    return () => {
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
    }
  }, [])

  const toggle = () => {
    if (playing) {
      audio.current!.pause()
      setPlaying(false)
    } else {
      play()
    }
  }

  return (
    <>
      <audio ref={audio} src={SRC} preload="auto" onEnded={() => play(true)} />
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
