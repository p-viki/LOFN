import { ApiError, postJson } from '@/lib/api'

/**
 * 文生图接口封装。
 *
 * 前端只与项目自己的后端通信，绝不持有任何 AI Provider 的 API Key。
 * 请求链路：React → /api/sketch-to-image → AI Provider → React
 *
 * 后端契约（若后端已有同类接口，请把 ENDPOINT / 字段映射改为现有规范）：
 *
 *   POST /api/sketch-to-image
 *   Request : { image: string (data:image/png;base64,...), prompt?: string, width?: number, height?: number }
 *   Response: { success: boolean, imageUrl?: string, error?: string }
 *
 * 开发环境说明：本地未实现该接口时请求会失败并走错误提示；
 * 需要本地联调可自行在 vite.config.ts 增加 server.proxy 指向后端。
 */

/** 后端接口地址（未确定时可在此集中调整） */
const ENDPOINT = '/api/sketch-to-image'

/**
 * 请求超时时间：Seedream 4.0 约 10~15s，5.0 约 30s，5.0 pro 可达 2 分钟，
 * 需大于 dev 代理侧的上游超时（150s），避免上游还在出图时前端先断开。
 */
const TIMEOUT_MS = 180_000

export interface SketchToImageParams {
  /** 画板导出的 PNG data URL */
  image: string
  /** 提示词：优先使用草图分析结果，降级时为用户原始输入 */
  prompt?: string
  width?: number
  height?: number
}

export interface SketchToImageResponse {
  success: boolean
  imageUrl?: string
  /** 后端未配置真实出图服务时返回占位图，前端必须明确提示用户 */
  placeholder?: boolean
  /** 附加说明，例如返回占位图的原因 */
  note?: string
  error?: string
}

/** 归一化后的生成结果 */
export interface GeneratedImage {
  imageUrl: string
  placeholder: boolean
  note?: string
}

export async function generateSketchImage(params: SketchToImageParams): Promise<GeneratedImage> {
  const data = await postJson<SketchToImageResponse>(ENDPOINT, params, { timeoutMs: TIMEOUT_MS })

  if (!data?.success || !data.imageUrl) {
    throw new ApiError('business', data?.error || '图片生成失败，请重试。')
  }

  return {
    imageUrl: data.imageUrl,
    placeholder: data.placeholder === true,
    note: data.note,
  }
}
