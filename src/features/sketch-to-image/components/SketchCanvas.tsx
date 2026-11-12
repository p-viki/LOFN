import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import type Konva from 'konva'
import { Layer, Line, Rect, Stage } from 'react-konva'
import type { SketchCanvasHandle, Stroke } from '../types'

/** 画板背景：导出的 PNG 必须是白底，避免透明区域影响 AI 理解 */
const BACKGROUND_COLOR = '#ffffff'
/** 导出目标边长（px）：无论画板显示尺寸多大，都输出固定尺寸的方形 PNG */
const EXPORT_SIZE = 1024
/** 导出倍率上下限：避免极端尺寸下图像糊掉或体积失控 */
const MIN_PIXEL_RATIO = 1
const MAX_PIXEL_RATIO = 4
/** 相邻采样点最小间距（画板坐标），过滤指针抖动产生的密集点 */
const MIN_POINT_DISTANCE = 1.2

interface SketchCanvasProps {
  /** 已提交的笔画 */
  strokes: Stroke[]
  brushSize: number
  brushColor: string
  onCommitStroke: (stroke: Stroke) => void
}

function clampToCanvas(value: number, max: number): number {
  if (value < 0) return 0
  if (value > max) return max
  return value
}

/** 单条笔画：纯展示，不参与命中检测 */
function StrokeLine({ stroke }: { stroke: Stroke }) {
  return (
    <Line
      points={stroke.points}
      stroke={stroke.color}
      strokeWidth={stroke.width}
      lineCap="round"
      lineJoin="round"
      listening={false}
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
    />
  )
}

/**
 * 已完成的笔画单独成组并 memo：
 * 绘制过程中 strokes 引用不变，指针移动不会重复 diff 这些 Line。
 */
const FinishedStrokes = memo(function FinishedStrokes({ strokes }: { strokes: Stroke[] }) {
  return (
    <>
      {strokes.map((stroke) => (
        <StrokeLine key={stroke.id} stroke={stroke} />
      ))}
    </>
  )
})

/**
 * 画板：支持鼠标 / 触摸 / 触控笔绘制。
 *
 * 坐标策略：Stage 的逻辑尺寸 = 容器的 CSS 像素尺寸（1:1，不做 CSS 缩放），
 * 因此 getPointerPosition() 的结果可以直接作为绘制坐标，所见即所画。
 * 导出时按 EXPORT_SIZE 计算 pixelRatio，PNG 尺寸固定为 1024 × 1024。
 *
 * 注意：笔画按画板坐标存储，改变容器宽度（旋转屏幕 / 缩放窗口）后，
 * 已有笔画不会等比缩放，属于当前 MVP 的已知行为。
 */
export const SketchCanvas = forwardRef<SketchCanvasHandle, SketchCanvasProps>(function SketchCanvas(
  { strokes, brushSize, brushColor, onCommitStroke },
  ref
) {
  const stageRef = useRef<Konva.Stage>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  /** 正在绘制的一笔（同时用 ref 保存，供高频事件读取，避免闭包过期） */
  const activeStrokeRef = useRef<Stroke | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const strokeSeqRef = useRef(0)

  const [size, setSize] = useState(0)
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null)

  // 画板尺寸跟随容器宽度（1:1 正方形），保证移动端自适应
  useEffect(() => {
    const el = surfaceRef.current
    if (!el) return

    const update = () => {
      const width = Math.round(el.clientWidth)
      if (width > 0) setSize(width)
    }

    update()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const finishStroke = useCallback(() => {
    const stroke = activeStrokeRef.current
    activeStrokeRef.current = null
    pointerIdRef.current = null
    if (!stroke) return
    setActiveStroke(null)
    onCommitStroke(stroke)
  }, [onCommitStroke])

  /** pointerdown：创建新笔画 */
  const startStroke = useCallback(
    (evt: PointerEvent) => {
      // 只响应主指针的主键（鼠标左键 / 单指触摸 / 触控笔笔尖）
      if (!evt.isPrimary || evt.button !== 0) return

      const stage = stageRef.current
      const position = stage?.getPointerPosition()
      if (!stage || !position) return

      const x = clampToCanvas(position.x, stage.width())
      const y = clampToCanvas(position.y, stage.height())

      const stroke: Stroke = {
        id: `stroke-${(strokeSeqRef.current += 1)}`,
        // 首点重复一次，保证「点一下」也能留下一个圆点
        points: [x, y, x, y],
        color: brushColor,
        width: brushSize,
      }

      activeStrokeRef.current = stroke
      pointerIdRef.current = evt.pointerId
      setActiveStroke(stroke)
    },
    [brushColor, brushSize]
  )

  /** pointermove：读取最新指针位置并追加采样点（坐标已由外部同步） */
  const extendStroke = useCallback(() => {
    const stroke = activeStrokeRef.current
    const stage = stageRef.current
    if (!stroke || !stage) return

    const position = stage.getPointerPosition()
    if (!position) return

    const x = clampToCanvas(position.x, stage.width())
    const y = clampToCanvas(position.y, stage.height())

    const points = stroke.points
    const dx = x - points[points.length - 2]
    const dy = y - points[points.length - 1]
    if (dx * dx + dy * dy < MIN_POINT_DISTANCE * MIN_POINT_DISTANCE) return

    const next: Stroke = { ...stroke, points: [...points, x, y] }
    activeStrokeRef.current = next
    setActiveStroke(next)
  }, [])

  /**
   * 在 window 上承接绘制过程：
   * Konva 的 DOM 监听绑定在 .konvajs-content 上，指针一旦移出该节点就收不到事件，
   * 因此移动/结束统一由 window 处理，并用 setPointersPositions 手动同步画板坐标
   * （画板外同样有效），保证指针在画板内外的坐标准确且不会卡在绘制状态。
   */
  useEffect(() => {
    const handlePointerMove = (evt: PointerEvent) => {
      if (pointerIdRef.current !== evt.pointerId) return
      stageRef.current?.setPointersPositions(evt)
      extendStroke()
    }

    const handlePointerEnd = (evt: PointerEvent) => {
      if (pointerIdRef.current !== evt.pointerId) return
      finishStroke()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)
    }
  }, [extendStroke, finishStroke])

  useImperativeHandle(
    ref,
    () => ({
      exportSketch: () => {
        const stage = stageRef.current
        if (!stage) return null

        // 画板显示尺寸随容器变化，导出时统一放大到 EXPORT_SIZE
        const pixelRatio = Math.min(
          Math.max(EXPORT_SIZE / stage.width(), MIN_PIXEL_RATIO),
          MAX_PIXEL_RATIO
        )

        return {
          dataUrl: stage.toDataURL({ pixelRatio }),
          width: Math.round(stage.width() * pixelRatio),
          height: Math.round(stage.height() * pixelRatio),
        }
      },
    }),
    []
  )

  const isEmpty = strokes.length === 0 && activeStroke === null

  return (
    <div className="lofn-sketch-canvas">
      <div ref={surfaceRef} className="lofn-sketch-canvas__surface">
        {size > 0 && (
          <Stage
            ref={stageRef}
            width={size}
            height={size}
            onPointerDown={(evt) => startStroke(evt.evt)}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
          >
            <Layer>
              <Rect
                x={0}
                y={0}
                width={size}
                height={size}
                fill={BACKGROUND_COLOR}
                listening={false}
              />
              <FinishedStrokes strokes={strokes} />
              {activeStroke && <StrokeLine stroke={activeStroke} />}
            </Layer>
          </Stage>
        )}

        {isEmpty && <p className="lofn-sketch-canvas__hint">在这里画出你的想法</p>}
      </div>
    </div>
  )
})
