/**
 * useDocuments.ts — Multi-document management
 */
import { useState, useCallback } from 'react';

export interface ScreenplayDoc {
  id: string;
  title: string;
  author: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const DOCS_KEY = 'fadein_documents';
const ACTIVE_KEY = 'fadein_active_doc';

const DEFAULT_DOC: ScreenplayDoc = {
  id: 'doc_default',
  title: 'Untitled Screenplay',
  author: '',
  content: `INT. COFFEE SHOP - DAY

A cozy, dimly lit corner. Rain streaks the windows.

ALEX (30s, disheveled but sharp) stares at a blank notebook.

BARISTA
Can I get you anything else?

ALEX
(without looking up)
Another hour of silence.

The BARISTA smiles, leaves. Alex flips the notebook shut.

CUT TO:`,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

function loadDocs(): ScreenplayDoc[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_DOC];
  } catch { return [DEFAULT_DOC]; }
}

function saveDocs(docs: ScreenplayDoc[]): void {
  try { localStorage.setItem(DOCS_KEY, JSON.stringify(docs)); } catch {}
}

function loadActiveId(): string {
  try { return localStorage.getItem(ACTIVE_KEY) ?? 'doc_default'; } catch { return 'doc_default'; }
}

export function useDocuments() {
  const [docs, setDocs] = useState<ScreenplayDoc[]>(loadDocs);
  const [activeId, setActiveId] = useState<string>(loadActiveId);

  const activeDoc = docs.find(d => d.id === activeId) ?? docs[0];

  const updateActive = useCallback((changes: Partial<ScreenplayDoc>) => {
    setDocs(prev => {
      const next = prev.map(d =>
        d.id === activeId ? { ...d, ...changes, updatedAt: Date.now() } : d
      );
      saveDocs(next);
      return next;
    });
  }, [activeId]);

  const createDoc = useCallback(() => {
    const id = `doc_${Date.now()}`;
    const newDoc: ScreenplayDoc = {
      id,
      title: 'Untitled Screenplay',
      author: '',
      content: `INT. NEW SCENE - DAY\n\nAction description here.\n\nCHARACTER\nDialogue here.\n`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDocs(prev => {
      const next = [...prev, newDoc];
      saveDocs(next);
      return next;
    });
    setActiveId(id);
    try { localStorage.setItem(ACTIVE_KEY, id); } catch {}
  }, []);

  const switchDoc = useCallback((id: string) => {
    setActiveId(id);
    try { localStorage.setItem(ACTIVE_KEY, id); } catch {}
  }, []);

  const deleteDoc = useCallback((id: string) => {
    setDocs(prev => {
      if (prev.length <= 1) return prev; // never delete last doc
      const next = prev.filter(d => d.id !== id);
      saveDocs(next);
      if (activeId === id) {
        const newActive = next[0].id;
        setActiveId(newActive);
        try { localStorage.setItem(ACTIVE_KEY, newActive); } catch {}
      }
      return next;
    });
  }, [activeId]);

  const renameDoc = useCallback((id: string, title: string) => {
    setDocs(prev => {
      const next = prev.map(d => d.id === id ? { ...d, title, updatedAt: Date.now() } : d);
      saveDocs(next);
      return next;
    });
  }, []);

  return { docs, activeDoc, activeId, updateActive, createDoc, switchDoc, deleteDoc, renameDoc };
}
