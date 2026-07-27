import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 className，结合 clsx 条件类名 + tailwind-merge 去重
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
