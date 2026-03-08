/**
 * useScreenplay.ts — Core screenplay state built around an active document
 */
import { useState, useCallback, useMemo } from 'react';
import { parseScreenplay } from '../parsers/fountainParser';
import type { EditorState, ElementType, TitlePageData } from '../types/screenplay';

export interface UseScreenplayReturn {
  state: EditorState;
  titleData: TitlePageData | null;
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  isolateScene: (sceneIndex: number | null) => void;
  setCurrentScene: (sceneIndex: number | null) => void;
  forceElementType: (targetLineNum: number, content: string, type: ElementType) => string;
  markSaved: () => void;
}

export function useScreenplay(
  content: string,
  title: string,
  onContentChange: (c: string) => void,
  onTitleChange: (t: string) => void,
): UseScreenplayReturn {
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isolatedSceneIndex, setIsolatedSceneIndex] = useState<number | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number | null>(null);

  const parsed = useMemo(() => parseScreenplay(content), [content]);

  const updateContent = useCallback((newContent: string) => {
    onContentChange(newContent);
    setIsDirty(true);
  }, [onContentChange]);

  const updateTitle = useCallback((t: string) => {
    onTitleChange(t);
    setIsDirty(true);
  }, [onTitleChange]);

  const isolateScene = useCallback((idx: number | null) => {
    setIsolatedSceneIndex(idx);
  }, []);

  const markSaved = useCallback(() => {
    setIsDirty(false);
    setLastSaved(Date.now());
  }, []);

  /**
   * Force a specific line to be a given element type by inserting
   * Fountain prefix syntax that overrides auto-detection.
   */
  const forceElementType = useCallback((
    targetLineNum: number,
    currentContent: string,
    type: ElementType,
  ): string => {
    const lines = currentContent.split('\n');
    const line = lines[targetLineNum] ?? '';
    const bare = line.replace(/^[.!@~>]/, '').trim();

    const prefixMap: Partial<Record<ElementType, (t: string) => string>> = {
      scene_heading:  (t) => `.${t}`,
      transition:     (t) => `>${t}`,
      action:         (t) => `!${t}`,
      // character, dialogue, parenthetical rely on context — no forced prefix in Fountain
    };

    const transform = prefixMap[type];
    lines[targetLineNum] = transform ? transform(bare) : bare;
    return lines.join('\n');
  }, []);

  const state: EditorState = {
    title,
    author: '',
    content,
    elements: parsed.elements,
    scenes: parsed.scenes,
    currentSceneIndex,
    isolatedSceneIndex,
    cursorLine: 0,
    wordCount: parsed.wordCount,
    pageCount: parsed.pageCount,
    isDirty,
    lastSaved,
  };

  return {
    state,
    titleData: parsed.titleData,
    updateContent,
    updateTitle,
    isolateScene,
    setCurrentScene: setCurrentSceneIndex,
    forceElementType,
    markSaved,
  };
}
