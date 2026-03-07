/**
 * export.ts — Export utilities for screenplay content
 */
import type { ScreenplayElement, TitlePageData } from '../types/screenplay';

// ─── Plain Text Export ────────────────────────────────────────────────────────
export function exportAsText(
  elements: ScreenplayElement[],
  titleData: TitlePageData | null,
  title: string
): string {
  const pad = (n: number) => ' '.repeat(n);
  const lines: string[] = [];

  if (titleData?.title || title) {
    lines.push('', '', '', pad(25) + (titleData?.title || title).toUpperCase(), '');
    if (titleData?.author) lines.push(pad(25) + 'Written by', pad(25) + titleData.author, '');
    lines.push('', '', '');
  }

  for (const el of elements) {
    switch (el.type) {
      case 'scene_heading':  lines.push('', el.displayText.toUpperCase(), ''); break;
      case 'action':        lines.push(el.displayText, ''); break;
      case 'character':     lines.push(pad(22) + el.displayText.toUpperCase()); break;
      case 'parenthetical': lines.push(pad(16) + el.displayText); break;
      case 'dialogue':      lines.push(pad(10) + el.displayText, ''); break;
      case 'transition':    lines.push('', pad(42) + el.displayText.toUpperCase(), ''); break;
      case 'empty':         lines.push(''); break;
      default:              lines.push(el.displayText);
    }
  }

  return lines.join('\n');
}

// ─── Fountain Export ──────────────────────────────────────────────────────────
export function exportAsFountain(
  elements: ScreenplayElement[],
  titleData: TitlePageData | null,
  title: string
): string {
  const header: string[] = [];
  if (titleData?.title || title) {
    header.push(`Title: ${titleData?.title || title}`);
    if (titleData?.author) header.push(`Author: ${titleData.author}`);
    if (titleData?.credit) header.push(`Credit: ${titleData.credit}`);
    if (titleData?.draftDate) header.push(`Draft Date: ${titleData.draftDate}`);
    if (titleData?.contact) header.push(`Contact: ${titleData.contact}`);
    header.push('');
  }

  const body = elements.map(e => e.rawText).join('\n');
  return header.length > 0 ? header.join('\n') + '\n' + body : body;
}

// ─── Download Helper ──────────────────────────────────────────────────────────
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_').toLowerCase() || 'screenplay';
}
