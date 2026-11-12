/**
 * 开发环境专用：为 /api/analyze-scene 提供本地代理。
 *
 * 作用：让「画面描述（可附参考图）→ DeepSeek → 像素画场景规划」这条链路在本地跑通。
 *      模型只负责「理解并规划」，真正的像素画面由前端渲染引擎按规划绘制，
 *      所以这里返回的是结构化 JSON，而不是图片。
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
  requestVisionWithRetry,
  sendJson,
} from './lib/deepseek.mjs'

const UPSTREAM_TIMEOUT_MS = 90_000
const MAX_BODY_BYTES = 8 * 1024 * 1024
const MAX_PROMPT_LENGTH = 800
const MAX_OBJECTS = 12
/**
 * 输出额度：思维链也算在里面，规划正文本身只有 200 字左右，
 * 给足额度才不会出现「思考完没字数回答」的空正文。
 */
const MAX_PLAN_TOKENS = 8000
/**
 * 思考强度：实测长描述下模型会思考 3000~5000 tokens（既慢又容易把正文挤空），
 * 而「把描述抽成结构化规划」并不需要长推导，压低后约 2~3 秒返回、思维链仅 200 tokens 量级。
 */
const PLAN_REASONING_EFFORT = 'low'

/** 必须与前端 src/features/pixel-studio/lib/scenePlan.ts 的 SCENE_OBJECT_KINDS 一致 */
const KINDS = [
  'mountain',
  'hill',
  'city',
  'rock',
  'forest',
  'tree',
  'palm',
  'cactus',
  'flower',
  'water',
  'boat',
  'road',
  'house',
  'castle',
  'lighthouse',
  'windmill',
  'tent',
  'campfire',
  'sun',
  'moon',
  'star',
  'cloud',
  'bird',
  'rocket',
  'planet',
  'rain',
  'snow',
  'fog',
  'cat',
  'sofa',
  'table',
  'chair',
  'rug',
  'lamp',
  'window',
  'person',
]

const SCENE_INSTRUCTION = [
  '你是像素画场景设计师。请把用户的画面描述（若附有参考图，还要看懂图中的内容）翻译成一份可直接绘制的「像素画场景规划」，只输出 JSON。',
  '',
  '输出格式（不要 Markdown 代码块、不要解释、不要输出 JSON 以外的任何文字）：',
  '{"title":"黄昏小屋","description":"一句中文概括画面，40 字以内","timeOfDay":"dusk","horizon":0.62,',
  ' "palette":{"skyTop":"#2b3568","skyBottom":"#ff9a63","ground":"#4f7a55","water":"#3c6f9c","accent":"#ff8358"},',
  ' "objects":[{"kind":"mountain","depth":"far","x":0.35,"scale":1},{"kind":"house","depth":"mid","x":0.3,"scale":1},{"kind":"tree","depth":"near","x":0.78,"scale":1.1}]}',
  '',
  '字段含义：',
  `- kind 取 ${KINDS.join(', ')} 之一；custom 表示词表外物件（配合 label 与 parts，见第 13~14 条）；`,
  '- depth 只能取 far / mid / near：far 是地平线附近的远景（山、丘陵、城市、星空），mid 是中景（房子、船、树、道路），near 是近景（画在画面下方、更大）；',
  '- x 是水平位置（0 = 最左，1 = 最右），scale 是相对大小（0.6 ~ 1.6）；',
  '- horizon 是地平线高度占画面高度的比例（0.5 ~ 0.68）；',
  '- palette 是画面主色，5 个都必须给，且要符合描述的光线与氛围。',
  '',
  '规划规则：',
  '1. objects 给 3~8 个，必须覆盖描述里的主要景物，不要添加描述里没有的东西；',
  '2. 描述里的每个主要物体都要有一个对象：「三棵树」→ 三个 tree，x 分别取不同值；「一条小路」→ road；',
  '3. 地貌词对应：草原/田野/丘陵→hill，山/山脉→mountain，森林/树林→forest，海/湖/河/沙滩→water，沙丘/沙漠→hill 加 cactus，岩石/悬崖→rock，花田→flower；',
  '4. 生物与人物相关：棕榈树→palm，飞鸟→bird，小船/帆船→boat；',
  '5. 建筑：房子/木屋/小屋/村庄→house，城堡→castle，灯塔→lighthouse，风车→windmill，高楼/城市→city，帐篷/营地→tent，篝火→campfire；',
  '6. 天空：太阳→sun，月亮→moon，星空/银河→star，云→cloud，太空/星球→planet，火箭/飞船→rocket；',
  '7. 天气：下雨→rain，下雪→snow，雾→fog；阴天/雷雨/暴风雨→timeOfDay 用 storm；',
  '8. 光照：清晨/日出/黎明→dawn，白天/晴天→day，黄昏/日落/夕阳/晚霞→dusk，夜晚/深夜→night，雪天→snow；描述里没有光照词时按画面内容推断最贴切的一个；',
  '9. 若画面里有水面，palette.water 必须给；若参考图无法辨认，objects 给出你能辨认的内容，description 说明主体。',
  '10. 室内场景（房间/客厅/卧室/咖啡馆）：墙面用 palette.skyTop 与 skyBottom，地板或家具阴影用 palette.ground，不要出现云、海、山这类室外元素；',
  '11. 室内物件对应：沙发→sofa，桌子/书桌→table，椅子→chair，地毯→rug，台灯/落地灯→lamp，窗户→window，猫→cat，人→person；家具与猫放 near、窗户放 mid、地平线取 0.55~0.68（即墙与地板的交界）；',
  '12. 「猫在沙发上」这类描述要同时给出 sofa 与 cat，且两者 x 接近，渲染器会把猫画到沙发面上；',
  '13. 词表内的 kind 优先用于常见物件（有专门画法，效果更好）；描述里出现词表外的物件时（如恐龙、汽车、电视、书架、机器人、摩天轮），必须用 kind="custom" + label（物件名，6 字以内）+ parts 把它画出来——不要省略，也不要硬套一个意思不同的 kind；',
  '14. parts 是这个物件的零件清单：用一圈轮廓把剪影勾出来。坐标系与 SVG 完全一致，务必按这套写法：',
  '    · 画布是 64 × 64 的方格，原点在**左上角**、y 轴**向下**：x 从 0（最左）到 64（最右），y 从 0（顶部）到 64（底部）；',
  '    · 物件底部（脚、轮子、底座）落在 y = 62~64，也就是站在地面上；左右大致占满 4~60，不要缩在角落；',
  '    · shape="polygon" 是主要写法：points 是一串顶点 "x,y x,y x,y ..."，按顺序连成闭合轮廓，用整数坐标；',
  '    · 轮廓要占满方格：宽和高都尽量到 60%~100%，最少不低于 40%，不要把物件画成扁扁的一条或缩在角落（方格是正方形，形状的比例完全由你给的坐标决定）；',
  '    · 轮廓允许是凹的：要挖空的地方（车轮拱、椅背缺口、月牙）让相邻顶点向内凹进去即可，不必拆成多个零件；',
  '    · shape="ellipse"（x, y, w, h 是左上角与宽高）用于圆润部件（轮子、眼睛、果子），shape="rect" 用于方正部件（屏幕、窗、门）；',
  '    · color 用语义角色：body / bodyLight / bodyDark / accent / wood / metal / glass / sky / ground / water / light / ink，也可直接给 #rrggbb；body 是主色，bodyLight / bodyDark 是它的亮面与暗面，无需自己算颜色；物件没有明显颜色时就不要给物件的 color 字段（渲染器会自动挑一个与背景有对比的主色），给了 color 则整件物件都以它为主色。',
  '    · 零件 1~5 个即可，先画主体大轮廓，再叠 1~2 个细节（玻璃、轮子、眼睛）；每个 polygon 用 8~24 个顶点，不要逐像素描边；',
  '    · 下面两个示例只示范坐标系与写法。**你必须按当前要画的物件重新设计坐标，严禁照抄示例里的数字**（不同物件、不同姿态的轮廓完全不同）：',
  '    · 示例·汽车：{"kind":"custom","label":"汽车","depth":"mid","x":0.68,"scale":1.1,"parts":[{"shape":"polygon","points":"6,62 6,54 12,54 16,46 24,42 40,42 48,48 56,50 58,54 58,62 52,62 50,58 42,58 40,62 24,62 22,58 14,58 12,62","color":"body"},{"shape":"rect","x":26,"y":45,"w":12,"h":7,"color":"glass"},{"shape":"ellipse","x":14,"y":56,"w":9,"h":8,"color":"ink"},{"shape":"ellipse","x":40,"y":56,"w":9,"h":8,"color":"ink"}]}',
  '    · 示例·恐龙：{"kind":"custom","label":"恐龙","depth":"mid","x":0.35,"scale":1.2,"parts":[{"shape":"polygon","points":"4,34 10,31 16,35 22,40 28,41 34,40 40,38 45,33 49,26 52,19 56,16 60,18 60,23 56,26 52,28 48,33 46,40 44,46 44,54 46,58 46,62 40,62 38,58 36,52 32,50 28,52 28,58 30,62 24,62 22,58 20,52 16,46 10,40","color":"body"},{"shape":"ellipse","x":55,"y":20,"w":3,"h":3,"color":"ink"}]}',
  '15. 只有当物件是抽象概念（如「幸福」「时间」）确实无法用轮廓表达时，才省略它。',
].join('\n')

/**
 * @param {object} options
 * @param {string} [options.apiKey]
 * @param {string} [options.baseUrl]
 * @param {string} [options.model]
 * @returns {import('vite').Plugin}
 */
export function pixelScenePlugin({ apiKey, baseUrl, model } = {}) {
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
      .then((result) => {
        console.log(
          `[deepseek] analyze-scene ok（objects: ${summarizeObjects(result.objects)}）`
        )
        sendJson(res, 200, { success: true, ...result })
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '画面解析失败。'
        console.error(`[deepseek] analyze-scene failed: ${message}`)
        if (!res.headersSent) sendJson(res, 502, { success: false, error: message })
      })
  }

  return {
    name: 'lofn:deepseek-pixel-scene',
    // 仅开发环境生效，生产构建不会包含该中间件
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/analyze-scene', handler)
      server.config.logger.info(
        config.apiKey
          ? `  ➜  DeepSeek 画面规划代理已启用（model: ${config.model}）`
          : '  ➜  DeepSeek 画面规划代理未启用：缺少 DEEPSEEK_API_KEY（见 .env.example）'
      )
    },
  }
}

/**
 * 带「空正文」兜底的调用：
 *
 * deepseek-flash 会先输出思维链（reasoning_content），这部分同样计入 max_tokens。
 * 实测偶发（约 1/8）思考过程把额度吃满，finish_reason=length 而 content 为空——
 * 这种情况换一次请求几乎必然成功，所以这里对「HTTP 成功但正文为空」再试一次。
 *
 * @param {{ apiKey: string, baseUrl: string, model: string }} config
 * @param {{ instruction: string, image?: string, hint?: string, maxTokens?: number, timeoutMs?: number }} options
 */
async function requestPlanWithFallback(config, options) {
  const attempts = 2
  let last = { content: '', finishReason: undefined, usage: undefined }

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    last = await requestVisionWithRetry(config, options)
    if (last.content.trim()) return last

    const reasoning = last.usage?.completion_tokens_details?.reasoning_tokens
    console.warn(
      `[deepseek] analyze-scene 第 ${attempt}/${attempts} 次返回空正文` +
        `（finish_reason=${last.finishReason ?? '未知'}, reasoning_tokens=${reasoning ?? '未知'}）`
    )
  }

  return last
}

/**
 * @param {any} body
 * @param {{ apiKey: string, baseUrl: string, model: string }} config
 */
async function analyze(body, config) {
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, MAX_PROMPT_LENGTH) : ''
  const image = typeof body?.image === 'string' ? body.image : ''
  if (!prompt && !image.startsWith('data:image/')) {
    throw new Error('请求需要 prompt（画面描述）或 image（参考图）中的至少一个。')
  }

  const { content, finishReason } = await requestPlanWithFallback(config, {
    instruction: SCENE_INSTRUCTION,
    image,
    hint: prompt,
    maxTokens: MAX_PLAN_TOKENS,
    timeoutMs: UPSTREAM_TIMEOUT_MS,
    reasoningEffort: PLAN_REASONING_EFFORT,
  })

  if (!content.trim()) throw new Error('DeepSeek 未返回画面规划（思考过程占满了输出额度）。')
  if (finishReason && finishReason !== 'stop') {
    console.warn(`[deepseek] analyze-scene 未正常结束（finish_reason=${finishReason}）`)
  }

  const plan = normalizePlan(content)
  if (!plan) throw new Error('DeepSeek 返回的内容不是合法的画面规划 JSON。')
  return plan
}

/**
 * 轻量清洗模型输出（严格校验在前端 normalizePlan 里再做一次）：
 * 只保证结构正确、数量可控，坏值交给前端丢弃。
 * @param {string} raw
 */
function normalizePlan(raw) {
  const parsed = parseJsonObject(raw)
  if (!parsed) return null

  const objects = Array.isArray(parsed.objects)
    ? parsed.objects
        .filter(
          (item) =>
            item &&
            typeof item === 'object' &&
            // 常规物件必须有 kind；自定造型只给 parts 也接受
            (typeof item.kind === 'string' || Array.isArray(item.parts))
        )
        .slice(0, MAX_OBJECTS)
        .map((item) => ({
          kind: typeof item.kind === 'string' ? item.kind : 'custom',
          depth: typeof item.depth === 'string' ? item.depth : 'mid',
          x: Number(item.x),
          scale: Number(item.scale),
          color: typeof item.color === 'string' ? item.color : undefined,
          label: typeof item.label === 'string' ? item.label : undefined,
          // 造型零件原样透传：形状白名单、坐标夹紧等严格校验在前端 normalizePlan 里做
          parts: Array.isArray(item.parts) ? item.parts : undefined,
          width: typeof item.width === 'number' && Number.isFinite(item.width) ? item.width : undefined,
          height:
            typeof item.height === 'number' && Number.isFinite(item.height) ? item.height : undefined,
        }))
    : []

  const description = normalizeText(parsed.description, 60)
  if (objects.length === 0 && !description) return null

  return {
    title: normalizeText(parsed.title, 16),
    description,
    timeOfDay: typeof parsed.timeOfDay === 'string' ? parsed.timeOfDay.trim().toLowerCase() : '',
    horizon: Number(parsed.horizon),
    palette:
      parsed.palette && typeof parsed.palette === 'object'
        ? {
            skyTop: str(parsed.palette.skyTop),
            skyBottom: str(parsed.palette.skyBottom),
            ground: str(parsed.palette.ground),
            water: str(parsed.palette.water),
            accent: str(parsed.palette.accent),
          }
        : {},
    objects,
  }
}

/** @param {unknown} value */
function str(value) {
  return typeof value === 'string' ? value : undefined
}

/**
 * @param {Array<{ kind: string }>} objects
 */
function summarizeObjects(objects) {
  if (!objects || objects.length === 0) return '无'
  const counts = new Map()
  for (const object of objects) {
    // 自定造型按物件名统计，日志里才看得出到底画了什么
    const key = object.kind === 'custom' ? `custom:${object.label ?? '?'}` : object.kind
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts].map(([kind, count]) => (count > 1 ? `${kind}×${count}` : kind)).join(',')
}

/**
 * 从模型输出里取出第一个 JSON 对象（可能被代码块或解释文字包裹）。
 * @param {string} raw
 * @returns {any | null}
 */
function parseJsonObject(raw) {
  const text = String(raw ?? '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null

  try {
    const parsed = JSON.parse(text.slice(start, end + 1))
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}
