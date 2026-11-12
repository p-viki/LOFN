/**
 * 确定性伪随机数：同一个 seed 必须得到完全相同的画面，
 * 这样「同一段文案 + 同一组参数」每次生成的结果都可复现。
 */

export interface Random {
  /** [0, 1) */
  next: () => number
  /** [min, max] 内的整数 */
  int: (min: number, max: number) => number
  /** [min, max) 内的浮点数 */
  range: (min: number, max: number) => number
  /** 随机取一个元素（数组不能为空） */
  pick: <T>(items: readonly T[]) => T
  /** 以 p 的概率返回 true */
  chance: (p: number) => boolean
}

export function createRandom(seed: number): Random {
  let state = (seed >>> 0) || 1

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    range: (min, max) => min + next() * (max - min),
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (p) => next() < p,
  }
}

/** 字符串 → 32 位种子（FNV-1a），让文案本身成为随机源之一 */
export function hashText(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** 用户点「随机」时使用的新种子 */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}
