# LOFN - 个人网站

前端工程师 / AI 开发 / 音乐创作者 的个人品牌网站。

## 技术栈

- **框架**: React 18 + TypeScript 5
- **构建**: Vite 5
- **样式**: Tailwind CSS 3
- **动画**: Framer Motion
- **路由**: React Router v6
- **状态**: Zustand
- **SEO**: react-helmet-async
- **部署**: GitHub Pages + GitHub Actions

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── routes/         页面级组件（对应路由）
├── layouts/        布局组件
├── components/     业务组件（按功能域组织）
├── ui/             UI 原子组件（设计系统）
├── hooks/          自定义 Hooks
├── stores/         Zustand 状态管理
├── lib/            第三方库封装
├── services/       数据服务层
├── content/        Markdown 内容源
├── data/           结构化数据
├── types/          TypeScript 类型
├── styles/         全局样式
├── utils/          工具函数
└── constants/      常量
```

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。

> 注意：部署前需在仓库 Settings -> Pages 中将 Source 设为 GitHub Actions。

## 自定义

1. 修改 `src/data/profile.ts` 更新个人信息
2. 修改 `src/data/projects.ts` 更新项目列表
3. 在 `src/content/blog/` 添加 Markdown 文章
4. 修改 `vite.config.ts` 中的 `base` 路径为你的仓库名
5. 修改 `index.html` 中的 meta 信息
