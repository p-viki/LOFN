/**
 * 场景配色主题：程序化合成时按「语义角色」取色，
 * 这样同一个渲染器在白天/黄昏/夜晚/雪天都能得到协调的画面。
 */

import type { Rgb } from './color'
import { hexToRgb, mix, rgbToHex } from './color'
import type { ScenePlan, TimeOfDay } from '../types'

export interface Theme {
  /** 天空由上到下 */
  skyTop: string
  skyBottom: string
  /** 日月与光晕 */
  celestial: string
  glow: string
  cloud: string
  cloudShade: string
  /** 远景 / 中景地貌 */
  far: string
  mid: string
  /** 地面与草地 */
  ground: string
  groundShade: string
  plant: string
  plantShade: string
  /** 建筑 */
  structure: string
  structureShade: string
  roof: string
  window: string
  /** 水面 */
  water: string
  waterShade: string
  foam: string
  /** 点缀色与最深色（描边/剪影/飞鸟） */
  accent: string
  ink: string
}

export type ThemeColors = Record<keyof Theme, Rgb>

export const THEMES: Record<TimeOfDay, Theme> = {
  day: {
    skyTop: '#4aa8e0',
    skyBottom: '#c4ecf9',
    celestial: '#fff4b8',
    glow: '#ffe27a',
    cloud: '#ffffff',
    cloudShade: '#d3e4f0',
    far: '#8aa9c9',
    mid: '#5d7fa6',
    ground: '#6fae4f',
    groundShade: '#4d8340',
    plant: '#3f7d3a',
    plantShade: '#2b5c2c',
    structure: '#e2c48f',
    structureShade: '#a8814f',
    roof: '#b55540',
    window: '#ffdf8a',
    water: '#3f92d2',
    waterShade: '#2a6ca6',
    foam: '#eaf6ff',
    accent: '#ff8a5c',
    ink: '#20263a',
  },
  dawn: {
    skyTop: '#4b4a86',
    skyBottom: '#ffbf8a',
    celestial: '#fff0c0',
    glow: '#ffcf86',
    cloud: '#ffdcc4',
    cloudShade: '#d9a98f',
    far: '#7d739f',
    mid: '#5c5680',
    ground: '#6c9c5c',
    groundShade: '#4a7546',
    plant: '#457b45',
    plantShade: '#2c5530',
    structure: '#d4ac82',
    structureShade: '#9a7551',
    roof: '#a04c3d',
    window: '#ffd98a',
    water: '#4c86ac',
    waterShade: '#316087',
    foam: '#e9f4ff',
    accent: '#ff9c6e',
    ink: '#241f38',
  },
  dusk: {
    skyTop: '#2b3568',
    skyBottom: '#ff9a63',
    celestial: '#fff0c8',
    glow: '#ffb26b',
    cloud: '#f7b98d',
    cloudShade: '#c07f6a',
    far: '#5d4a75',
    mid: '#41345c',
    ground: '#4f7a55',
    groundShade: '#35573e',
    plant: '#3a6440',
    plantShade: '#24422c',
    structure: '#b98a68',
    structureShade: '#7d5a45',
    roof: '#8e3f3c',
    window: '#ffcb73',
    water: '#3c6f9c',
    waterShade: '#254a72',
    foam: '#dfeaff',
    accent: '#ff8358',
    ink: '#1b1730',
  },
  night: {
    skyTop: '#070c1e',
    skyBottom: '#1b2750',
    celestial: '#f4f7ff',
    glow: '#93a8ff',
    cloud: '#2b3560',
    cloudShade: '#1d2445',
    far: '#242c4d',
    mid: '#1a2140',
    ground: '#24402f',
    groundShade: '#16291f',
    plant: '#1f4033',
    plantShade: '#132a22',
    structure: '#4a4a6b',
    structureShade: '#333350',
    roof: '#5a3b4d',
    window: '#ffd98a',
    water: '#16304f',
    waterShade: '#0d1f38',
    foam: '#5b7ba6',
    accent: '#f0b163',
    ink: '#05070f',
  },
  storm: {
    skyTop: '#3c4757',
    skyBottom: '#7b8a99',
    celestial: '#d8e3ee',
    glow: '#aebdcc',
    cloud: '#5d6b7a',
    cloudShade: '#455160',
    far: '#4f5c6b',
    mid: '#3c4753',
    ground: '#4a6b4f',
    groundShade: '#334c3a',
    plant: '#3c5c42',
    plantShade: '#28402f',
    structure: '#8f8577',
    structureShade: '#5f584e',
    roof: '#7a4a45',
    window: '#ffd07a',
    water: '#41566b',
    waterShade: '#2c3c4d',
    foam: '#c7d5e2',
    accent: '#9fd0ff',
    ink: '#1b2230',
  },
  snow: {
    skyTop: '#8fb8d8',
    skyBottom: '#e8f4fb',
    celestial: '#fffbe8',
    glow: '#ffe9b0',
    cloud: '#ffffff',
    cloudShade: '#d8e6f0',
    far: '#b6cbdd',
    mid: '#8fa9c0',
    ground: '#f2f7fb',
    groundShade: '#d6e4ef',
    plant: '#3f5f4f',
    plantShade: '#2b4638',
    structure: '#e2c9a0',
    structureShade: '#a8814f',
    roof: '#b55540',
    window: '#ffdf8a',
    water: '#7fa8c8',
    waterShade: '#5d87ab',
    foam: '#ffffff',
    accent: '#ff8a5c',
    ink: '#26303f',
  },
}

/** 太空场景直接给定配色，不受时间影响 */
export const SPACE_THEME: Theme = {
  skyTop: '#04040f',
  skyBottom: '#151a3d',
  celestial: '#ffffff',
  glow: '#8fa6ff',
  cloud: '#2a2f5c',
  cloudShade: '#1b1f42',
  far: '#4b3f7a',
  mid: '#31285c',
  ground: '#2a2f5c',
  groundShade: '#1b1f42',
  plant: '#4b7a63',
  plantShade: '#2f5244',
  structure: '#c9cfe4',
  structureShade: '#858ba6',
  roof: '#e06a6a',
  window: '#ffe9a8',
  water: '#2b3a76',
  waterShade: '#1b2550',
  foam: '#9fb4ff',
  accent: '#ffb454',
  ink: '#02030a',
}

export function themeFor(timeOfDay: TimeOfDay, isSpace: boolean): Theme {
  return isSpace ? SPACE_THEME : THEMES[timeOfDay]
}

/** 两个十六进制颜色按比例混合 */
export function hexMix(from: string, to: string, t: number): string {
  return rgbToHex(mix(hexToRgb(from), hexToRgb(to), t))
}

/**
 * AI 给的画面配色叠加到时间氛围主题上：
 * 只覆盖它明确给出的项，其余（屋顶、窗户、云影等）仍沿用主题色，
 * 这样画面既有 AI 理解的光色，也不会因为缺项而崩掉。
 */
export function themeForPlan(plan: ScenePlan): Theme {
  const isSpace = plan.objects.some(
    (object) => object.kind === 'rocket' || object.kind === 'planet'
  )
  const theme: Theme = { ...themeFor(plan.timeOfDay, isSpace) }
  const { palette } = plan

  if (palette.skyTop) theme.skyTop = palette.skyTop
  if (palette.skyBottom) {
    theme.skyBottom = palette.skyBottom
    theme.glow = hexMix(theme.glow, palette.skyBottom, 0.4)
  }
  if (palette.ground) {
    theme.ground = palette.ground
    theme.groundShade = hexMix(palette.ground, '#000000', 0.32)
    theme.plant = hexMix(palette.ground, '#000000', 0.22)
    theme.plantShade = hexMix(palette.ground, '#000000', 0.5)
  }
  if (palette.water) {
    theme.water = palette.water
    theme.waterShade = hexMix(palette.water, '#000000', 0.32)
    theme.foam = hexMix(palette.water, '#ffffff', 0.72)
  }
  if (palette.accent) theme.accent = palette.accent

  return theme
}

/** 把十六进制主题转成绘制时用的 RGB 表，避免逐像素重复解析 */
export function mapTheme(theme: Theme): ThemeColors {
  const colors = {} as ThemeColors
  for (const key of Object.keys(theme) as (keyof Theme)[]) {
    colors[key] = hexToRgb(theme[key])
  }
  return colors
}
