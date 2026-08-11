import type { CSSProperties } from 'react'
import { cn } from '@/utils/cn'

export interface OrbitalRingProps {
  /** 环绕文字列表 */
  words: string[]
  /** 轨道半径：像素数字或任意 CSS 长度（默认 clamp(120px, 36vw, 280px) 随视口自适应） */
  radius?: number | string
  /** 旋转一周的秒数（默认 30） */
  duration?: number
  /** 轨道在 X 轴上的倾斜角度（deg，默认 -16，产生椭圆透视） */
  tilt?: number
  /** 反向旋转（默认 false） */
  reverse?: boolean
  /** 额外类名 */
  className?: string
}

/**
 * 3D 文字环绕组件。
 *
 * 文字沿圆形轨道均匀分布，轨道在 3D 空间中绕 Y 轴持续旋转，
 * 产生「行星环」式的立体环绕效果。可自定义轨道半径、转速、倾斜角度。
 *
 * 示例：
 * ```tsx
 * <OrbitalRing words={['HTML', 'CSS', 'React']} duration={40} />
 * ```
 */
export function OrbitalRing({
  words,
  radius,
  duration = 30,
  tilt = -16,
  reverse = false,
  className,
}: OrbitalRingProps) {
  const normalizedRadius =
    typeof radius === 'number' ? `${radius}px` : radius

  const layerStyle = {
    '--orbit-radius': normalizedRadius,
    '--orbit-duration': `${duration}s`,
    '--orbit-tilt': `${tilt}deg`,
    '--orbit-direction': reverse ? 'reverse' : 'normal',
  } as CSSProperties

  return (
    <div
      aria-hidden
      className={cn('orbit-layer perspective-1000', className)}
      style={layerStyle}
    >
      <div className="orbit-ring preserve-3d">
        {words.map((word, index) => (
          <span
            key={word}
            className="orbit-word"
            style={{ '--angle': `${(index * 360) / words.length}deg` } as CSSProperties}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  )
}

export default OrbitalRing
