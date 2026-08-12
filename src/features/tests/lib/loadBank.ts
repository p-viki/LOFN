/**
 * 通用题库加载工具。
 *
 * 当前从 public 静态 JSON 加载，后续可无缝替换为 API 接口。
 */
export async function fetchBank<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}
