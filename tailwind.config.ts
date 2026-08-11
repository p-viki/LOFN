import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      colors: {
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
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#38BDF8',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"HarmonyOS Sans SC"',
          '"Noto Sans SC"',
          '"Microsoft YaHei"',
          'system-ui',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // 移动端优先：小屏用紧凑字号，md 起放大
        'display-md': ['28px', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-lg': ['40px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '18px',
      },
      boxShadow: {
        hover: '0 20px 40px rgba(0,0,0,0.4)',
        glow: '0 0 40px rgba(34,211,238,0.25)',
      },
      backgroundImage: {
        'gradient-signature': 'linear-gradient(135deg, #22D3EE 0%, #38BDF8 50%, #818CF8 100%)',
      },
    },
  },
  plugins: [],
}

export default config
