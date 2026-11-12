/** 内置调色板：像素画的风格主要由配色决定，因此提供几种经典配色供切换 */

import type { PaletteId } from '../types'

export interface PaletteOption {
  id: PaletteId
  name: string
  /** null 表示从画面自身的颜色分布中自动提取 */
  colors: string[] | null
}

export const PALETTES: PaletteOption[] = [
  {
    id: 'auto',
    name: '自动提取 · 画面主色（推荐）',
    colors: null,
  },
  {
    id: 'pico8',
    name: 'PICO-8 · 16 色',
    colors: [
      '#000000',
      '#1d2b53',
      '#7e2553',
      '#008751',
      '#ab5236',
      '#5f574f',
      '#c2c3c7',
      '#fff1e8',
      '#ff004d',
      '#ffa300',
      '#ffec27',
      '#00e436',
      '#29adff',
      '#83769c',
      '#ff77a8',
      '#ffccaa',
    ],
  },
  {
    id: 'gameboy',
    name: 'Game Boy · 4 色',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  },
  {
    id: 'nes',
    name: 'NES · 16 色',
    colors: [
      '#000000',
      '#fcfcfc',
      '#bcbcbc',
      '#7c7c7c',
      '#3c3c3c',
      '#a4e4fc',
      '#3cbcfc',
      '#0078f8',
      '#0000fc',
      '#b8b8f8',
      '#f8b8f8',
      '#f878f8',
      '#f8a4c0',
      '#f0d0b0',
      '#e45c10',
      '#00a800',
    ],
  },
  {
    id: 'pastel',
    name: 'Cozy 柔光 · 16 色',
    colors: [
      '#1b2430',
      '#3d5a80',
      '#98c1d9',
      '#e0fbfc',
      '#ee6c4d',
      '#f7b267',
      '#f2e8cf',
      '#7fb069',
      '#4f772d',
      '#b56576',
      '#6d597a',
      '#c9ada7',
      '#f4f1de',
      '#e07a5f',
      '#81b29a',
      '#3d405b',
    ],
  },
  {
    id: 'mono',
    name: '单色报纸 · 4 色',
    colors: ['#111111', '#4a4a4a', '#9a9a9a', '#f4f1ea'],
  },
]

/**
 * 默认自动提取：参考图会保留原图主色，程序化场景会保留主题配色，
 * 内置调色板则用于追求特定复古风格。
 */
export const DEFAULT_PALETTE_ID: PaletteId = 'auto'

const PALETTE_BY_ID = new Map(PALETTES.map((palette) => [palette.id, palette]))

/** 取调色板颜色；返回 null 表示需要从画面中自动提取 */
export function paletteColors(id: PaletteId): string[] | null {
  const colors = PALETTE_BY_ID.get(id)?.colors
  return colors ? [...colors] : null
}

export function paletteName(id: PaletteId): string {
  return PALETTE_BY_ID.get(id)?.name ?? id
}
