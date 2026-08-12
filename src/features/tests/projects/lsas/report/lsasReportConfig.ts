/**
 * LSAS 报告配置（配置驱动报表）。
 *
 * 修改本文件即可调整报告的展示，无需改动组件代码：
 * - sections: 报告模块列表（按数组顺序渲染），通过 enabled 控制显示/隐藏
 * - 模块类型 type 决定渲染内容，title/subtitle 决定标题文案
 * - quadrant 模块通过 subscale 指定渲染总体 / SI / PS 四象限
 * - combined 模块渲染 PS × SI 综合类型画像（16 型）
 * - overview 模块的 factors 可配置因子得分卡片
 */

export type LsasFactorKey = 'fear' | 'avoidance' | 'si' | 'ps'

export type LsasFactorIconKey = 'heart' | 'shuffle' | 'users' | 'mic'

export interface LsasFactorConfig {
  /** 因子标识，决定读取哪个得分 */
  key: LsasFactorKey
  /** 卡片显示名称 */
  label: string
  /** 图标 key（映射到 lucide 图标） */
  icon: LsasFactorIconKey
  /** 满分（仅展示用） */
  max: number
}

export type LsasReportSectionType = 'overview' | 'quadrant' | 'combined' | 'scene' | 'advice'

export interface LsasReportSectionConfig {
  /** 模块类型 */
  type: LsasReportSectionType
  /** 是否显示该模块 */
  enabled: boolean
  /** 模块标题 */
  title: string
  /** 模块副标题 */
  subtitle: string
  /** 仅 quadrant 模块使用：指定子量表（缺省为总表；si / ps 分别生成对应四象限） */
  subscale?: 'si' | 'ps'
  /** 仅 overview 模块使用：因子得分卡片配置 */
  factors?: LsasFactorConfig[]
}

export interface LsasReportConfig {
  /** 报告模块（按数组顺序渲染） */
  sections: LsasReportSectionConfig[]
  /** 总分后的单位文案（如 "/ 144 分"） */
  totalLabel: string
  /** 是否显示「重新测试」按钮 */
  showReset: boolean
  /** 底部免责声明文案 */
  disclaimer: string
}

export const LSAS_REPORT_CONFIG: LsasReportConfig = {
  totalLabel: '/ 144 分',
  showReset: true,
  disclaimer:
    '本量表结果仅供自我评估与了解参考，不构成医学诊断。如有困扰，请咨询专业心理医生或精神科医师。',
  sections: [
    {
      type: 'overview',
      enabled: true,
      title: '综合评价',
      subtitle: '总分 + 严重程度等级',
      factors: [
        { key: 'fear', label: '内心体感', icon: 'heart', max: 72 },
        { key: 'avoidance', label: '行为回避', icon: 'shuffle', max: 72 },
        { key: 'si', label: '社交互动 (SI)', icon: 'users', max: 66 },
        { key: 'ps', label: '表演 (PS)', icon: 'mic', max: 78 },
      ],
    },
    {
      type: 'quadrant',
      enabled: true,
      title: '维度交叉诊断',
      subtitle: '总体画像：内心消耗 × 行为回避',
    },
    {
      type: 'quadrant',
      enabled: true,
      subscale: 'si',
      title: 'SI 维度交叉诊断',
      subtitle: '社交互动场景：内心消耗 × 行为回避',
    },
    {
      type: 'quadrant',
      enabled: true,
      subscale: 'ps',
      title: 'PS 维度交叉诊断',
      subtitle: '表演场景：内心消耗 × 行为回避',
    },
    {
      type: 'scene',
      enabled: true,
      title: '触发场景画像',
      subtitle: '社交互动 (SI) vs 表演 (PS) 对比',
    },
    {
      type: 'combined',
      enabled: true,
      title: '综合类型画像',
      subtitle: 'PS（表演）× SI（社交互动）双维组合类型 · 16 型',
    },
    {
      type: 'advice',
      enabled: true,
      title: '定制化建议',
      subtitle: '针对你的画像给出的行动参考',
    },
  ],
}
