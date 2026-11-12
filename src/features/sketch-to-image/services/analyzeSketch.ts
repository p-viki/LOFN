import { ApiError, postJson } from '@/lib/api'

/**
 * 草图分析接口封装（由后端调用 DeepSeek 视觉模型，前端不接触 API Key）。
 *
 * 请求链路：React → /api/analyze-sketch → DeepSeek（deepseek-flash 视觉）→ React
 *
 * 后端契约：
 *
 *   POST /api/analyze-sketch
 *   Request : { image: string (data:image/png;base64,...), hint?: string }
 *             hint 为用户已填写的描述，后端需在提示词中融合它
 *   Response: { success: boolean, prompt?: string, error?: string }
 *             prompt 为最终可直接用于文生图的提示词（建议英文）
 *
 * 本地开发：由 dev/deepseekAnalyzePlugin.mjs 提供同路径代理（Key 放 .env.local）；
 * 生产环境需由项目后端实现该接口，前端无需改动。
 */

const ENDPOINT = '/api/analyze-sketch'

/** 视觉分析超时：通常几秒内返回，留出充足余量 */
const TIMEOUT_MS = 45_000

export interface AnalyzeSketchParams {
  /** 画板导出的 PNG data URL */
  image: string
  /** 用户已填写的描述，交给模型融合 */
  hint?: string
}

export interface AnalyzeSketchResponse {
  success: boolean
  prompt?: string
  error?: string
}

/** 归一化后的分析结果 */
export interface SketchAnalysis {
  prompt: string
}

export async function analyzeSketch(params: AnalyzeSketchParams): Promise<SketchAnalysis> {
  const data = await postJson<AnalyzeSketchResponse>(ENDPOINT, params, { timeoutMs: TIMEOUT_MS })

  const prompt = typeof data?.prompt === 'string' ? data.prompt.trim() : ''
  if (!data?.success || !prompt) {
    throw new ApiError('business', data?.error || '草图分析失败。')
  }

  return { prompt }
}
