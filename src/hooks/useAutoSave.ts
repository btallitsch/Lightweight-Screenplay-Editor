/**
 * useAutoSave.ts — Periodic auto-save with version history
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { computeDiff } from '../utils/diff';
import type { ScreenplayVersion } from '../types/screenplay';

const STORAGE_KEY = 'fadein_versions';
const CONTENT_KEY = 'fadein_content';
const AUTO_SAVE_INTERVAL = 30_000; // 30 seconds
const MAX_VERSIONS = 20;

function loadVersions(): ScreenplayVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveVersions(versions: ScreenplayVersion[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(versions.slice(-MAX_VERSIONS))); }
  catch {}
}

export function loadSavedContent(): string | null {
  try { return localStorage.getItem(CONTENT_KEY); }
  catch { return null; }
}

export interface UseAutoSaveReturn {
  versions: ScreenplayVersion[];
  saveNow: (content: string, wordCount: number, pageCount: number) => void;
  restoreVersion: (id: string) => string | null;
  deleteVersion: (id: string) => void;
  clearHistory: () => void;
}

export function useAutoSave(
  content: string,
  wordCount: number,
  pageCount: number,
  onSaved?: () => void
): UseAutoSaveReturn {
  const [versions, setVersions] = useState<ScreenplayVersion[]>(loadVersions);
  const lastSavedContent = useRef<string>(content);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNow = useCallback((c: string, wc: number, pc: number) => {
    if (c === lastSavedContent.current && versions.length > 0) return;

    const prevVersions = loadVersions();
    const prev = prevVersions[prevVersions.length - 1];
    const diff = prev ? computeDiff(prev.content, c) : undefined;

    const newVersion: ScreenplayVersion = {
      id: `v_${Date.now()}`,
      timestamp: Date.now(),
      label: `Version ${prevVersions.length + 1}`,
      content: c,
      wordCount: wc,
      pageCount: pc,
      diff,
    };

    const updated = [...prevVersions, newVersion].slice(-MAX_VERSIONS);
    saveVersions(updated);
    setVersions(updated);
    lastSavedContent.current = c;

    try { localStorage.setItem(CONTENT_KEY, c); } catch {}
    onSaved?.();
  }, [versions.length, onSaved]);

  // Auto-save timer
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNow(content, wordCount, pageCount);
    }, AUTO_SAVE_INTERVAL);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [content, wordCount, pageCount, saveNow]);

  const restoreVersion = useCallback((id: string): string | null => {
    const v = versions.find(v => v.id === id);
    return v?.content ?? null;
  }, [versions]);

  const deleteVersion = useCallback((id: string) => {
    const updated = versions.filter(v => v.id !== id);
    setVersions(updated);
    saveVersions(updated);
  }, [versions]);

  const clearHistory = useCallback(() => {
    setVersions([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { versions, saveNow, restoreVersion, deleteVersion, clearHistory };
}
