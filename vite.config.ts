import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 子路径部署：仓库名为 LOFN 则 base 为 /LOFN/
  // 若使用自定义域名或 <user>.github.io 仓库，改为 '/'
  base: '/LOFN/',
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'rehype-highlight', 'rehype-slug'],
          'motion-vendor': ['framer-motion'],
        },
      },
    },
  },
})
