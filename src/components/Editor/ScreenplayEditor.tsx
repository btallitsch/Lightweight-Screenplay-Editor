/**
 * ScreenplayEditor.tsx — The main WYSIWYG editing canvas
 * Renders formatted screenplay elements from a contenteditable textarea.
 */
import { useRef, useEffect, useCallback, type ChangeEvent } from 'react';
import type { ScreenplayElement } from '../../types/screenplay';
import './ScreenplayEditor.css';

interface Props {
  content: string;
  elements: ScreenplayElement[];
  onChange: (content: string) => void;
  isolatedSceneIndex: number | null;
  onSceneChange: (sceneIndex: number | null) => void;
}

export function ScreenplayEditor({ content, elements, onChange, isolatedSceneIndex, onSceneChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  // Track cursor position to detect current scene
  const handleCursorMove = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const lineNum = ta.value.slice(0, ta.selectionStart).split('\n').length - 1;
    const el = elements.find((e, i) => {
      const nextEl = elements[i + 1];
      return e.lineNumber <= lineNum && (!nextEl || nextEl.lineNumber > lineNum);
    });
    if (el?.sceneIndex !== undefined) onSceneChange(el.sceneIndex);
  }, [elements, onSceneChange]);

  // Sync textarea & overlay scroll
  const syncScroll = useCallback(() => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Tab key inserts spaces
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = ta.value.slice(0, start) + '    ' + ta.value.slice(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  }, [onChange]);

  // Filter elements for isolated scene
  const visibleElements = isolatedSceneIndex !== null
    ? elements.filter(e => e.sceneIndex === isolatedSceneIndex)
    : elements;

  const visibleContent = isolatedSceneIndex !== null
    ? visibleElements.map(e => e.rawText).join('\n')
    : content;

  useEffect(() => {
    if (textareaRef.current && isolatedSceneIndex === null) {
      // keep textarea value in sync when content changes externally
      if (textareaRef.current.value !== content) {
        const pos = textareaRef.current.selectionStart;
        textareaRef.current.value = content;
        textareaRef.current.selectionStart = pos;
        textareaRef.current.selectionEnd = pos;
      }
    }
  }, [content, isolatedSceneIndex]);

  return (
    <div className="screenplay-editor">
      {isolatedSceneIndex !== null && (
        <div className="isolation-banner">
          <span>Scene Isolation Mode</span>
          <button onClick={() => onSceneChange(null)} className="isolation-exit">
            ← Return to Full Script
          </button>
        </div>
      )}

      <div className="editor-page">
        <div className="editor-inner">
          {/* Syntax highlight overlay */}
          <div
            ref={overlayRef}
            className="highlight-overlay"
            aria-hidden="true"
          >
            {visibleElements.map((el) => (
              <ElementLine key={el.id} element={el} />
            ))}
          </div>

          {/* Editable textarea */}
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            defaultValue={visibleContent}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleCursorMove}
            onClick={handleCursorMove}
            onScroll={syncScroll}
            spellCheck={true}
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="Screenplay editor"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Single Element Line ──────────────────────────────────────────────────────
function ElementLine({ element }: { element: ScreenplayElement }) {
  const cls = `el el-${element.type}`;
  if (element.type === 'empty') {
    return <div className="el el-empty">&nbsp;</div>;
  }
  return <div className={cls}>{element.rawText || '\u00A0'}</div>;
}
