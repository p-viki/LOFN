/**
 * GitHub API 服务（后续接入获取开源贡献统计）
 */
export async function getGithubStats(username: string) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`)
    if (!response.ok) throw new Error('Failed to fetch GitHub data')
    return await response.json()
  } catch (error) {
    console.error('GitHub API error:', error)
    return null
  }
}
