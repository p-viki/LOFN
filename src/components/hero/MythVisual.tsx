import { motion } from 'framer-motion'

const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'

/**
 * Abstract mythological visual inspired by the reference image:
 * a softly rotating ring of runes + stylized world-tree made of glowing lines/particles.
 * Pure SVG/CSS, no external images.
 */
export function MythVisual() {
  return (
    <div className="relative w-full aspect-square max-w-[560px] mx-auto">
      {/* Outer rune ring */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full opacity-60">
          <defs>
            <linearGradient id="runeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.6)" />
              <stop offset="50%" stopColor="rgba(129,140,248,0.3)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.1)" />
            </linearGradient>
          </defs>
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="none"
            stroke="url(#runeGradient)"
            strokeWidth="0.5"
          />
          {RUNES.split('').map((rune, i) => {
            const angle = (i / RUNES.length) * Math.PI * 2 - Math.PI / 2
            const x = 200 + 180 * Math.cos(angle)
            const y = 200 + 180 * Math.sin(angle)
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(34,211,238,0.5)"
                fontSize="10"
                transform={`rotate(${(angle * 180) / Math.PI + 90} ${x} ${y})`}
              >
                {rune}
              </text>
            )
          })}
        </svg>
      </motion.div>

      {/* Inner rune ring (counter-rotate, smaller) */}
      <motion.div
        className="absolute inset-[15%]"
        animate={{ rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full opacity-40">
          <circle
            cx="200"
            cy="200"
            r="170"
            fill="none"
            stroke="rgba(34,211,238,0.15)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
          />
        </svg>
      </motion.div>

      {/* Abstract world tree */}
      <div className="absolute inset-[20%] flex items-center justify-center">
        <svg viewBox="0 0 200 260" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="treeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.85)" />
              <stop offset="60%" stopColor="rgba(56,189,248,0.4)" />
              <stop offset="100%" stopColor="rgba(129,140,248,0.1)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Trunk */}
          <path
            d="M100 240 C 100 200, 95 160, 100 130 C 105 100, 95 70, 100 40"
            fill="none"
            stroke="url(#treeGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Branches */}
          <path
            d="M100 130 C 70 115, 50 90, 35 70 M100 115 C 130 100, 150 75, 165 55 M100 95 C 80 75, 65 50, 55 30 M100 85 C 120 65, 135 45, 145 25"
            fill="none"
            stroke="rgba(34,211,238,0.45)"
            strokeWidth="1.2"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Roots */}
          <path
            d="M100 220 C 75 235, 55 250, 40 260 M100 225 C 125 240, 145 255, 160 265 M100 235 C 90 250, 80 265, 70 275"
            fill="none"
            stroke="rgba(56,189,248,0.25)"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* Glow nodes */}
          <circle cx="100" cy="40" r="4" fill="#22d3ee" filter="url(#glow)">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="35" cy="70" r="2.5" fill="#38bdf8" filter="url(#glow)">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="165" cy="55" r="2.5" fill="#38bdf8" filter="url(#glow)">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="130" r="3" fill="#22d3ee" filter="url(#glow)">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Central radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[45%] h-[45%] rounded-full bg-gradient-to-br from-cyan-400/10 via-blue-500/5 to-transparent blur-3xl" />
      </div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-300/60"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            y: [0, -12, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
