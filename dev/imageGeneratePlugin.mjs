/**
 * 开发环境专用：为 /api/sketch-to-image 提供本地实现（火山方舟 · 即梦 Seedream）。
 *
 * 作用：让「草图 → DeepSeek 分析 → 出图」这条链路在本地就能跑通。
 * 安全：ARK API Key 只存在于 dev server 进程（来自 .env.local 或 shell 环境变量），
 *      不会进入前端产物；生产环境由项目自己的后端实现同一接口。
 *
 * 两种模式：
 *   1. 已配置 ARK_API_KEY → 调用方舟「图片生成 API」，草图作为参考图（单图生图）；
 *   2. 未配置 ARK_API_KEY → 返回明确标注的本地占位图，保证前端流程可完整联调。
 *
 * 环境变量：
 *   ARK_API_KEY      火山方舟 API Key；未配置时走占位实现
 *   ARK_BASE_URL     可选，默认 https://ark.cn-beijing.volces.com/api/v3
 *   IMAGE_MODEL      可选，默认 doubao-seedream-4-0-250828
 *   IMAGE_SIZE       可选，默认 2K（可填 1K / 2K / 4K 或精确像素如 2048x2048）
 *
 * 官方接口（https://www.volcengine.com/docs/82379/1541523）：
 *   POST {baseUrl}/images/generations
 *   Header: Authorization: Bearer $ARK_API_KEY
 *   Body  : { model, prompt, image, size, response_format, watermark }
 *   Resp  : { model, created, data: [{ url }], usage }
 */

const DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'
/** Seedream 4.0：支持单图生图（参考图）、1K/2K/4K，延迟约 10~15s */
const DEFAULT_MODEL = 'doubao-seedream-4-0-250828'
const DEFAULT_SIZE = '2K'
/**
 * 上游超时：Seedream 4.0 约 10~15s，5.0 约 30s，5.0 pro 可达 2 分钟。
 * 前端 service 的超时（180s）需大于该值，避免上游还在出图时前端先断开。
 */
const UPSTREAM_TIMEOUT_MS = 150_000
/** 请求体上限：草图 PNG 约百 KB 级 */
const MAX_BODY_BYTES = 16 * 1024 * 1024
/** 附加在提示词末尾的结构引导，让出图沿用草图构图 */
const STRUCTURE_HINT =
  'strictly follow the composition and subject structure of the provided reference sketch'

/**
 * @param {object} options
 * @param {string} [options.apiKey]
 * @param {string} [options.baseUrl]
 * @param {string} [options.model]
 * @param {string} [options.size]
 * @returns {import('vite').Plugin}
 */
export function imageGeneratePlugin({ apiKey, baseUrl, model, size } = {}) {
  const config = {
    apiKey: apiKey || '',
    baseUrl: (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    model: model || DEFAULT_MODEL,
    size: size || DEFAULT_SIZE,
  }

  /** @type {(req: any, res: any, next: () => void) => void} */
  const handler = (req, res, next) => {
    if (req.method !== 'POST') {
      next()
      return
    }

    readJsonBody(req)
      .then((body) => resolveImage(body, config))
      .then(({ imageUrl, placeholder, note }) => {
        if (placeholder) {
          console.log('[image] sketch-to-image 返回本地占位图（未配置 ARK_API_KEY）')
        }
        sendJson(res, 200, { success: true, imageUrl, placeholder, note })
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '图片生成失败。'
        console.error(`[image] sketch-to-image failed: ${message}`)
        if (!res.headersSent) sendJson(res, 502, { success: false, error: message })
      })
  }

  return {
    name: 'lofn:ark-image-generate',
    // 仅开发环境生效，生产构建不会包含该中间件
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/sketch-to-image', handler)
      server.config.logger.info(
        config.apiKey
          ? `  ➜  即梦 Seedream 出图代理已启用（model: ${config.model}, size: ${config.size}）`
          : '  ➜  即梦 Seedream 出图代理未配置 ARK_API_KEY：将返回本地占位图（见 .env.example）'
      )
    },
  }
}

/**
 * @param {any} body
 * @param {{ apiKey: string, baseUrl: string, model: string, size: string }} config
 * @returns {Promise<{ imageUrl: string, placeholder: boolean, note?: string }>}
 */
async function resolveImage(body, config) {
  const image = typeof body?.image === 'string' ? body.image : ''
  if (!image.startsWith('data:image/')) {
    throw new Error('请求缺少有效的图片数据（image 需为 data:image/*;base64 形式）。')
  }
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''

  if (!config.apiKey) {
    return {
      imageUrl: buildPlaceholderImage(prompt),
      placeholder: true,
      note: '当前为本地占位图：未配置 ARK_API_KEY，配置后返回真实生成结果。',
    }
  }

  const startedAt = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const response = await fetch(`${config.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt ? `${prompt}, ${STRUCTURE_HINT}` : STRUCTURE_HINT,
        // 草图作为参考图：单图生图（参考图数量 + 输出图数量需 ≤ 15）
        image,
        size: config.size,
        // 默认即为单图模式，故不传 sequential_image_generation（5.0 pro 不支持该参数）
        response_format: 'url',
        // 默认 true 会带上「AI 生成」水印，这里显式关闭
        watermark: false,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      const hint = response.status === 403 ? '（可能触发内容审核，请调整描述或草图）' : ''
      throw new Error(
        `方舟接口返回 ${response.status}${hint}${detail ? `：${detail.slice(0, 300)}` : ''}`
      )
    }

    const data = await response.json()
    const imageUrl = data?.data?.[0]?.url
    if (typeof imageUrl !== 'string' || !imageUrl) {
      throw new Error('方舟接口未返回图片地址。')
    }

    console.log(
      `[image] sketch-to-image ok（${Date.now() - startedAt}ms，size=${data?.data?.[0]?.size ?? config.size}，生成 ${data?.usage?.generated_images ?? 1} 张）`
    )
    return { imageUrl, placeholder: false }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 未配置出图服务时返回的占位图（SVG data URL），明确标注以免被误认为 AI 结果。
 * @param {string} prompt
 * @returns {string}
 */
function buildPlaceholderImage(prompt) {
  const lines = wrapText(prompt, 40).slice(0, 3)
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">',
    '<rect width="1024" height="1024" fill="#0a0f1a"/>',
    '<rect x="40" y="40" width="944" height="944" rx="28" fill="none" stroke="#38bdf8" stroke-opacity="0.35" stroke-width="3" stroke-dasharray="16 14"/>',
    '<text x="512" y="470" text-anchor="middle" font-family="sans-serif" font-size="46" fill="#f0f9ff">本地占位图</text>',
    '<text x="512" y="528" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#94a3b8">未配置出图服务（ARK_API_KEY）</text>',
    ...lines.map(
      (line, index) =>
        `<text x="512" y="${610 + index * 44}" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#64748b">${escapeXml(line)}</text>`
    ),
    '</svg>',
  ].join('')

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * @param {string} text
 * @param {number} maxLength
 * @returns {string[]}
 */
function wrapText(text, maxLength) {
  if (!text) return ['（无提示词）']
  const lines = []
  for (let i = 0; i < text.length; i += maxLength) {
    lines.push(text.slice(i, i + maxLength))
  }
  return lines
}

/**
 * @param {string} text
 * @returns {string}
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * @param {any} req
 * @returns {Promise<any>}
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
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
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(body)
}
