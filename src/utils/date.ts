/**
 * 格式化日期为中文格式
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 计算两个日期之间的年/月差
 */
export function dateDiff(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  if (months < 12) return `${months}个月`
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  return remMonths ? `${years}年${remMonths}个月` : `${years}年`
}
