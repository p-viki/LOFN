import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { deepseekAnalyzePlugin } from './dev/deepseekAnalyzePlugin.mjs'
import { pixelScenePlugin } from './dev/pixelScenePlugin.mjs'
import { imageGeneratePlugin } from './dev/imageGeneratePlugin.mjs'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 读取 .env*（含 .env.local）中不带前缀的变量，供 dev 期服务端插件使用；
  // 已存在的 shell 环境变量优先，方便临时覆盖（如 DEEPSEEK_API_KEY=xxx npm run dev）。
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }

  return {
    plugins: [
      react(),
      // 仅开发环境生效：DeepSeek 读草图出提示词 / 读参考图出场景元素、即梦 Seedream 出图，
      // 均由 dev server 调用上游，前端不持有任何 API Key。
      deepseekAnalyzePlugin({
        apiKey: env.DEEPSEEK_API_KEY,
        baseUrl: env.DEEPSEEK_BASE_URL,
        model: env.DEEPSEEK_MODEL,
      }),
      pixelScenePlugin({
        apiKey: env.DEEPSEEK_API_KEY,
        baseUrl: env.DEEPSEEK_BASE_URL,
        model: env.DEEPSEEK_MODEL,
      }),
      imageGeneratePlugin({
        apiKey: env.ARK_API_KEY,
        baseUrl: env.ARK_BASE_URL,
        model: env.IMAGE_MODEL,
        size: env.IMAGE_SIZE,
      }),
    ],
    // GitHub Pages 子路径部署：仓库名为 LOFN 则 base 为 /LOFN/
    // 若使用自定义域名或 <user>.github.io 仓库，改为 '/'
    base: process.env.GITHUB_ACTIONS ? '/LOFN/' : '/',
    server: {
      host: true, // 监听 0.0.0.0，允许局域网 IP（如 192.168.2.31）访问
    },
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
            'motion-vendor': ['framer-motion'],
          },
        },
      },
    },
  }
})
