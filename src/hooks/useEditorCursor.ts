/**
 * useEditorCursor.ts — Tracks cursor position and current element type
 */
import { useState, useCallback, useRef } from 'react';
import type { ElementType, ScreenplayElement } from '../types/screenplay';

export interface CursorState {
  line: number;
  col: number;
  elementType: ElementType;
  elementId: string | null;
}

export function useEditorCursor(elements: ScreenplayElement[]) {
  const [cursor, setCursor] = useState<CursorState>({
    line: 0, col: 0, elementType: 'action', elementId: null,
  });
  const lastLineRef = useRef<number>(-1);

  const updateFromTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    const pos = textarea.selectionStart;
    const textBefore = textarea.value.slice(0, pos);
    const lineNum = textBefore.split('\n').length - 1;
    const col = pos - textBefore.lastIndexOf('\n') - 1;

    if (lineNum === lastLineRef.current) return; // no line change
    lastLineRef.current = lineNum;

    // Find the element at this line
    const el = [...elements].reverse().find(e => e.lineNumber <= lineNum);
    setCursor({
      line: lineNum,
      col,
      elementType: el?.type ?? 'action',
      elementId: el?.id ?? null,
    });
  }, [elements]);

  return { cursor, updateFromTextarea };
}
