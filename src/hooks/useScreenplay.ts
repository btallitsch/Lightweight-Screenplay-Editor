/**
 * useScreenplay.ts — Core state management for the screenplay editor
 */
import { useState, useCallback, useMemo } from 'react';
import { parseScreenplay } from '../parsers/fountainParser';
import type { EditorState, TitlePageData } from '../types/screenplay';

const DEFAULT_CONTENT = `INT. COFFEE SHOP - DAY

A cozy, dimly lit corner. Rain streaks the windows.

ALEX (30s, disheveled but sharp) stares at a blank notebook.

BARISTA
Can I get you anything else?

ALEX
(without looking up)
Another hour of silence.

The BARISTA smiles, leaves. Alex flips the notebook shut.

CUT TO:`;

export interface UseScreenplayReturn {
  state: EditorState;
  titleData: TitlePageData | null;
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  updateAuthor: (author: string) => void;
  isolateScene: (sceneIndex: number | null) => void;
  setCurrentScene: (sceneIndex: number | null) => void;
  markSaved: () => void;
}

export function useScreenplay(initialContent = DEFAULT_CONTENT): UseScreenplayReturn {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState('Untitled Screenplay');
  const [author, setAuthor] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isolatedSceneIndex, setIsolatedSceneIndex] = useState<number | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number | null>(null);

  const parsed = useMemo(() => parseScreenplay(content), [content]);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  }, []);

  const updateTitle = useCallback((t: string) => {
    setTitle(t);
    setIsDirty(true);
  }, []);

  const updateAuthor = useCallback((a: string) => {
    setAuthor(a);
    setIsDirty(true);
  }, []);

  const isolateScene = useCallback((idx: number | null) => {
    setIsolatedSceneIndex(idx);
  }, []);

  const markSaved = useCallback(() => {
    setIsDirty(false);
    setLastSaved(Date.now());
  }, []);

  const state: EditorState = {
    title,
    author,
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
    updateAuthor,
    isolateScene,
    setCurrentScene: setCurrentSceneIndex,
    markSaved,
  };
}
