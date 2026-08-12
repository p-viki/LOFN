import type { LsasQuestionProps } from './types'
import { fetchBank } from '../../lib/loadBank'

/** LSAS 量表题库 meta */
export interface LsasBankMeta {
  title?: string
  description?: string
  /** 计分配置：决定本套题的计算方式 */
  scoring: { mode: 'lsas' }
}

/** LSAS 量表题库（特殊结构：questions 为场景列表） */
export interface LsasBank {
  meta: LsasBankMeta
  questions: (LsasQuestionProps & { id: number })[]
}

const LSAS_BANK_URL = '/lsas.json'

/** 加载 LSAS 量表题库 */
export function fetchLsasBank(): Promise<LsasBank> {
  return fetchBank<LsasBank>(LSAS_BANK_URL)
}
