import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface OrbitalTextProps {
  /** Text that will be split into characters and arranged in a 3D ring */
  text: string
  /** Children rendered at the center of the ring */
  children?: ReactNode
  /** Radius of the text ring in px */
  radius?: number
  /** Time for one full rotation in seconds */
  duration?: number
  /** Rotation axis: 'x' | 'y' | 'z' */
  axis?: 'x' | 'y' | 'z'
  /** Reverse rotation direction (legacy - prefer `direction`) */
  reverse?: boolean
  /** Rotation direction: 'cw' (clockwise) | 'ccw' (counter-clockwise). Overrides `reverse`. */
  direction?: 'cw' | 'ccw'
  /** Static tilt around the X axis in degrees */
  tiltX?: number
  /** Static tilt around the Z axis in degrees */
  tiltZ?: number
  /**
   * If true, each character always faces outward (toward the viewer).
   * If false, characters are stamped flat onto the rotating ring plane,
   * so they have a side-view and rotate within one plane.
   */
  billboard?: boolean
  className?: string
  /** ClassName applied to each character */
  charClassName?: string
}

/**
 * Splits a string into characters, places each character on a 3D ring,
 * and rotates the ring continuously. The center is left free for any
 * motion.div / visual element.
 */
export function OrbitalText({
  text,
  children,
  radius = 220,
  duration = 18,
  axis = 'y',
  reverse = false,
  direction,
  tiltX = 0,
  tiltZ = 0,
  billboard = false,
  className,
  charClassName,
}: OrbitalTextProps) {
  const chars = text.split('')
  const angleStep = 360 / chars.length
  const isReversed = direction ? direction === 'ccw' : reverse

  return (
    <div
      className={cn(
        'relative flex items-center justify-center perspective-2000',
        className
      )}
      style={{ width: radius * 2 + 80, height: radius * 2 + 80 }}
    >
      {/* 3D scene with static tilt — preserve-3d so children sort by depth */}
      <div
        className="absolute inset-0 flex items-center justify-center transform-style-3d"
        style={{
          transform: `rotateX(${tiltX}deg) rotateZ(${tiltZ}deg)`,
        }}
      >
        {/* Center content at the orbit origin (Z=0). The parent is preserve-3d,
            so the browser depth-sorts it against the orbiting characters:
            chars at Z>0 (front) paint above the center, chars at Z<0 (behind)
            paint below it — giving the front/back occlusion of a real orbit. */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {children}
        </div>

        {/* Rotating ring */}
        <div
          className="absolute inset-0 flex items-center justify-center transform-style-3d"
          style={{
            animation: `orbit-spin-${axis}${isReversed ? '-reverse' : ''} ${duration}s linear infinite`,
          }}
        >
          {chars.map((char, i) => {
            const theta = i * angleStep
            return (
              <span
                key={i}
                className={cn(
                  'absolute left-1/2 top-1/2 text-sm md:text-base font-medium tracking-widest text-cyan-100/80 whitespace-pre',
                  charClassName
                )}
                style={{
                  transform: billboard
                    ? `
                        translate(-50%, -50%)
                        rotateY(${theta}deg)
                        translateZ(${radius}px)
                      `
                    : `
                        translate(-50%, -50%)
                        rotateY(${theta}deg)
                        translateZ(${radius}px)
                        rotateY(${-theta}deg)
                      `,
                  textShadow: '0 0 18px rgba(34,211,238,0.35)',
                }}
              >
                {char}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
