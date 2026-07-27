# LOFN 项目架构文档

> 本文档面向 AI 辅助开发与团队协作，详细记录项目每个模块的功能、技术栈及配置文件作用。

---

## 一、项目概览

| 项 | 值 |
|---|---|
| **项目名称** | LOFN |
| **项目类型** | 个人品牌网站（作品集 + 博客 + 实验室） |
| **技术栈** | React 18 + TypeScript 5 + Vite 5 |
| **样式方案** | Tailwind CSS 3 + CSS 变量 |
| **动画引擎** | Framer Motion 11 |
| **路由方案** | React Router v6（SPA） |
| **状态管理** | Zustand 4 |
| **SEO 方案** | react-helmet-async（运行时 meta 注入） |
| **内容管理** | 文件式（Markdown + TypeScript 数据文件） |
| **部署平台** | GitHub Pages + GitHub Actions CI/CD |
| **包管理器** | npm |
| **模块系统** | ESM（`"type": "module"`） |
| **路径别名** | `@/*` -> `src/*`（统一前缀，Vite + tsconfig 双端配置） |

### 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `react` / `react-dom` | ^18.3 | UI 框架 |
| `react-router-dom` | ^6.25 | 客户端路由 |
| `framer-motion` | ^11.3 | 动画与页面转场 |
| `zustand` | ^4.5 | 轻量全局状态管理 |
| `react-helmet-async` | ^2.0 | SEO 元信息管理 |
| `react-markdown` | ^9.0 | Markdown 渲染 |
| `remark-gfm` | ^4.0 | Markdown GFM 语法扩展（表格、任务列表等） |
| `rehype-highlight` | ^7.0 | 代码块语法高亮 |
| `rehype-slug` | ^6.0 | 标题锚点生成 |
| `lucide-react` | ^0.408 | 图标库 |
| `clsx` + `tailwind-merge` | ^2.1 / ^2.4 | className 合并工具 |

### 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `typescript` | ^5.5 | 类型系统 |
| `vite` | ^5.3 | 构建工具 + 开发服务器 |
| `@vitejs/plugin-react` | ^4.3 | Vite React 插件 |
| `tailwindcss` | ^3.4 | 原子化 CSS 框架 |
| `postcss` / `autoprefixer` | ^8.4 / ^10.4 | CSS 后处理 |
| `eslint` + `@typescript-eslint/*` | ^8.57 / ^7.16 | 代码检查 |
| `prettier` | ^3.3 | 代码格式化 |
| `husky` + `lint-staged` | ^9.0 / ^15.2 | Git Hook 工具 |

---

## 二、目录结构与模块职责

```
LOFN/
├── .github/workflows/       CI/CD 流水线配置
├── public/                  静态资源（不经过构建处理）
├── src/
│   ├── main.tsx             应用入口
│   ├── App.tsx              路由配置总入口
│   ├── index.css            全局样式 + 设计 Token + Tailwind 指令
│   ├── routes/              页面级组件（对应 URL 路由）
│   ├── layouts/             布局组件（页面骨架）
│   ├── components/          业务组件（按功能域组织）
│   ├── ui/                  UI 原子组件（设计系统基础）
│   ├── hooks/               自定义 React Hooks
│   ├── stores/              Zustand 全局状态
│   ├── lib/                 第三方库封装
│   ├── services/            数据服务层（数据访问出口）
│   ├── content/             Markdown 内容源
│   ├── data/                结构化数据（TypeScript 数据文件）
│   ├── types/               TypeScript 类型定义
│   ├── styles/              样式文件
│   ├── utils/               纯工具函数
│   └── constants/           常量定义
├── index.html               HTML 入口模板
├── vite.config.ts           Vite 构建配置
├── tsconfig.json            TypeScript 编译配置
├── tsconfig.node.json       Node 环境 TS 配置（vite.config 用）
├── tailwind.config.ts       Tailwind 主题配置
├── postcss.config.js        PostCSS 插件配置
├── .eslintrc.cjs            ESLint 规则配置
├── .prettierrc              Prettier 格式化规则
├── .lintstagedrc.json       lint-staged 配置
└── package.json             依赖与脚本
```

---

## 三、各模块详细说明

### 3.1 `src/main.tsx` — 应用入口

**职责：** React 应用挂载点，初始化全局 Provider。

**关键设计：**
- `<React.StrictMode>`：开发模式下检测潜在问题
- `<HelmetProvider>`：为 `react-helmet-async` 提供 Context，支持运行时 SEO meta 管理
- `<BrowserRouter basename="/lofn">`：路由基准路径，与 `vite.config.ts` 的 `base` 保持一致

**注意事项：**
- `basename` 必须与 Vite 的 `base` 配置同步，否则路由不匹配
- 若部署到根路径（如自定义域名），需改为 `basename="/"`

---

### 3.2 `src/App.tsx` — 路由配置

**职责：** 定义所有路由规则，管理页面切换动画。

**关键设计：**
- `<AnimatePresence mode="wait">`：页面切换时先退出再进入，避免闪烁
- `key={location.pathname}`：以路径为 key 触发动画重渲染
- 所有路由嵌套在 `<RootLayout />` 下，共享 Header/Footer
- 通配符 `path="*"` 捕获 404

**路由表：**

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | `HomePage` | 首页 |
| `/about` | `AboutPage` | 关于页 |
| `/projects` | `ProjectsPage` | 项目列表 |
| `/projects/:id` | `ProjectDetailPage` | 项目详情（动态路由） |
| `/blog` | `BlogPage` | 博客列表 |
| `/blog/:slug` | `BlogDetailPage` | 文章详情（动态路由） |
| `/playground` | `PlaygroundPage` | 交互实验室 |
| `/contact` | `ContactPage` | 联系页 |
| `*` | `NotFoundPage` | 404 页面 |

---

### 3.3 `src/layouts/` — 布局层

**文件：** `RootLayout.tsx`

**职责：** 全局页面骨架，包裹所有页面。

**结构：**
```
<div min-h-screen>
  <Header />
  <motion.main>  ← 页面转场动画容器
    <Outlet />   ← 子路由渲染出口
  </motion.main>
  <Footer />
</div>
```

**关键设计：**
- `motion.main` 的 `key={location.pathname}` 确保路由切换时触发过渡动画
- `pageTransition` 动画变体来自 `@/lib/motion`（fade + scale）
- `pt-16` 为固定 Header 留出空间

---

### 3.4 `src/routes/` — 页面级组件

**职责：** 每个文件对应一个 URL 路由，负责数据编排和页面组装。

**设计原则：**
- 页面组件**不包含可复用 UI 逻辑**，仅组合 `components/` 和 `ui/`
- 数据通过 `services/` 或 `data/` 获取
- 每个页面顶部渲染 `<Seo />` 组件注入元信息

| 文件 | 功能 |
|------|------|
| `index.tsx` | 首页：Hero + 三重身份 Bento + 精选项目 + CTA |
| `about.tsx` | 关于：个人简介 + 技能矩阵 + 工作经历时间线 |
| `projects/index.tsx` | 项目列表：分类筛选 + 卡片网格 |
| `projects/detail.tsx` | 项目详情：封面 + 标签 + 正文 + Demo/源码链接 |
| `blog/index.tsx` | 博客列表：文章卡片列表 |
| `blog/detail.tsx` | 文章详情：阅读进度条 + Markdown 渲染 |
| `playground.tsx` | 实验室：Demo 卡片网格 |
| `contact.tsx` | 联系页：表单 + 社交链接 |
| `404.tsx` | 404 页面 |

---

### 3.5 `src/components/` — 业务组件层

**职责：** 按功能域组织的可复用业务组件。

**组织方式：** 按功能域分目录，每个域内包含该领域专属组件。

| 目录 | 组件 | 说明 |
|------|------|------|
| `Header/` | `Header.tsx`, `NavMenu.tsx`, `ThemeToggle.tsx` | 顶部导航：毛玻璃效果、移动端菜单、主题切换 |
| `Footer/` | `Footer.tsx` | 底部：社交链接 + 版权 |
| `hero/` | `Hero.tsx`, `Typewriter.tsx`, `ResonanceCanvas.tsx` | 首页 Hero：打字机效果、Canvas 共振背景 |
| `home/` | `IdentityBento.tsx`, `FeaturedProjects.tsx`, `CtaSection.tsx` | 首页区块：三重身份 Bento、精选项目、联系引导 |
| `project/` | `ProjectCard.tsx` | 项目卡片 |
| `blog/` | `BlogCard.tsx` | 文章卡片 |
| `seo/` | `Seo.tsx` | SEO 元信息组件（封装 Helmet） |

**与 `ui/` 的区别：** `components/` 依赖业务数据结构，与具体页面耦合但可跨页面复用；`ui/` 与业务无关。

---

### 3.6 `src/ui/` — UI 原子层（设计系统）

**职责：** 与业务无关的纯展示组件，是整个复用体系的基石。

**组件清单：**

| 组件 | 文件 | Props | 说明 |
|------|------|-------|------|
| `Button` | `Button.tsx` | `variant: primary\|secondary\|ghost\|icon`, `size: sm\|md\|lg` | 按钮，4 种变体，spring hover 效果 |
| `Card` | `Card.tsx` | `hover?: boolean` | 卡片容器，hover 上浮 + 阴影 |
| `Badge` | `Badge.tsx` | `children` | 技术标签胶囊 |
| `Input` | `Input.tsx` | `label`, `value`, `onChange` | 输入框（含 `Textarea` 导出） |
| `Container` | `Container.tsx` | `size: sm\|md\|lg`, `children` | 内容容器，控制最大宽度 |
| `Section` | `Section.tsx` | `spacing: sm\|md\|lg`, `children` | 区块包裹，统一垂直间距 |
| `Divider` | `Divider.tsx` | — | 渐变分隔线 |

**统一导出：** 通过 `ui/index.ts` 桶文件导出，使用方式：
```tsx
import { Button, Card, Badge } from '@/ui'
```

---

### 3.7 `src/hooks/` — 自定义 Hooks

| Hook | 文件 | 功能 |
|------|------|------|
| `useTheme` | `useTheme.ts` | 主题管理：暗/亮切换，localStorage 持久化，默认跟随系统偏好 |
| `useScrollReveal` | `useScrollReveal.ts` | 滚动揭示：基于 Intersection Observer，支持 threshold/rootMargin/once 配置 |
| `useMediaQuery` | `useMediaQuery.ts` | 响应式断点：监听 matchMedia 变化 |
| `useScrollProgress` | `useScrollProgress.ts` | 阅读进度：返回 0-100 滚动百分比 |
| `useActiveSection` | — | 当前激活锚点（预留） |

**设计原则：** Hooks 封装有状态逻辑，与视图解离，可跨组件共享。

---

### 3.8 `src/stores/` — 全局状态（Zustand）

| Store | 文件 | 状态 | 说明 |
|-------|------|------|------|
| `useUIStore` | `uiStore.ts` | `mobileMenuOpen` | 移动端菜单开合状态 |

**设计原则：** 仅存放跨组件共享的 UI 状态，不存放业务数据（业务数据通过 `data/` + `services/` 管理）。

---

### 3.9 `src/lib/` — 第三方库封装

**职责：** 隔离外部依赖，统一项目级配置。

| 文件 | 封装对象 | 导出内容 |
|------|---------|---------|
| `motion.ts` | Framer Motion | `ease`（缓动曲线）、`spring`（弹性配置）、`variants`（fadeIn/slideUp/stagger 等动画变体）、`pageTransition`（页面转场） |
| `markdown.ts` | remark/rehype | `remarkPlugins`（GFM 语法）、`rehypePlugins`（slug 锚点 + highlight 高亮） |

**缓动曲线定义：**
```ts
ease.out    = [0.22, 1, 0.36, 1]   // 标准出场
ease.inOut  = [0.65, 0, 0.35, 1]   // 进出对称
spring      = { stiffness: 200, damping: 26, mass: 0.8 }
```

---

### 3.10 `src/services/` — 数据服务层

**职责：** 数据访问的统一出口，页面和组件不直接操作数据源。

| 文件 | 函数 | 数据源 | 说明 |
|------|------|--------|------|
| `projects.ts` | `getAllProjects()`, `getFeaturedProjects(limit?)`, `getProjectById(id)`, `getProjectsByCategory(cat)` | `data/projects.ts` | 项目数据 CRUD |
| `posts.ts` | `getAllPosts()`, `getPostBySlug(slug)`, `parsePost(raw, slug)` | `content/blog/*.md`（TODO） | 文章数据读取，目前返回空数组，待接入 Markdown 解析 |
| `github.ts` | `getGithubStats(username)` | GitHub API | 获取用户公开统计信息 |
| `index.ts` | — | — | 桶文件统一导出 |

**扩展指引：** 未来迁移到 CMS 时，只需替换此层实现，上层代码无需改动。

---

### 3.11 `src/content/` — Markdown 内容源

**职责：** 存放博客文章和项目说明的 Markdown 文件。

```
content/
├── blog/
│   ├── getting-started.md         示例：Vite 搭建
│   ├── tailwind-design-system.md  示例：Tailwind 设计系统
│   └── ai-frontend.md             示例：AI 前端
└── projects/                      项目说明（预留）
```

**Frontmatter 格式：**
```yaml
---
title: 文章标题
description: 文章描述
date: 2024-06-15
tags: [Tag1, Tag2]
---
```

**设计原则：** 这是内容更新的唯一入口，非技术人员可通过编辑 `.md` 文件更新网站。

---

### 3.12 `src/data/` — 结构化数据

**职责：** 存放 TypeScript 格式的配置型数据，有类型约束。

| 文件 | 类型 | 内容 | 说明 |
|------|------|------|------|
| `profile.ts` | `Profile` | 姓名、职位、简介、头像、邮箱、社交链接 | 个人核心信息 |
| `site.ts` | `SiteConfig` | 站点标题、描述、URL、作者、语言 | 站点元配置 |
| `nav.ts` | `NavItem[]` | 导航项数组 | 顶部导航配置 |
| `projects.ts` | `Project[]` | 项目列表 | 项目元数据（id、标题、封面、标签、分类、链接等） |
| `skills.ts` | `SkillCategory[]` | 技能矩阵 | 按分类组织的技能（名称、熟练度 1-5、使用年限） |
| `experiences.ts` | `Experience[]` | 工作经历 | 公司、职位、时间段、描述、成就列表 |
| `index.ts` | — | — | 桶文件统一导出 |

**与 `content/` 的区别：** `data/` 是结构化的、有类型约束的短数据；`content/` 是长文本 Markdown。

**修改指引：** 替换占位数据为真实信息即可个性化网站。

---

### 3.13 `src/types/` — TypeScript 类型定义

**职责：** 集中管理跨模块共享的接口定义。

| 文件 | 导出类型 | 被引用方 |
|------|---------|---------|
| `common.ts` | `SocialLink`, `NavItem`, `SiteConfig` | `data/`, `constants/`, `utils/` |
| `project.ts` | `Project` | `data/`, `services/` |
| `post.ts` | `Post` | `services/` |
| `profile.ts` | `Profile` | `data/` |

**设计原则：** 类型定义与数据文件分离，确保数据结构在全链路一致。

---

### 3.14 `src/styles/` — 全局样式

| 文件 | 职责 |
|------|------|
| `markdown.css` | Markdown 渲染样式（标题、代码块、引用、表格等 `.prose` 类） |

**注意：** 主样式在 `src/index.css` 中（含 Tailwind 指令 + 设计 Token + 全局重置），`styles/` 目录仅存放独立样式模块。

---

### 3.15 `src/utils/` — 纯工具函数

| 文件 | 函数 | 说明 |
|------|------|------|
| `cn.ts` | `cn(...inputs)` | className 合并（clsx 条件类名 + tailwind-merge 去重） |
| `date.ts` | `formatDate(date)`, `dateDiff(start, end)` | 日期格式化（中文）、日期差计算 |
| `slug.ts` | `slugify(text)`, `estimateReadingTime(content)` | slug 生成、阅读时长估算（中英文混合） |
| `seo.ts` | `getPageTitle()`, `generateJsonLd()`, `buildSeoMeta()` | SEO 辅助：页面标题、JSON-LD 结构化数据、meta 对象构建 |

**设计原则：** 无副作用、无状态，可被任意层引用。

---

### 3.16 `src/constants/` — 常量定义

| 文件 | 导出 | 说明 |
|------|------|------|
| `routes.ts` | `ROUTES`（路由路径）、`API_ROUTES`（外部 API 地址） | 路由路径常量，避免硬编码 |
| `breakpoints.ts` | `BREAKPOINTS`（断点值）、`RESPONSIVE`（媒体查询字符串） | 响应式断点：sm 640 / md 768 / lg 1024 / xl 1280 |
| `external-links.ts` | `EXTERNAL_LINKS` | 外部社交链接配置 |

---

### 3.17 `src/index.css` — 全局样式入口

**职责：** Tailwind 指令 + 设计 Token（CSS 变量）+ 全局重置 + 工具类。

**设计 Token 体系：**

| Token 类别 | 变量 | 暗色值 | 亮色值 |
|------------|------|--------|--------|
| 背景 | `--color-bg-base` | `#000000` | `#ffffff` |
| | `--color-bg-surface` | `#0A0A0A` | `#fafafa` |
| | `--color-bg-elevated` | `#141414` | `#f4f4f5` |
| 边框 | `--color-border-subtle` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.06)` |
| | `--color-border-default` | `rgba(255,255,255,0.10)` | `rgba(0,0,0,0.10)` |
| | `--color-border-strong` | `rgba(255,255,255,0.16)` | `rgba(0,0,0,0.16)` |
| 文本 | `--color-text-primary` | `#FAFAFA` | `#0a0a0a` |
| | `--color-text-secondary` | `#A1A1AA` | `#52525b` |
| | `--color-text-tertiary` | `#71717A` | `#a1a1aa` |
| 渐变 | `--gradient-signature` | `135deg, #7C5CFC -> #4F9CFF -> #FF7AC6` | 略提饱和 |
| 阴影 | `--shadow-card` / `--shadow-hover` / `--shadow-glow` | — | — |

**工具类：**
- `.text-gradient`：渐变文字（background-clip: text）
- `.bg-gradient`：渐变背景

**无障碍：** `@media (prefers-reduced-motion: reduce)` 降级所有动画。

---

## 四、配置文件详解

### 4.1 `vite.config.ts` — Vite 构建配置

```ts
base: '/lofn/'              // GitHub Pages 子路径（仓库名）
resolve.alias['@']          // 路径别名 @ -> src/
build.rollupOptions.output.manualChunks  // 代码分割策略
```

**代码分割策略：**

| Chunk 名 | 包含依赖 | 目的 |
|----------|---------|------|
| `react-vendor` | react, react-dom, react-router-dom | React 生态独立缓存 |
| `markdown-vendor` | react-markdown, remark-gfm, rehype-* | Markdown 渲染独立缓存 |
| `motion-vendor` | framer-motion | 动画库独立缓存 |

**修改指引：**
- 部署到根路径：`base: '/'`
- 添加新的大型依赖：在 `manualChunks` 中新增条目

---

### 4.2 `tsconfig.json` — TypeScript 编译配置

| 配置项 | 值 | 说明 |
|--------|---|------|
| `target` | `ES2020` | 编译目标 |
| `module` | `ESNext` | 模块系统 |
| `moduleResolution` | `bundler` | 模块解析策略（适配 Vite） |
| `jsx` | `react-jsx` | JSX 转换方式（无需 import React） |
| `strict` | `true` | 严格模式 |
| `noUnusedLocals` | `true` | 禁止未使用的局部变量 |
| `noUnusedParameters` | `true` | 禁止未使用的参数（`_` 前缀豁免） |
| `baseUrl` | `.` | 路径解析基准 |
| `paths["@/*"]` | `["src/*"]` | 路径别名（须与 Vite alias 同步） |
| `noEmit` | `true` | 不输出 JS（Vite 负责构建） |

**`tsconfig.node.json`：** 专门用于 `vite.config.ts` 的类型检查，启用 `composite` 支持项目引用。

---

### 4.3 `tailwind.config.ts` — Tailwind 主题配置

**映射关系：** 将设计 Token 映射为 Tailwind 工具类。

| Token 类别 | Tailwind 类名前缀 | 示例 |
|------------|-------------------|------|
| 背景色 | `bg-base`, `bg-base-surface`, `bg-base-elevated` | `bg-bg-surface` |
| 边框色 | `border-border-subtle`, `border-border`, `border-border-strong` | `border-border-subtle` |
| 文本色 | `text-text-primary`, `text-text-secondary`, `text-text-tertiary` | `text-text-primary` |
| 语义色 | `bg-success`, `text-error`, `text-info` | `text-info` |
| 字体 | `font-sans`, `font-mono` | — |
| 字号 | `text-display-2xl` ~ `text-display-md` | 大标题专用 |
| 渐变 | `bg-gradient-signature` | 签名渐变 |
| 阴影 | `shadow-card`, `shadow-hover`, `shadow-glow` | — |
| 动画 | `animate-fade-in`, `animate-slide-up`, `animate-shimmer` | — |

**`darkMode: 'class'`：** 通过 `.dark` / `.light` class 切换主题（非 `media` 查询）。

---

### 4.4 `postcss.config.js` — PostCSS 配置

```js
plugins: { tailwindcss: {}, autoprefixer: {} }
```

- `tailwindcss`：处理 Tailwind 指令（`@tailwind base/components/utilities`）
- `autoprefixer`：自动添加浏览器前缀

---

### 4.5 `.eslintrc.cjs` — ESLint 配置

| 规则 | 级别 | 说明 |
|------|------|------|
| `@typescript-eslint/no-unused-vars` | warn | 未使用变量警告（`_` 前缀豁免） |
| `@typescript-eslint/no-explicit-any` | warn | 禁止 `any` |
| `react-refresh/only-export-components` | warn | 确保热更新正常（允许常量导出） |

**继承：** `eslint:recommended` + `@typescript-eslint/recommended` + `react-hooks/recommended`

---

### 4.6 `.prettierrc` — Prettier 格式化规则

| 规则 | 值 | 说明 |
|------|---|------|
| `semi` | `false` | 不使用分号 |
| `singleQuote` | `true` | 单引号 |
| `tabWidth` | `2` | 缩进 2 空格 |
| `trailingComma` | `es5` | 尾随逗号（ES5 兼容） |
| `printWidth` | `100` | 行宽 100 字符 |
| `arrowParens` | `always` | 箭头函数总是加括号 |
| `endOfLine` | `lf` | 统一 LF 换行 |

---

### 4.7 `.lintstagedrc.json` — Git Hook 配置

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,md,json}": ["prettier --write"]
}
```

**作用：** `git commit` 时自动对暂存区文件执行 lint + format，配合 `husky` 的 `pre-commit` 钩子。

---

### 4.8 `index.html` — HTML 入口模板

**关键内容：**
- `<html lang="zh-CN" class="dark">`：默认暗色模式
- `<meta name="theme-color" content="#000000">`：浏览器 UI 主题色
- Open Graph meta 标签：社交分享预览
- Google Fonts 预连接 + 加载 Inter / JetBrains Mono
- `<script type="module" src="/src/main.tsx">`：应用入口

**注意：** `favicon.svg` 路径包含 `/lofn/` 前缀，与 `base` 配置一致。

---

### 4.9 `.github/workflows/deploy.yml` — CI/CD 部署流水线

**触发条件：** `push` 到 `main` 分支 或 手动触发

**流程：**

```
push to main
  │
  ├─ Job: build (ubuntu-latest)
  │    ├─ Checkout 代码
  │    ├─ Setup Node 20 + npm cache
  │    ├─ npm ci            ← 严格安装依赖
  │    ├─ npm run build     ← Vite 构建
  │    ├─ Setup Pages       ← 配置 GitHub Pages
  │    └─ Upload artifact   ← 上传 dist/ 产物
  │
  └─ Job: deploy (依赖 build)
       └─ Deploy to Pages   ← 部署到 GitHub Pages
```

**前置条件：** 仓库 Settings -> Pages -> Source 设为 "GitHub Actions"。

---

## 五、分层依赖关系

```
依赖方向：上层依赖下层，禁止反向依赖

routes（页面）
  ├── layouts        布局
  ├── components     业务组件
  ├── services       数据服务
  └── hooks          逻辑 Hooks
        │
        ▼
components（业务组件）
  ├── ui             UI 原子
  ├── hooks
  ├── lib
  └── utils
        │
        ▼
ui（设计系统）
  ├── utils (cn.ts)
  └── styles/tokens
        │
        ▼
services（数据服务）
  ├── content        内容文件
  ├── data           结构化数据
  └── types          类型定义
```

**核心规则：**
- `ui/` 不依赖 `components/`（原子不依赖业务）
- `services/` 不依赖 `routes/`（数据不依赖页面）
- `content/` 和 `data/` 不依赖任何代码层（纯数据，可独立替换）

---

## 六、开发指南

### 6.1 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（http://localhost:5173/lofn/） |
| `npm run build` | 生产构建（输出到 `dist/`） |
| `npm run preview` | 预览构建产物 |
| `npm run typecheck` | TypeScript 类型检查（不输出文件） |
| `npm run lint` | ESLint 检查 |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run format` | Prettier 格式化全部源文件 |

### 6.2 新增页面

1. 在 `src/routes/` 下创建页面组件文件
2. 在 `src/App.tsx` 中添加 `<Route>` 配置
3. 在 `src/constants/routes.ts` 中添加路径常量
4. 在 `src/data/nav.ts` 中添加导航项（如需要）

### 6.3 新增博客文章

在 `src/content/blog/` 下创建 `.md` 文件，包含 frontmatter：
```yaml
---
title: 标题
description: 描述
date: YYYY-MM-DD
tags: [Tag1, Tag2]
---
正文内容...
```

### 6.4 新增 UI 组件

1. 在 `src/ui/` 下创建组件文件
2. 在 `src/ui/index.ts` 中添加导出
3. 使用方式：`import { ComponentName } from '@/ui'`

### 6.5 个性化配置清单

| 文件 | 修改内容 |
|------|---------|
| `src/data/profile.ts` | 姓名、简介、社交链接 |
| `src/data/projects.ts` | 项目列表 |
| `src/data/skills.ts` | 技能矩阵 |
| `src/data/experiences.ts` | 工作经历 |
| `src/data/site.ts` | 站点标题、描述、URL |
| `src/data/nav.ts` | 导航项 |
| `vite.config.ts` | `base` 路径（仓库名） |
| `src/main.tsx` | `BrowserRouter` 的 `basename` |
| `index.html` | 标题、meta、favicon 路径 |
| `public/robots.txt` | sitemap URL |

---

## 七、技术决策记录

### 7.1 为什么用 SPA 而非 SSG？

当前阶段使用纯 SPA（客户端渲染），原因：
- GitHub Pages 支持纯静态托管
- `react-helmet-async` 在运行时注入 meta，基础 SEO 可用
- SSG 需要 `vite-react-ssg`，增加构建复杂度

**升级路径：** 预留了 `build:ssg` 脚本，后续可切换到 SSG 获得预渲染 HTML。

### 7.2 为什么路径别名只用 `@/*`？

初期尝试多别名（`@ui/`、`@components/` 等），但 ESM 模式下 Vite alias 解析不稳定。统一为 `@/*` 后构建通过，且符合社区惯例。TS 路径配置同步为 `@/* -> src/*`。

### 7.3 为什么 `build` 脚本不含 `tsc`？

`tsc --noEmit` 类型检查与 Vite 构建分离，避免类型错误阻塞构建。类型检查通过 `npm run typecheck` 独立执行，CI 中可按需加入。

---

## 八、已知 TODO

| 模块 | 现状 | 待办 |
|------|------|------|
| `services/posts.ts` | 返回空数组 | 接入 Markdown 文件读取（Vite import.meta.glob） |
| `routes/blog/detail.tsx` | 占位内容 | 接入 `react-markdown` 渲染 + TOC 自动生成 |
| `routes/projects/detail.tsx` | 占位内容 | 接入 Markdown 渲染项目详情 |
| 联系表单 | `console.log` | 接入 Formspree / EmailJS |
| SSG 预渲染 | 未启用 | 评估 `vite-react-ssg` 接入时机 |
| sitemap.xml | 未生成 | 添加构建后脚本生成 sitemap |
| RSS feed | 未生成 | 添加构建后脚本生成 RSS |
| 评论系统 | 未接入 | 评估 Giscus（GitHub Discussions） |
