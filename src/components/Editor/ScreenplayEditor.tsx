/**
 * ScreenplayEditor.tsx
 *
 * Architecture: ONE continuous white paper div. No separate page blocks.
 * - The textarea sits in normal document flow, growing with content (auto-resize).
 * - The overlay div is position:absolute from paper top, same padding/font as textarea.
 * - Page break rules are position:absolute lines at predictable y-offsets.
 * - Overlay colors element backgrounds — no position/indent tricks that break cursor alignment.
 */
import { useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import type { ScreenplayElement } from '../../types/screenplay';
import './ScreenplayEditor.css';

// ── Screenplay metric constants (WGA standard at 96 DPI) ────────────────────
export const LINE_H     = 21;   // px — 12pt Courier Prime at ~1.5 leading
export const PAD_TOP    = 96;   // px — 1 inch top margin
export const PAD_SIDE_L = 108;  // px — 1.5 inch left margin
export const PAD_SIDE_R = 96;   // px — 1 inch right margin
export const PAD_BOT    = 96;   // px — 1 inch bottom margin
export const LINES_PAGE = 54;   // lines of content per page

export interface EditorHandle {
  focus: () => void;
  getTextarea: () => HTMLTextAreaElement | null;
}

interface Props {
  content: string;
  elements: ScreenplayElement[];
  onChange: (content: string) => void;
  onCursorMove: (ta: HTMLTextAreaElement) => void;
  isolatedSceneIndex: number | null;
  onExitIsolation: () => void;
}

export const ScreenplayEditor = forwardRef<EditorHandle, Props>(function ScreenplayEditor(
  { content, elements, onChange, onCursorMove, isolatedSceneIndex, onExitIsolation },
  ref
) {
  const taRef   = useRef<HTMLTextAreaElement>(null);
  const ovRef   = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => taRef.current?.focus(),
    getTextarea: () => taRef.current,
  }));

  // ── Filtered elements for isolation mode ──────────────────────────────────
  const activeEls = useMemo(() =>
    isolatedSceneIndex !== null
      ? elements.filter(e => e.sceneIndex === isolatedSceneIndex)
      : elements,
    [elements, isolatedSceneIndex]
  );

  const activeContent = useMemo(() =>
    isolatedSceneIndex !== null ? activeEls.map(e => e.rawText).join('\n') : content,
    [content, isolatedSceneIndex, activeEls]
  );

  // ── Page break y-positions ─────────────────────────────────────────────────
  // Line N sits at: PAD_TOP + N * LINE_H  (from top of paper)
  // Page break after line (K * LINES_PAGE - 1), so at y = PAD_TOP + K * LINES_PAGE * LINE_H
  const contentLineCount = activeEls.length;
  const pageCount = Math.max(1, Math.ceil(contentLineCount / LINES_PAGE));
  const pageBreaks = Array.from({ length: pageCount - 1 }, (_, k) =>
    PAD_TOP + (k + 1) * LINES_PAGE * LINE_H
  );

  // ── Auto-resize textarea to fit content ───────────────────────────────────
  const autoResize = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = '0px';
    ta.style.height = Math.max(ta.scrollHeight, PAD_TOP + LINES_PAGE * LINE_H + PAD_BOT) + 'px';
  }, []);

  // ── Sync textarea value when content changes externally ───────────────────
  useEffect(() => {
    const ta = taRef.current;
    if (!ta || ta.value === activeContent) return;
    const s = ta.selectionStart;
    ta.value = activeContent;
    ta.selectionStart = ta.selectionEnd = Math.min(s, activeContent.length);
    autoResize();
  }, [activeContent, autoResize]);

  useEffect(() => { autoResize(); }, [autoResize]);

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleInput = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    autoResize();
    onChange(ta.value);
    onCursorMove(ta);
  }, [onChange, onCursorMove, autoResize]);

  const handleCursor = useCallback(() => {
    const ta = taRef.current;
    if (ta) onCursorMove(ta);
  }, [onCursorMove]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab → insert 4 spaces (don't lose focus)
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const s = ta.selectionStart;
      const v = ta.value.slice(0, s) + '    ' + ta.value.slice(ta.selectionEnd);
      onChange(v);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 4; });
    }
  }, [onChange]);

  return (
    <div className="se-outer">
      {isolatedSceneIndex !== null && (
        <div className="se-iso-banner">
          <span>⊡ Scene Isolation Mode</span>
          <button className="se-iso-exit" onClick={onExitIsolation}>← Full Script</button>
        </div>
      )}

      <div className="se-paper-wrap">
        <div className="se-paper" ref={paperRef}>

          {/* ── Syntax highlight overlay (background colors only) ── */}
          <div ref={ovRef} className="se-overlay" aria-hidden="true">
            {activeEls.map(el => <OverlayLine key={el.id} el={el} />)}
          </div>

          {/* ── Editable textarea ── */}
          <textarea
            ref={taRef}
            className="se-textarea"
            defaultValue={activeContent}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onClick={handleCursor}
            onKeyUp={handleCursor}
            onFocus={handleCursor}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="Screenplay editor"
          />

          {/* ── Page break lines (absolutely positioned) ── */}
          {pageBreaks.map((y, i) => (
            <div key={i} className="se-pgbreak" style={{ top: y }}>
              <div className="se-pgbreak-rule" />
              <span className="se-pgbreak-num">{i + 2}.</span>
            </div>
          ))}

          {/* ── Page number: top-right of page 1 is blank, handled by margin ── */}
        </div>
      </div>
    </div>
  );
});

// ── Overlay line: renders background color for each element type ─────────────
// IMPORTANT: no padding/indent changes here — that would misalign with the textarea cursor.
// Colors only.
function OverlayLine({ el }: { el: ScreenplayElement }) {
  return <div className={`se-ol se-ol-${el.type}`}>&nbsp;</div>;
}
