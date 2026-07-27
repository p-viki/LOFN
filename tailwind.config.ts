import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 暗色模式（默认）
        base: {
          DEFAULT: '#000000',
          surface: '#0A0A0A',
          elevated: '#141414',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)',
        },
        text: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          tertiary: '#71717A',
        },
        // 语义色
        success: '#3ECF8E',
        warning: '#F5A623',
        error: '#FF4D4D',
        info: '#4F9CFF',
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
        glow: '0 0 40px rgba(124,92,252,0.3)',
      },
      backgroundImage: {
        'gradient-signature': 'linear-gradient(135deg, #7C5CFC 0%, #4F9CFF 50%, #FF7AC6 100%)',
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
