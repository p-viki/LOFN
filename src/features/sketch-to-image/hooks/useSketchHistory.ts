import { useCallback, useMemo, useState } from 'react'
import type { Stroke } from '../types'

interface SketchHistoryState {
  /** 当前画布上的笔画 */
  strokes: Stroke[]
  /** 撤销栈：栈顶为最近一次被撤销的笔画 */
  redo: Stroke[]
}

const EMPTY_HISTORY: SketchHistoryState = { strokes: [], redo: [] }

/**
 * 画板历史记录。
 *
 * 历史以「一次完整笔画」为单位记录，绘制过程中的每个 pointermove
 * 不会产生快照，避免大量无意义的 React 状态历史。
 */
export function useSketchHistory() {
  const [history, setHistory] = useState<SketchHistoryState>(EMPTY_HISTORY)

  /** 提交一笔（会清空 redo 栈） */
  const commitStroke = useCallback((stroke: Stroke) => {
    setHistory((prev) => ({ strokes: [...prev.strokes, stroke], redo: [] }))
  }, [])

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.strokes.length === 0) return prev
      const removed = prev.strokes[prev.strokes.length - 1]
      return {
        strokes: prev.strokes.slice(0, -1),
        redo: [...prev.redo, removed],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.redo.length === 0) return prev
      return {
        strokes: [...prev.strokes, prev.redo[prev.redo.length - 1]],
        redo: prev.redo.slice(0, -1),
      }
    })
  }, [])

  const clear = useCallback(() => {
    setHistory(EMPTY_HISTORY)
  }, [])

  return useMemo(
    () => ({
      strokes: history.strokes,
      canUndo: history.strokes.length > 0,
      canRedo: history.redo.length > 0,
      commitStroke,
      undo,
      redo,
      clear,
    }),
    [history, commitStroke, undo, redo, clear]
  )
}
