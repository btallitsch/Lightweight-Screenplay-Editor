import React, { useEffect, useRef, useCallback } from 'react';
import { ScreenplayLine, ElementType } from '../../types/screenplay';

interface EditorLineProps {
  line: ScreenplayLine;
  isActive: boolean;
  onUpdate: (id: string, text: string) => void;
  onKeyDown: (id: string, e: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocus: (id: string) => void;
}

// Human-readable labels shown in the gutter
const TYPE_LABELS: Record<ElementType, string> = {
  'scene-heading':  'INT/EXT',
  'action':         'ACTION',
  'character':      'CHAR',
  'dialogue':       'DIALOGUE',
  'parenthetical':  'PAREN',
  'transition':     'TRANS',
  'note':           'NOTE',
  'blank':          '',
  'title-page':     'TITLE',
};

const EditorLine = React.forwardRef<HTMLDivElement, EditorLineProps>(
  ({ line, isActive, onUpdate, onKeyDown, onFocus }, ref) => {
    const divRef = useRef<HTMLDivElement | null>(null);

    // Sync ref forwarding
    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        divRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      },
      [ref]
    );

    // Sync DOM text with state (when state changes externally, e.g. undo / scene isolation)
    useEffect(() => {
      const el = divRef.current;
      if (!el) return;
      // Only update if content actually differs to avoid cursor jumping
      if (el.innerText !== line.text) {
        el.innerText = line.text;
      }
    }, [line.text]);

    const handleInput = useCallback(
      (e: React.FormEvent<HTMLDivElement>) => {
        // Strip any newlines the browser might insert
        const raw = e.currentTarget.innerText ?? '';
        const cleaned = raw.replace(/\n/g, '');
        onUpdate(line.id, cleaned);
      },
      [line.id, onUpdate]
    );

    // Prevent rich-text paste; only accept plain text
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      // Insert only the first line — multi-line paste is handled by Editor.tsx
      const firstLine = text.split('\n')[0];
      document.execCommand('insertText', false, firstLine);
    }, []);

    return (
      <div className={`editor-line-wrapper ${isActive ? 'is-active' : ''} type-${line.type}`}>
        {/* Type gutter label */}
        <span className="line-gutter-label" aria-hidden="true">
          {isActive && line.type !== 'blank' ? TYPE_LABELS[line.type] : ''}
        </span>

        {/* The editable line */}
        <div
          ref={setRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          data-line-id={line.id}
          data-line-type={line.type}
          className={`editor-line line-${line.type}`}
          onInput={handleInput}
          onKeyDown={(e) => onKeyDown(line.id, e)}
          onFocus={() => onFocus(line.id)}
          onPaste={handlePaste}
          aria-label={`${TYPE_LABELS[line.type] || 'Blank'} line`}
          role="textbox"
          aria-multiline="false"
        />
      </div>
    );
  }
);

EditorLine.displayName = 'EditorLine';
export default EditorLine;
