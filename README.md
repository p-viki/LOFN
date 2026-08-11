# LOFN - 前端测试题

前端测试题库应用：单选 / 多选 / 排序题型练习与自测。

## 功能

- 分类展示测试题（HTML & CSS、JavaScript、TypeScript、React、Vue、工程化）
- 题库测试：单题提交与批量提交两种模式
- 答题进度、得分统计、显示/隐藏答案、重置

## 技术栈

- **框架**: React 18 + TypeScript 5
- **构建**: Vite 5
- **样式**: Tailwind CSS 3
- **动画**: Framer Motion
- **路由**: React Router v6
- **拖拽**: @dnd-kit（排序题）
- **SEO**: react-helmet-async

## 快速开始

```bash
npm install
npm run dev       # 开发模式
npm run build     # 构建
npm run preview   # 预览构建结果
```

## 项目结构

```
src/
├── routes/             页面（quiz 分类页、quiz-demo 答题页）
├── components/
│   ├── quiz/           题型组件（单选/多选/排序）
│   └── seo/            SEO 组件
├── layouts/            布局
├── data/               题库加载与站点配置
├── ui/                 UI 基础组件
├── lib/                动画配置
├── types/              TypeScript 类型
└── utils/              工具函数
```

## 题库数据

题目存放在 `public/quiz-bank.json`，应用启动时通过 `fetchQuizBank()` 加载，后续可替换为 API 接口。

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。

> 注意：部署前需在仓库 Settings -> Pages 中将 Source 设为 GitHub Actions。
