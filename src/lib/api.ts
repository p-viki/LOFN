/**
 * 项目与自有后端之间的极简 POST JSON 封装。
 *
 * 统一处理：超时、错误归类、响应体解析失败，
 * 避免每个接口（草图分析 / 图片生成 / 参考图分析）重复实现同一套逻辑。
 */

export type ApiErrorKind = 'network' | 'timeout' | 'server' | 'business'

/** 统一的可展示错误：message 直接面向用户 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind

  constructor(kind: ApiErrorKind, message: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
  }
}

interface PostJsonOptions {
  /** 请求超时时间（ms），默认 60s */
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 60_000

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError'
  )
}

/** 从错误响应里取出后端给的 error / message 文案 */
async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const data = (await response.json()) as { error?: unknown; message?: unknown }
    for (const value of [data?.error, data?.message]) {
      if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 200)
    }
    return null
  } catch {
    // 4xx/5xx 且响应体不是 JSON（网关 HTML 页、空响应等）
    return null
  }
}

export async function postJson<T>(
  path: string,
  body: unknown,
  options: PostJsonOptions = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      // 后端（或 dev 代理）通常会给出可读原因，能拿到就透出来，拿不到再回退到通用文案
      const detail = await readErrorMessage(response)
      throw new ApiError('server', detail ?? '请求失败，请稍后重试。')
    }

    try {
      return (await response.json()) as T
    } catch {
      // 2xx 但响应体不是合法 JSON（如网关返回 HTML 错误页）
      throw new ApiError('server', '服务返回异常，请稍后重试。')
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (isAbortError(error)) {
      throw new ApiError('timeout', '请求超时，请重试。')
    }
    throw new ApiError('network', '网络异常，请检查网络后重试。')
  } finally {
    clearTimeout(timer)
  }
}
