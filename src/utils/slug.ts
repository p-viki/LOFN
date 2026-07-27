/**
 * 将文本转为 URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

/**
 * 估算阅读时长（中文按 400 字/分钟，英文按 200 词/分钟）
 */
export function estimateReadingTime(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length
  const minutes = Math.ceil(chineseChars / 400 + englishWords / 200)
  return Math.max(1, minutes)
}
