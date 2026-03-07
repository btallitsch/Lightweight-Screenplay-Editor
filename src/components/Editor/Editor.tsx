import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { ScreenplayLine, ElementType } from '../../types/screenplay';
import {
  parseLines,
  reparseLinesFrom,
  getNextLineType,
  cycleElementType,
  linesToFountain,
  fountainToLines,
} from '../../utils/fountainParser';
import { generateId } from '../../utils/diff';
import EditorLine from './EditorLine';
import EditorToolbar from './EditorToolbar';

// ─────────────────────────────────────────────
// Sample starter content
// ─────────────────────────────────────────────

const STARTER_TEXT = `FADE IN:

INT. COFFEE SHOP - MORNING

A cramped corner table. A laptop, three empty cups, and one exhausted WRITER, 28, who clearly slept here.

WRITER
(muttering)
Just one more scene.

The barista, MARISOL, 30s, appears with a fresh cup.

MARISOL
You said that four hours ago.

WRITER
This time I mean it.

Marisol sets down the cup and walks away, unconvinced.

EXT. CITY STREET - CONTINUOUS

The Writer bursts out the front door, laptop under one arm, coffee in the other -- and immediately walks into a lamp post.

WRITER (CONT'D)
Worth it.

FADE OUT.`;

// ─────────────────────────────────────────────
// Build initial lines from text
// ─────────────────────────────────────────────

function buildLines(text: string): ScreenplayLine[] {
  const rawLines = fountainToLines(text);
  return parseLines(rawLines).map((l, i) => ({ ...l, id: `line-${i}-${generateId()}` }));
}

// ─────────────────────────────────────────────
// Public handle for parent to read content
// ─────────────────────────────────────────────

export interface EditorHandle {
  getContent: () => string;
  setContent: (text: string) => void;
  getLines: () => ScreenplayLine[];
  focusLine: (lineIndex: number) => void;
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface EditorProps {
  initialContent?: string;
  title: string;
  onTitleChange: (t: string) => void;
  onContentChange: (content: string, lines: ScreenplayLine[]) => void;
  restrictToLineIndices?: [number, number]; // for scene isolation
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const Editor = forwardRef<EditorHandle, EditorProps>(
  ({ initialContent, title, onTitleChange, onContentChange, restrictToLineIndices }, ref) => {
    const [lines, setLines] = useState<ScreenplayLine[]>(() =>
      buildLines(initialContent ?? STARTER_TEXT)
    );
    const [activeLineId, setActiveLineId] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    const lineRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Compute visible lines (for scene isolation)
    const visibleLines = restrictToLineIndices
      ? lines.slice(restrictToLineIndices[0], restrictToLineIndices[1] + 1)
      : lines;

    // Expose handle methods
    useImperativeHandle(ref, () => ({
      getContent: () => linesToFountain(lines),
      setContent: (text: string) => {
        const newLines = buildLines(text);
        setLines(newLines);
      },
      getLines: () => lines,
      focusLine: (lineIndex: number) => {
        const line = lines[lineIndex];
        if (line) {
          setTimeout(() => lineRefs.current.get(line.id)?.focus(), 0);
        }
      },
    }));

    // Notify parent on every change
    useEffect(() => {
      const content = linesToFountain(lines);
      onContentChange(content, lines);
    }, [lines, onContentChange]);

    // ── Keyboard command handler ────────────────

    const handleKeyDown = useCallback(
      (id: string, e: React.KeyboardEvent<HTMLDivElement>) => {
        const allLines = restrictToLineIndices
          ? lines.slice(restrictToLineIndices[0], restrictToLineIndices[1] + 1)
          : lines;
        const visibleIdx = allLines.findIndex((l) => l.id === id);
        const globalIdx = lines.findIndex((l) => l.id === id);

        // ── Enter: insert new line ──
        if (e.key === 'Enter') {
          e.preventDefault();
          const currentLine = lines[globalIdx];
          const nextType = getNextLineType(currentLine.type);
          const newLine: ScreenplayLine = {
            id: `line-${generateId()}`,
            text: '',
            type: nextType,
            sceneIndex: currentLine.sceneIndex,
          };
          setLines((prev) => {
            const next = [
              ...prev.slice(0, globalIdx + 1),
              newLine,
              ...prev.slice(globalIdx + 1),
            ];
            return reparseLinesFrom(next, Math.max(0, globalIdx));
          });
          setIsDirty(true);
          setTimeout(() => lineRefs.current.get(newLine.id)?.focus(), 0);
          return;
        }

        // ── Backspace on empty line: delete line ──
        if (e.key === 'Backspace' && lines[globalIdx].text === '') {
          e.preventDefault();
          if (lines.length <= 1) return;
          const prevLine = allLines[visibleIdx - 1];
          setLines((prev) => {
            const next = prev.filter((l) => l.id !== id);
            return reparseLinesFrom(next, Math.max(0, globalIdx - 1));
          });
          setIsDirty(true);
          if (prevLine) {
            setTimeout(() => {
              const el = lineRefs.current.get(prevLine.id);
              if (el) {
                el.focus();
                moveCursorToEnd(el);
              }
            }, 0);
          }
          return;
        }

        // ── Tab: cycle element type ──
        if (e.key === 'Tab') {
          e.preventDefault();
          setLines((prev) => {
            const next = [...prev];
            next[globalIdx] = {
              ...next[globalIdx],
              type: cycleElementType(next[globalIdx].type),
            };
            return reparseLinesFrom(next, Math.max(0, globalIdx - 1));
          });
          return;
        }

        // ── Arrow Up / Down: navigate lines ──
        if (e.key === 'ArrowUp' && visibleIdx > 0) {
          const prevLine = allLines[visibleIdx - 1];
          lineRefs.current.get(prevLine.id)?.focus();
          return;
        }
        if (e.key === 'ArrowDown' && visibleIdx < allLines.length - 1) {
          const nextLine = allLines[visibleIdx + 1];
          lineRefs.current.get(nextLine.id)?.focus();
          return;
        }

        // ── Cmd/Ctrl + number: force element type ──
        if ((e.metaKey || e.ctrlKey) && /^[1-6]$/.test(e.key)) {
          e.preventDefault();
          const typeMap: ElementType[] = [
            'scene-heading', 'action', 'character', 'dialogue', 'parenthetical', 'transition',
          ];
          const forced = typeMap[parseInt(e.key) - 1];
          if (forced) {
            setLines((prev) => {
              const next = [...prev];
              next[globalIdx] = { ...next[globalIdx], type: forced };
              return reparseLinesFrom(next, Math.max(0, globalIdx - 1));
            });
          }
          return;
        }

        // ── Cmd+S: manual save (bubble up via custom event) ──
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('screenplay:save'));
          return;
        }
      },
      [lines, restrictToLineIndices]
    );

    // ── Line text update ─────────────────────────

    const handleLineUpdate = useCallback((id: string, text: string) => {
      setLines((prev) => {
        const idx = prev.findIndex((l) => l.id === id);
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], text };
        return reparseLinesFrom(next, Math.max(0, idx - 1));
      });
      setIsDirty(true);
    }, []);

    // ── Force type from toolbar ──────────────────

    const handleForceType = useCallback(
      (type: ElementType) => {
        if (!activeLineId) return;
        const idx = lines.findIndex((l) => l.id === activeLineId);
        if (idx < 0) return;
        setLines((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], type };
          return reparseLinesFrom(next, Math.max(0, idx - 1));
        });
      },
      [activeLineId, lines]
    );

    // ── Export / Import ──────────────────────────

    const handleExport = useCallback(() => {
      const content = linesToFountain(lines);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.fountain`;
      a.click();
      URL.revokeObjectURL(url);
    }, [lines, title]);

    const handleImport = useCallback(() => {
      fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          const newLines = buildLines(text);
          setLines(newLines);
          setIsDirty(false);
          onTitleChange(file.name.replace(/\.fountain$/i, ''));
        };
        reader.readAsText(file);
        e.target.value = '';
      },
      [onTitleChange]
    );

    const handleManualSave = useCallback(() => {
      document.dispatchEvent(new CustomEvent('screenplay:save'));
      setIsDirty(false);
    }, []);

    // Active line type
    const activeLine = lines.find((l) => l.id === activeLineId) ?? null;

    return (
      <div className="editor-container">
        {!restrictToLineIndices && (
          <EditorToolbar
            activeType={activeLine?.type ?? null}
            onForceType={handleForceType}
            onExport={handleExport}
            onImport={handleImport}
            isDirty={isDirty}
            onManualSave={handleManualSave}
            title={title}
            onTitleChange={onTitleChange}
          />
        )}

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".fountain,.txt"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          aria-hidden="true"
        />

        {/* The screenplay canvas */}
        <div className="screenplay-canvas" role="main" aria-label="Screenplay editor">
          <div className="screenplay-paper">
            {visibleLines.map((line) => (
              <EditorLine
                key={line.id}
                line={line}
                isActive={line.id === activeLineId}
                onUpdate={handleLineUpdate}
                onKeyDown={handleKeyDown}
                onFocus={setActiveLineId}
                ref={(el) => {
                  if (el) lineRefs.current.set(line.id, el);
                  else lineRefs.current.delete(line.id);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

Editor.displayName = 'Editor';
export default Editor;

// ─── Cursor utilities ────────────────────────────

function moveCursorToEnd(el: HTMLElement) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  sel?.removeAllRanges();
  sel?.addRange(range);
}
