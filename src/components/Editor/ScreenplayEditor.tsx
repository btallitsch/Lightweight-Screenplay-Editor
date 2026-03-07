/**
 * ScreenplayEditor.tsx — The main WYSIWYG editing canvas
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

export function ScreenplayEditor({
  content,
  elements,
  onChange,
  isolatedSceneIndex,
  onSceneChange
}: Props) {

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-resize textarea to match content height
   */
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    const overlay = overlayRef.current;

    if (!ta || !overlay) return;

    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';

    overlay.style.height = ta.scrollHeight + 'px';
  }, []);

  /**
   * Handle text input
   */
  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);

    requestAnimationFrame(() => {
      autoResize();
    });

  }, [onChange, autoResize]);

  /**
   * Track cursor to detect current scene
   */
  const handleCursorMove = useCallback(() => {

    const ta = textareaRef.current;
    if (!ta) return;

    const lineNum =
      ta.value.slice(0, ta.selectionStart).split('\n').length - 1;

    const el = elements.find((e, i) => {
      const nextEl = elements[i + 1];

      return (
        e.lineNumber <= lineNum &&
        (!nextEl || nextEl.lineNumber > lineNum)
      );
    });

    if (el?.sceneIndex !== undefined) {
      onSceneChange(el.sceneIndex);
    }

  }, [elements, onSceneChange]);

  /**
   * Sync overlay scroll with textarea scroll
   */
  const syncScroll = useCallback(() => {

    const ta = textareaRef.current;
    const overlay = overlayRef.current;

    if (!ta || !overlay) return;

    overlay.scrollTop = ta.scrollTop;

  }, []);

  /**
   * Tab key → spaces
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {

    if (e.key === 'Tab') {

      e.preventDefault();

      const ta = e.currentTarget;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;

      const newVal =
        ta.value.slice(0, start) +
        '    ' +
        ta.value.slice(end);

      onChange(newVal);

      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }

  }, [onChange]);

  /**
   * Keep textarea synced with external content
   */
  useEffect(() => {

    const ta = textareaRef.current;

    if (!ta) return;

    if (ta.value !== content) {

      const pos = ta.selectionStart;

      ta.value = content;

      ta.selectionStart = pos;
      ta.selectionEnd = pos;
    }

    autoResize();

  }, [content, autoResize]);

  /**
   * Scene isolation
   */
  const visibleElements =
    isolatedSceneIndex !== null
      ? elements.filter(e => e.sceneIndex === isolatedSceneIndex)
      : elements;

  return (
    <div className="screenplay-editor">

      {isolatedSceneIndex !== null && (
        <div className="isolation-banner">
          <span>Scene Isolation Mode</span>

          <button
            onClick={() => onSceneChange(null)}
            className="isolation-exit"
          >
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
            defaultValue={content}

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

function ElementLine({ element }: { element: ScreenplayElement }) {

  if (element.type === 'empty') {
    return <div className="el el-empty">&nbsp;</div>;
  }

  return (
    <div className={`el el-${element.type}`}>
      {element.rawText || '\u00A0'}
    </div>
  );
}
