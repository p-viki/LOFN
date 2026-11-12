/**
 * 开发环境共用的 DeepSeek 视觉调用封装。
 *
 * 仅供 dev server 的中间件插件使用：
 * API Key 只存在于 dev server 进程，不会进入前端产物。
 *
 * 这里刻意使用 .mjs（纯 Node 脚本）而不是 .ts，
 * 避免为一个 dev 期垫片引入 @types/node 依赖、也不进入前端类型检查范围。
 */

export const DEEPSEEK_DEFAULTS = {
  baseUrl: 'https://api.deepseek.com',
  /** 官方视觉模型 */
  model: 'deepseek-flash',
}

/**
 * @param {{ apiKey?: string, baseUrl?: string, model?: string }} [options]
 * @returns {{ apiKey: string, baseUrl: string, model: string }}
 */
export function createDeepseekConfig({ apiKey, baseUrl, model } = {}) {
  return {
    apiKey: apiKey || '',
    baseUrl: (baseUrl || DEEPSEEK_DEFAULTS.baseUrl).replace(/\/+$/, ''),
    model: model || DEEPSEEK_DEFAULTS.model,
  }
}

/**
 * 调用 OpenAI 兼容的 /chat/completions，图片以 data URL 传入。
 * 官方限制：图片只能出现在 user 消息中；不传 image 时即为纯文本对话。
 *
 * @param {{ apiKey: string, baseUrl: string, model: string }} config
 * @param {{ instruction: string, image?: string, hint?: string, maxTokens?: number, timeoutMs?: number, reasoningEffort?: string }} options
 * @returns {Promise<{ content: string, finishReason?: string, usage?: any }>}
 */
export async function requestVision(
  config,
  { instruction, image = '', hint = '', maxTokens = 800, timeoutMs = 60_000, reasoningEffort = '' }
) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const messageContent = [
      {
        type: 'text',
        text: hint ? `${instruction}\n\n用户描述（必须体现）：${hint}` : instruction,
      },
    ]
    if (image) messageContent.push({ type: 'image_url', image_url: { url: image } })

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        // deepseek-flash 带思维链（reasoning_content），上限过小会把正式回答挤断，故留足额度
        max_tokens: maxTokens,
        stream: false,
        messages: [{ role: 'user', content: messageContent }],
        // 思维链长到能占满额度、把正式回答挤空（实测长描述下思考可达 5000 tokens）。
        // 结构化抽取这类任务不需要长思考，显式压低思考量既快又不会再被截断。
        ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(
        `DeepSeek 接口返回 ${response.status}${detail ? `：${detail.slice(0, 200)}` : ''}`
      )
    }

    const data = await response.json()
    const choice = data?.choices?.[0]
    const content = typeof choice?.message?.content === 'string' ? choice.message.content : ''
    // usage 一并返回：思维链模型会把 reasoning_tokens 也算进 max_tokens，
    // 出问题时需要靠它判断是不是被思考过程挤爆了额度
    return { content, finishReason: choice?.finish_reason, usage: data?.usage }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 带一次重试的调用封装：模型服务偶发网络抖动（fetch failed / 连接被重置）时重试一次；
 * HTTP 4xx/5xx 不重试——重试也不会成功，只会把用户等待拖得更久。
 *
 * @param {{ apiKey: string, baseUrl: string, model: string }} config
 * @param {{ instruction: string, image?: string, hint?: string, maxTokens?: number, timeoutMs?: number }} options
 */
export async function requestVisionWithRetry(config, options) {
  try {
    return await requestVision(config, options)
  } catch (error) {
    if (!isNetworkError(error)) throw error
    console.warn(`[deepseek] 网络抖动，1 次重试：${error instanceof Error ? error.message : error}`)
    await new Promise((resolve) => setTimeout(resolve, 900))
    return requestVision(config, options)
  }
}

/**
 * 判断是否为网络层错误（而非接口返回的业务错误）
 * @param {unknown} error
 */
export function isNetworkError(error) {
  const text = [
    error instanceof Error ? error.message : '',
    String(error?.cause?.message ?? error?.cause ?? ''),
  ].join(' ')
  return /fetch failed|network|econnreset|etimedout|socket hang up|undici|enotfound|eai_again/i.test(
    text
  )
}

/**
 * 去掉模型可能附带的引号/换行，压缩空白并限制长度。
 * @param {unknown} text
 * @param {number} maxLength
 * @returns {string}
 */
export function normalizeText(text, maxLength) {
  if (typeof text !== 'string') return ''
  return text
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength)
}

/**
 * @param {any} req
 * @param {number} maxBytes
 * @returns {Promise<any>}
 */
export function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > maxBytes) {
        reject(new Error('请求体过大。'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(chunks.join('') || '{}'))
      } catch {
        reject(new Error('请求体不是合法 JSON。'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * @param {any} res
 * @param {number} status
 * @param {unknown} payload
 */
export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(body)
}
