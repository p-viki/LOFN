/**
 * 开发环境专用：为 /api/analyze-sketch 提供本地代理。
 *
 * 作用：让「草图 → DeepSeek 视觉分析 → 提示词」这条链路在本地就能跑通。
 * 安全：API Key 只存在于 dev server 进程（来自 .env.local 或 shell 环境变量），
 *      不会进入前端产物；生产环境由项目自己的后端实现同一接口。
 *
 * 环境变量见 dev/lib/deepseek.mjs：
 *   DEEPSEEK_API_KEY   必填，未配置时接口返回明确错误
 *   DEEPSEEK_BASE_URL  可选，默认 https://api.deepseek.com
 *   DEEPSEEK_MODEL     可选，默认 deepseek-flash（官方视觉模型）
 */

import {
  createDeepseekConfig,
  normalizeText,
  readJsonBody,
  requestVision,
  sendJson,
} from './lib/deepseek.mjs'

const UPSTREAM_TIMEOUT_MS = 60_000
/** 请求体上限：导出的草图 PNG 通常在百 KB 级别，留足余量即可 */
const MAX_BODY_BYTES = 8 * 1024 * 1024
/** 提示词长度上限，避免异常输出污染出图接口 */
const MAX_PROMPT_LENGTH = 400

const ANALYZE_INSTRUCTION = [
  '你是草图理解助手。用户会画一张草图，出图模型会同时收到这张草图（作为构图参考）和你的提示词。',
  '请理解用户想表达的内容，输出一段用于生成「最终成品图」的英文提示词。',
  '要求：',
  '1. 依据线条结构推断主体对象、姿态、场景与氛围，并补充合理的细节、材质与光影；',
  '2. 描述的是成品画面本身（内容/风格/光线/氛围），不要输出「手绘草图、线条、白底、黑色描边、简笔画」这类描述草图自身特征的词；',
  '3. 只输出一段英文提示词（逗号分隔的关键词或一句简短英文描述），控制在 40 个词以内；',
  '4. 不要解释、不要加引号、不要编号、不要换行、不要输出多余文字；',
  '5. 如果用户提供了已填写的描述，必须将其融合进结果，不要与之矛盾；用户指定的风格优先遵循；',
  '6. 如果草图无法辨认，就依据用户描述生成；两者都缺少信息时输出通用描述：a simple object on a plain background。',
].join('\n')

/**
 * @param {object} options
 * @param {string} [options.apiKey]
 * @param {string} [options.baseUrl]
 * @param {string} [options.model]
 * @returns {import('vite').Plugin}
 */
export function deepseekAnalyzePlugin({ apiKey, baseUrl, model } = {}) {
  const config = createDeepseekConfig({ apiKey, baseUrl, model })

  /** @type {(req: any, res: any, next: () => void) => void} */
  const handler = (req, res, next) => {
    if (req.method !== 'POST') {
      next()
      return
    }

    if (!config.apiKey) {
      sendJson(res, 500, {
        success: false,
        error: '未配置 DEEPSEEK_API_KEY：请在项目根目录 .env.local 中填写后重启 dev server。',
      })
      return
    }

    readJsonBody(req, MAX_BODY_BYTES)
      .then((body) => analyze(body, config))
      .then(({ prompt, finishReason }) => {
        if (finishReason && finishReason !== 'stop') {
          console.warn(
            `[deepseek] analyze-sketch 未正常结束（finish_reason=${finishReason}），提示词可能不完整`
          )
        }
        console.log(`[deepseek] analyze-sketch ok（${prompt.length} 字符）`)
        sendJson(res, 200, { success: true, prompt })
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '草图分析失败。'
        console.error(`[deepseek] analyze-sketch failed: ${message}`)
        if (!res.headersSent) sendJson(res, 502, { success: false, error: message })
      })
  }

  return {
    name: 'lofn:deepseek-analyze',
    // 仅开发环境生效，生产构建不会包含该中间件
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/analyze-sketch', handler)
      server.config.logger.info(
        config.apiKey
          ? `  ➜  DeepSeek 草图分析代理已启用（model: ${config.model}）`
          : '  ➜  DeepSeek 草图分析代理未启用：缺少 DEEPSEEK_API_KEY（见 .env.example）'
      )
    },
  }
}

/**
 * 调用 DeepSeek 视觉接口，返回归一化后的提示词。
 * @param {any} body
 * @param {{ apiKey: string, baseUrl: string, model: string }} config
 * @returns {Promise<{ prompt: string, finishReason?: string }>}
 */
async function analyze(body, config) {
  const image = typeof body?.image === 'string' ? body.image : ''
  if (!image.startsWith('data:image/')) {
    throw new Error('请求缺少有效的图片数据（image 需为 data:image/*;base64 形式）。')
  }
  const hint = typeof body?.hint === 'string' ? body.hint.trim() : ''

  const { content, finishReason } = await requestVision(config, {
    instruction: ANALYZE_INSTRUCTION,
    image,
    hint,
    maxTokens: 800,
    timeoutMs: UPSTREAM_TIMEOUT_MS,
  })

  const prompt = normalizeText(content, MAX_PROMPT_LENGTH)
  if (!prompt) throw new Error('DeepSeek 未返回可用的提示词。')
  return { prompt, finishReason }
}
