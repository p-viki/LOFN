/**
 * Sketch to Image 功能的领域类型。
 *
 * 画板同时维护「矢量笔画数据」与「Canvas 像素结果」：
 * 前者用于撤销/重做与状态恢复，后者仅在需要时（导出 PNG）生成。
 */

/** 单条笔画。points 为扁平坐标数组 [x1, y1, x2, y2, ...]，单位为画板坐标（与 CSS 像素 1:1） */
export interface Stroke {
  id: string
  points: number[]
  color: string
  width: number
}

/** 画板快照 */
export interface Sketch {
  width: number
  height: number
  strokes: Stroke[]
}

/** 导出的 PNG 结果：dataUrl 用于上传，width/height 为导出后的实际像素尺寸 */
export interface ExportedSketch {
  dataUrl: string
  width: number
  height: number
}

/** 画板对外暴露的命令式能力 */
export interface SketchCanvasHandle {
  /** 将当前画板导出为白底 PNG；画板未就绪时返回 null */
  exportSketch: () => ExportedSketch | null
}
