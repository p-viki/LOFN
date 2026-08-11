/**
 * 全局测试环境标记。
 *
 * 通过 URL 参数 `?isDev=true` 开启（例如 `/lsas?isDev=true`）。
 * 开启后会在页面中显示开发辅助功能（如「一键答题」「复制报告数据」等）。
 */
export const isDev: boolean =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('isDev') === 'true'
