import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 神话/北欧暗色主题：深黑底 + 冰蓝/银白辉光
        base: {
          DEFAULT: '#020408',
          surface: '#050810',
          elevated: '#0a0f1a',
        },
        border: {
          subtle: 'rgba(125,211,252,0.10)',
          DEFAULT: 'rgba(125,211,252,0.18)',
          strong: 'rgba(125,211,252,0.30)',
        },
        text: {
          primary: '#F0F9FF',
          secondary: '#94A3B8',
          tertiary: '#64748B',
        },
        // 语义色 - 冷调
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#38BDF8',
      },
      fontFamily: {
        sans: ['Inter', 'HarmonyOS Sans SC', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['96px', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '600' }],
        'display-xl': ['72px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-lg': ['56px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-md': ['40px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 4px 12px rgba(0,0,0,0.2)',
        hover: '0 20px 40px rgba(0,0,0,0.4)',
        glow: '0 0 40px rgba(34,211,238,0.25)',
        'glow-strong': '0 0 60px rgba(34,211,238,0.35), 0 0 120px rgba(56,189,248,0.15)',
      },
      backgroundImage: {
        'gradient-signature': 'linear-gradient(135deg, #22D3EE 0%, #38BDF8 50%, #818CF8 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
