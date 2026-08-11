# LOFN 项目结构说明

LOFN 是一个**前端测试题库应用**（移动端优先、兼容 Web 端），基于 React 18 + TypeScript 5 + Vite 5 + Tailwind CSS 3 构建。题库数据存放于静态 JSON，支持单选 / 多选 / 排序三种题型。

## 目录总览

```
LOFN/
├── public/                # 静态资源（不经打包，原样部署）
├── src/                   # 源代码
│   ├── components/        # 业务组件（按功能域组织）
│   │   ├── quiz/          #   测试题题型组件
│   │   └── seo/           #   SEO 元信息组件
│   ├── data/              # 静态数据与数据获取
│   ├── layouts/           # 布局组件
│   ├── lib/               # 第三方库封装（动画配置）
│   ├── routes/            # 页面级组件（对应路由）
│   ├── types/             # TypeScript 类型定义
│   ├── ui/                # UI 原子组件（设计系统）
│   ├── utils/             # 工具函数
│   ├── App.tsx            # 路由定义与页面切换
│   ├── index.css          # 全局样式（设计 Token + 基础样式）
│   ├── main.tsx           # 应用入口
│   └── vite-env.d.ts      # Vite 类型声明
├── dist/                  # 构建产物（git 忽略）
├── index.html             # HTML 入口
├── package.json           # 依赖与脚本
├── tailwind.config.ts     # Tailwind 主题配置
├── vite.config.ts         # Vite 构建配置
├── tsconfig.json          # TypeScript 编译配置
└── ...（其余配置文件）
```

---

## 根目录

| 文件/目录 | 作用 |
|-----------|------|
| `index.html` | HTML 入口。包含移动端 viewport 优化（禁用缩放、`viewport-fit=cover`）、主题色、字体加载（Inter / JetBrains Mono）、挂载点 `#root` |
| `package.json` | 依赖清单与脚本。主要脚本：`dev`（开发）、`build`（构建）、`typecheck`（类型检查）、`preview`（预览构建产物）、`lint` / `format`（代码质量） |
| `vite.config.ts` | Vite 配置。`@` 别名指向 `src/`、GitHub Pages 的 `base` 路径（`/LOFN/`）、构建分包（react / framer-motion 独立 chunk） |
| `tailwind.config.ts` | Tailwind 主题配置。定义色板（base/border/text/success/warning/error/info）、字体栈、断点（含 `xs: 480px` 移动端断点）、圆角、阴影、渐变色 |
| `tsconfig.json` / `tsconfig.node.json` | TypeScript 配置。`@/*` 路径别名映射到 `src/*`，严格模式 |
| `postcss.config.js` | PostCSS 插件配置（tailwindcss + autoprefixer） |
| `README.md` | 项目说明文档 |
| `dist/` | 构建输出目录（`npm run build` 生成，已被 git 忽略） |

---

## `public/` — 静态资源

不经打包处理、原样复制到部署根目录的文件。

| 文件 | 作用 |
|------|------|
| `favicon.svg` | 站点图标（`index.html` 引用） |
| `quiz-bank.json` | **题库数据源**。应用通过 `fetch()` 动态加载全部题目，可替换为 API 接口 |
| `robots.txt` | 搜索引擎爬虫规则 |

---

## `src/` — 源代码

### `src/main.tsx` — 应用入口
- 挂载 React 到 `#root`
- 包裹 `HelmetProvider`（SEO）和 `BrowserRouter`（路由）
- 生产环境部署在 GitHub Pages 子路径时自动设置路由 `basename = '/LOFN'`

### `src/App.tsx` — 路由定义
- 定义全部路由：`/quiz`（测试题分类）、`/quiz-demo`（答题）
- 首页 `/` 与未知路径 `*` 重定向到 `/quiz`
- 使用 `AnimatePresence` 实现页面切换过渡动画

### `src/routes/` — 页面级组件
| 文件 | 对应路由 | 作用 |
|------|----------|------|
| `quiz.tsx` | `/quiz` | 测试题首页：按分类展示题库卡片（HTML/CSS、JavaScript、TypeScript、React、Vue、工程化） |
| `quiz-demo.tsx` | `/quiz-demo` | 答题页：加载题库、作答（单题提交/批量提交）、进度统计、得分、显示/隐藏答案、重置 |

### `src/components/` — 业务组件
| 目录/文件 | 作用 |
|-----------|------|
| `quiz/` | 测试题题型组件集合 |
| `quiz/types.ts` | 题型 Props 类型定义：`SingleChoiceQuestionProps`、`MultipleChoiceQuestionProps`、`OrderingQuestionProps`，及 `submissionMode`（single 单题提交 / batch 批量提交） |
| `quiz/SingleChoiceQuestion.tsx` | 单选题组件（单/批量两种提交模式，作答后显示对错） |
| `quiz/MultipleChoiceQuestion.tsx` | 多选题组件（支持多选、显示正确答案） |
| `quiz/OrderingQuestion.tsx` | 排序题组件（基于 @dnd-kit 拖拽排序 + 上下按钮辅助） |
| `quiz/index.ts` | 桶文件，统一导出题型组件与类型 |
| `seo/Seo.tsx` | SEO 组件：通过 `react-helmet-async` 动态设置页面标题、description、Open Graph、Twitter 卡片元信息 |

### `src/ui/` — UI 原子组件（设计系统）
| 文件 | 作用 |
|------|------|
| `Button.tsx` | 按钮组件。4 种变体（primary/secondary/ghost/icon）× 3 种尺寸（sm/md/lg），移动端优先的触控尺寸（最小高度 44px） |
| `Card.tsx` | 卡片容器。移动端紧凑内边距，大屏放宽，悬停效果仅作用于支持 hover 的设备 |
| `Container.tsx` | 内容宽度容器。居中限宽 + 响应式内边距（`px-4` → `md:px-8`） |
| `Section.tsx` | 区块容器。提供 sm/md/lg 三档上下间距，移动端紧凑、大屏放宽 |

### `src/data/` — 静态数据与数据获取
| 文件 | 作用 |
|------|------|
| `quizBank.ts` | 题库获取模块。定义 `QuizQuestion` 联合类型（三种题型），`fetchQuizBank()` 从 `/quiz-bank.json` 异步加载题目 |
| `site.ts` | 站点配置 `siteConfig`（标题、描述、URL），供 SEO 组件使用 |

### `src/layouts/` — 布局组件
| 文件 | 作用 |
|------|------|
| `RootLayout.tsx` | 根布局。全屏纵向布局 + 页面切换过渡动画，通过 `Outlet` 渲染子路由页面 |

### `src/lib/` — 第三方库封装
| 文件 | 作用 |
|------|------|
| `motion.ts` | Framer Motion 配置：统一缓动曲线 `ease`、动画变体 `variants`（slideUp / stagger）、页面切换过渡 `pageTransition` |

### `src/utils/` — 工具函数
| 文件 | 作用 |
|------|------|
| `cn.ts` | className 合并工具：`clsx` 条件类名 + `tailwind-merge` 去重 |
| `seo.ts` | `getPageTitle()` 生成完整页面标题（`标题 | 站点名`） |

### `src/types/` — TypeScript 类型定义
| 文件 | 作用 |
|------|------|
| `common.ts` | 公共类型：`SiteConfig`（站点标题、描述、URL） |

### `src/index.css` — 全局样式
- 设计 Token：暗/亮两套主题变量（背景、边框、文字、渐变）
- 基础重置：盒模型、字体、链接、按钮
- 移动端优化：`100dvh` 布局、触控高亮禁用、`tap-highlight` 透明、输入框 16px 防缩放、触屏设备隐藏滚动条
- 工具类：`.bg-gradient` 渐变背景

### `src/vite-env.d.ts` — Vite 类型声明
- 提供 `import.meta.env` 等 Vite 内置类型的 TypeScript 支持

---

## 数据流

```
public/quiz-bank.json
        │  fetch('/quiz-bank.json')   ← src/data/quizBank.ts
        ▼
QuizDemoPage (src/routes/quiz-demo.tsx)
        │  按题型分发
        ▼
SingleChoiceQuestion / MultipleChoiceQuestion / OrderingQuestion
        │  (单题提交 onSubmit / 批量提交 onChange + 统一提交)
        ▼
答题进度 / 得分统计 / 显示答案
```

## 路径别名

项目统一使用 `@/` 别名指向 `src/`，由 `tsconfig.json`（类型解析）和 `vite.config.ts`（构建解析）共同配置。例如 `@/ui/Button` 等价于 `src/ui/Button`。
