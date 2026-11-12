import { ApiError, postJson } from '@/lib/api'
import { normalizePlan } from '../lib/scenePlan'
import type { ScenePlan } from '../types'

/**
 * 画面规划接口封装（由后端调用大模型，前端不接触任何 API Key）。
 *
 * 请求链路：React → /api/analyze-scene → 大模型 → React → 前端渲染引擎绘制
 *
 * 后端契约：
 *
 *   POST /api/analyze-scene
 *   Request : { prompt?: string, image?: string (data:image/png;base64,...) }
 *             两者至少给一个：prompt 是用户的画面描述，image 是参考图
 *   Response: {
 *     success: boolean,
 *     error?: string,
 *     title?: string, description?: string,
 *     timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night' | 'storm' | 'snow',
 *     horizon?: number,                                   // 0.45 ~ 0.72
 *     palette?: { skyTop?, skyBottom?, ground?, water?, accent? },   // #rrggbb
 *     objects?: Array<{ kind: string, depth: 'far'|'mid'|'near',
 *                       x: number, scale: number, color?: string,
 *                       // 以下用于词表外的物件：kind 给 custom，用零件勾出造型
 *                       label?: string,
 *                       parts?: Array<{ shape: 'polygon'|'ellipse'|'rect',
 *                                       // polygon：顶点串 "x,y x,y ..."，0~64 方格、原点左上角
 *                                       points?: string,
 *                                       // ellipse / rect：左上角与宽高（同一套 0~64 坐标）
 *                                       x?: number, y?: number, w?: number, h?: number,
 *                                       color?: string }> }>
 *   }
 *
 *   kind 取值见 lib/scenePlan.ts 的 SCENE_OBJECT_KINDS；词表外的物件用 custom + parts 描述造型，
 *   由渲染器通用绘制，因此「能画什么」不再受内置画笔清单限制。
 *   模型输出的字段会在前端用 normalizePlan 严格校验：非法值一律丢弃或回退，
 *   完全不可用时抛错，由调用方回退到关键词兜底（画质降级但不报错）。
 *
 * 本地开发：由 dev/pixelScenePlugin.mjs 提供同路径代理（Key 放 .env.local）；
 * 生产环境需由项目后端实现该接口，前端无需改动。
 */

const ENDPOINT = '/api/analyze-scene'

/** 模型带思维链，且要为 3~8 个对象做规划，超时留足 */
const TIMEOUT_MS = 90_000

export interface AnalyzeSceneParams {
  /** 用户的画面描述 */
  prompt?: string
  /** 参考图的 PNG data URL（前端已缩到最长边 768，避免超大图） */
  image?: string
  /** 确定性随机种子，随规划一起交给渲染器 */
  seed: number
}

export async function analyzeScene(params: AnalyzeSceneParams): Promise<ScenePlan> {
  const body: Record<string, string> = {}
  const prompt = params.prompt?.trim()
  if (prompt) body.prompt = prompt
  if (params.image) body.image = params.image

  const data = await postJson<Record<string, unknown>>(ENDPOINT, body, { timeoutMs: TIMEOUT_MS })

  if (!data || data.success !== true) {
    throw new ApiError(
      'business',
      typeof data?.error === 'string' && data.error ? data.error : 'AI 画面解析失败。'
    )
  }

  const plan = normalizePlan(data, params.seed)
  if (!plan) throw new ApiError('business', 'AI 没有返回可用的画面规划。')

  return plan
}
