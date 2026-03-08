/**
 * useEditorCursor.ts
 * Tracks cursor line and resolves the ScreenplayElement type at that line.
 * Uses array index (not lineNumber property) so it's robust in isolation mode.
 */
import { useState, useCallback } from 'react';
import type { ElementType, ScreenplayElement } from '../types/screenplay';

export interface CursorState {
  line: number;
  col: number;
  elementType: ElementType;
  elementId: string | null;
}

export function useEditorCursor(elements: ScreenplayElement[], isolatedSceneIndex: number | null) {
  const [cursor, setCursor] = useState<CursorState>({
    line: 0, col: 0, elementType: 'action', elementId: null,
  });

  const updateFromTextarea = useCallback((ta: HTMLTextAreaElement) => {
    const pos    = ta.selectionStart;
    const before = ta.value.slice(0, pos);
    const lineIdx = before.split('\n').length - 1;
    const col     = pos - before.lastIndexOf('\n') - 1;

    // Resolve against the elements visible in the textarea
    // In isolation mode, elements are filtered — so index into the filtered array
    const visible = isolatedSceneIndex !== null
      ? elements.filter(e => e.sceneIndex === isolatedSceneIndex)
      : elements;

    // Clamp to valid range
    const el = visible[Math.min(lineIdx, visible.length - 1)];

    setCursor(prev => {
      const next: CursorState = {
        line: lineIdx,
        col,
        elementType: el?.type ?? 'action',
        elementId: el?.id ?? null,
      };
      // Avoid re-render if nothing changed
      if (prev.line === next.line && prev.elementType === next.elementType) return prev;
      return next;
    });
  }, [elements, isolatedSceneIndex]);

  return { cursor, updateFromTextarea };
}
