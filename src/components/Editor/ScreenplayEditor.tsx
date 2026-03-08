/**
 * ScreenplayEditor.tsx
 * Final Draft-style paged editor with visual page breaks,
 * line-by-line syntax highlighting overlay, and cursor tracking.
 */
import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { ScreenplayElement } from '../../types/screenplay';
import './ScreenplayEditor.css';

// Screenplay layout constants (Courier Prime 12pt)
const LINES_PER_PAGE = 56;           // ~56 lines per standard screenplay page
const LINE_HEIGHT_PX = 21;           // 12pt Courier at 1.5 line spacing ≈ 21px
const PAGE_PADDING_TOP_PX = 72;      // ~1 inch top margin
const PAGE_PADDING_BOTTOM_PX = 72;   // ~1 inch bottom margin
const PAGE_WIDTH_PX = 680;
const PAGE_CONTENT_HEIGHT_PX = LINES_PER_PAGE * LINE_HEIGHT_PX; // ≈ 1176px

interface Page {
  pageNumber: number;
  startLine: number;
  endLine: number;
  elements: ScreenplayElement[];
}

interface Props {
  content: string;
  elements: ScreenplayElement[];
  onChange: (content: string) => void;
  onCursorMove: (textarea: HTMLTextAreaElement) => void;
  isolatedSceneIndex: number | null;
  onExitIsolation: () => void;
  forceElementType?: (lineNum: number, content: string) => void;
}

export function ScreenplayEditor({
  content, elements, onChange, onCursorMove,
  isolatedSceneIndex, onExitIsolation,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Filter for isolated scene ──────────────────────────────────────────────
  const activeElements = useMemo(() =>
    isolatedSceneIndex !== null
      ? elements.filter(e => e.sceneIndex === isolatedSceneIndex)
      : elements,
    [elements, isolatedSceneIndex]
  );

  const activeContent = useMemo(() => {
    if (isolatedSceneIndex === null) return content;
    return activeElements.map(e => e.rawText).join('\n');
  }, [content, isolatedSceneIndex, activeElements]);

  // ── Paginate elements ──────────────────────────────────────────────────────
  const pages = useMemo<Page[]>(() => {
    if (activeElements.length === 0) return [{ pageNumber: 1, startLine: 0, endLine: 0, elements: [] }];

    const result: Page[] = [];
    let currentPage: Page = { pageNumber: 1, startLine: 0, endLine: 0, elements: [] };
    let linesOnPage = 0;

    for (const el of activeElements) {
      // Count rendered lines for this element (wrapping)
      const elLines = Math.max(1, Math.ceil(el.displayText.length / 52));

      // Check if adding this element would overflow the page
      if (linesOnPage + elLines > LINES_PER_PAGE && linesOnPage > 0) {
        currentPage.endLine = el.lineNumber - 1;
        result.push(currentPage);
        currentPage = {
          pageNumber: result.length + 1,
          startLine: el.lineNumber,
          endLine: el.lineNumber,
          elements: [],
        };
        linesOnPage = 0;

        // Add "(CONTINUED)" to dialogue blocks that break across pages
        if (el.type === 'dialogue' || el.type === 'parenthetical') {
          currentPage.elements.push({
            id: `cont_${el.id}`,
            type: 'character',
            rawText: '',
            displayText: '(CONT\'D)',
            lineNumber: el.lineNumber,
            sceneIndex: el.sceneIndex,
          });
          linesOnPage += 1;
        }
      }

      currentPage.elements.push(el);
      linesOnPage += elLines;
    }

    currentPage.endLine = activeElements[activeElements.length - 1]?.lineNumber ?? 0;
    result.push(currentPage);
    return result;
  }, [activeElements]);

  // ── Keep textarea in sync ──────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (ta.value !== activeContent) {
      const pos = ta.selectionStart;
      ta.value = activeContent;
      ta.selectionStart = pos;
      ta.selectionEnd = pos;
    }
  }, [activeContent]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    onChange(ta.value);
  }, [onChange]);

  const handleCursor = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) onCursorMove(ta);
  }, [onCursorMove]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = ta.value.slice(0, start) + '    ' + ta.value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  }, [onChange]);

  // ── Total content height for the textarea ─────────────────────────────────
  const totalHeight = pages.length * (PAGE_CONTENT_HEIGHT_PX + PAGE_PADDING_TOP_PX + PAGE_PADDING_BOTTOM_PX + 32);

  return (
    <div className="se-scroll-container" ref={containerRef}>
      {isolatedSceneIndex !== null && (
        <div className="se-isolation-bar">
          <span>⊡ Scene Isolation Mode</span>
          <button onClick={onExitIsolation} className="se-isolation-exit">← Back to Full Script</button>
        </div>
      )}

      <div className="se-pages-wrapper">
        {/* ── Rendered Pages ─────────────────────────────────────────── */}
        <div className="se-pages" aria-hidden="true" style={{ minHeight: totalHeight }}>
          {pages.map((page) => (
            <PageBlock key={page.pageNumber} page={page} totalPages={pages.length} />
          ))}
        </div>

        {/* ── Single Full-Height Textarea overlay ────────────────────── */}
        <textarea
          ref={textareaRef}
          className="se-textarea"
          defaultValue={activeContent}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleCursor}
          onClick={handleCursor}
          spellCheck
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="Screenplay editor"
          style={{ minHeight: totalHeight }}
        />
      </div>
    </div>
  );
}

// ── Single Page Block ────────────────────────────────────────────────────────
function PageBlock({ page, totalPages }: { page: Page; totalPages: number }) {
  return (
    <div className="se-page">
      {/* Page top margin */}
      <div className="se-page-top-margin">
        {page.pageNumber > 1 && (
          <span className="se-page-num-top">{page.pageNumber}.</span>
        )}
      </div>

      {/* Script content */}
      <div className="se-page-content">
        {page.elements.map((el) => (
          <HighlightLine key={el.id} el={el} />
        ))}
        {/* Fill remaining space so page stays full height */}
        <div className="se-page-filler" />
      </div>

      {/* Page bottom margin */}
      <div className="se-page-bottom-margin">
        {page.pageNumber < totalPages && (
          <span className="se-continued">— continued —</span>
        )}
      </div>

      {/* Visual page break separator */}
      {page.pageNumber < totalPages && (
        <div className="se-page-break">
          <div className="se-break-line" />
          <span className="se-break-label">Page {page.pageNumber + 1}</span>
          <div className="se-break-line" />
        </div>
      )}
    </div>
  );
}

// ── Syntax-highlighted line ──────────────────────────────────────────────────
function HighlightLine({ el }: { el: ScreenplayElement }) {
  if (el.type === 'empty') return <div className="hl hl-empty">&nbsp;</div>;
  if (el.type === 'page_break') return <div className="hl hl-page_break">{'='.repeat(20)}</div>;

  return (
    <div className={`hl hl-${el.type}`}>
      {el.rawText || '\u00A0'}
    </div>
  );
}
