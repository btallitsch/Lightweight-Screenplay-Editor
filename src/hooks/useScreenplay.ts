/**
 * useScreenplay.ts — Core screenplay state
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
  forceElementType: (lineNum: number, content: string, type: ElementType) => string;
  markSaved: () => void;
}

export function useScreenplay(
  content: string,
  title: string,
  onContentChange: (c: string) => void,
  onTitleChange: (t: string) => void,
): UseScreenplayReturn {
  const [isDirty, setIsDirty]             = useState(false);
  const [lastSaved, setLastSaved]         = useState<number | null>(null);
  const [isolatedSceneIndex, setIsolated] = useState<number | null>(null);
  const [currentSceneIndex, setScene]     = useState<number | null>(null);

  const parsed = useMemo(() => parseScreenplay(content), [content]);

  const updateContent = useCallback((c: string) => {
    onContentChange(c);
    setIsDirty(true);
  }, [onContentChange]);

  const updateTitle = useCallback((t: string) => {
    onTitleChange(t);
    setIsDirty(true);
  }, [onTitleChange]);

  const markSaved = useCallback(() => {
    setIsDirty(false);
    setLastSaved(Date.now());
  }, []);

  /**
   * forceElementType: inserts/removes Fountain forced-type prefixes on a line.
   * Fountain forced syntax:
   *   . prefix  → scene_heading
   *   @ prefix  → character
   *   > prefix  → transition
   *   ! prefix  → action (strips any other prefix)
   *   (text)    → parenthetical
   *   [[text]]  → note
   */
  const forceElementType = useCallback((lineNum: number, currentContent: string, type: ElementType): string => {
    const lines = currentContent.split('\n');
    if (lineNum < 0 || lineNum >= lines.length) return currentContent;

    // Strip any existing forced prefix
    const bare = lines[lineNum].replace(/^[@.>!]\s*/, '').trim();

    switch (type) {
      case 'scene_heading':
        lines[lineNum] = '.' + bare;
        break;
      case 'character':
        lines[lineNum] = '@' + bare.toUpperCase();
        break;
      case 'transition':
        lines[lineNum] = '>' + bare;
        break;
      case 'action':
        // If it's already plain (no prefix), nothing to do
        // If it had a forced prefix, bare already stripped it
        lines[lineNum] = bare || lines[lineNum];
        break;
      case 'parenthetical':
        lines[lineNum] = bare.startsWith('(') ? bare : `(${bare})`;
        break;
      case 'note':
        lines[lineNum] = bare.startsWith('[[') ? bare : `[[${bare}]]`;
        break;
      case 'dialogue':
        // Fountain has no forced dialogue prefix — just strip forced prefixes
        // so the context (follows character name) can classify it
        lines[lineNum] = bare;
        break;
      default:
        lines[lineNum] = bare;
    }

    return lines.join('\n');
  }, []);

  const state: EditorState = {
    title,
    author: '',
    content,
    elements:          parsed.elements,
    scenes:            parsed.scenes,
    currentSceneIndex,
    isolatedSceneIndex,
    cursorLine:        0,
    wordCount:         parsed.wordCount,
    pageCount:         parsed.pageCount,
    isDirty,
    lastSaved,
  };

  return {
    state, titleData: parsed.titleData,
    updateContent, updateTitle,
    isolateScene: setIsolated, setCurrentScene: setScene,
    forceElementType, markSaved,
  };
}
