/**
 * fountainParser.ts — Real-time Fountain syntax parser
 * Spec: https://fountain.io/syntax
 */
import type { ScreenplayElement, ElementType, Scene, TitlePageData } from '../types/screenplay';

// ─── Regex ───────────────────────────────────────────────────────────────────
const SCENE_HEADING_RE = /^(INT|EXT|EST|INT\.\/EXT|EXT\.\/INT|I\/E)[\.\s]/i;
const SCENE_HEADING_FORCED_RE = /^\./;
const TRANSITION_RE = /^(FADE (IN|OUT|TO)|CUT TO|SMASH CUT|MATCH CUT|JUMP CUT|TITLE OVER|IRIS (IN|OUT)|WIPE TO)[\:\.]/i;
const CHARACTER_RE = /^[A-Z][A-Z0-9 \t()\-'.]+$/;
const PARENTHETICAL_RE = /^\(.*\)$/;
const NOTE_RE = /^\[\[.*\]\]$/;
const SECTION_RE = /^#{1,6}\s/;
const SYNOPSIS_RE = /^=\s/;
const PAGE_BREAK_RE = /^={3,}$/;

let _idCtr = 0;
export const genId = () => `el_${Date.now()}_${_idCtr++}`;

// ─── Title Page ───────────────────────────────────────────────────────────────
export function parseTitlePage(lines: string[]): { titleData: TitlePageData; bodyLines: string[] } {
  const td: TitlePageData = { title:'', credit:'', author:'', source:'', draftDate:'', contact:'', copyright:'' };
  const keyMap: Record<string, keyof TitlePageData> = {
    'title':'title','credit':'credit','author':'author','source':'source',
    'draft date':'draftDate','contact':'contact','copyright':'copyright'
  };
  let i = 0;
  let found = false;
  while (i < lines.length) {
    const line = lines[i];
    const ci = line.indexOf(':');
    if (ci > 0) {
      const k = line.slice(0, ci).trim().toLowerCase();
      if (keyMap[k]) {
        td[keyMap[k]] = line.slice(ci + 1).trim();
        found = true; i++; continue;
      }
    }
    if (found && line.startsWith('   ')) { i++; continue; }
    if (found && line.trim() === '') { i++; break; }
    if (!found) break;
    break;
  }
  return { titleData: td, bodyLines: lines.slice(i) };
}

// ─── Line Classifier ──────────────────────────────────────────────────────────
interface Ctx {
  prev: ScreenplayElement | null;
  prevNonEmpty: ScreenplayElement | null;
  nextLine: string;
}

export function classifyLine(raw: string, ctx: Ctx, lineNum: number): ScreenplayElement {
  const t = raw.trim();
  const mk = (type: ElementType, display: string, forced = false): ScreenplayElement => ({
    id: genId(), type, rawText: raw, displayText: display, lineNumber: lineNum, isForcedType: forced
  });

  if (t === '') return mk('empty', '');
  if (PAGE_BREAK_RE.test(t)) return mk('page_break', '');
  if (NOTE_RE.test(t)) return mk('note', t.slice(2, -2));
  if (SECTION_RE.test(t)) return mk('section', t);
  if (SYNOPSIS_RE.test(t)) return mk('synopsis', t.slice(2));
  if (SCENE_HEADING_FORCED_RE.test(t) && !t.startsWith('...'))
    return mk('scene_heading', t.slice(1).trim().toUpperCase(), true);
  if (SCENE_HEADING_RE.test(t)) return mk('scene_heading', t.toUpperCase());
  if (t.startsWith('>') && !t.endsWith('<'))
    return mk('transition', t.slice(1).trim().toUpperCase(), true);
  if (TRANSITION_RE.test(t)) return mk('transition', t.toUpperCase());

  const pne = ctx.prevNonEmpty;
  if (PARENTHETICAL_RE.test(t) && pne &&
    (pne.type === 'character' || pne.type === 'dialogue' || pne.type === 'parenthetical'))
    return mk('parenthetical', t);

  if (pne && (pne.type === 'character' || pne.type === 'parenthetical' || pne.type === 'dialogue'))
    return mk('dialogue', t);

  const prevIsBlank = !pne || ctx.prev?.type === 'empty';
  const nextNonEmpty = ctx.nextLine.trim() !== '';
  const isDual = t.endsWith('^');
  const check = isDual ? t.slice(0, -1).trim() : t;
  if (prevIsBlank && nextNonEmpty && CHARACTER_RE.test(check) && check.length > 1)
    return { ...mk('character', check.toUpperCase()), isDualDialogue: isDual };

  return mk('action', t);
}

// ─── Full Parse ───────────────────────────────────────────────────────────────
export interface ParseResult {
  elements: ScreenplayElement[];
  scenes: Scene[];
  wordCount: number;
  pageCount: number;
  titleData: TitlePageData | null;
}

export function parseScreenplay(raw: string): ParseResult {
  const allLines = raw.split('\n');
  let titleData: TitlePageData | null = null;

  // Detect title page
  const firstFew = allLines.slice(0, 5).join('\n').toLowerCase();
  const hasTitlePage = /^(title|author|credit|draft date|contact):/.test(firstFew);
  let lines = allLines;
  if (hasTitlePage) {
    const r = parseTitlePage(allLines);
    titleData = r.titleData;
    lines = r.bodyLines;
  }

  const elements: ScreenplayElement[] = [];
  let prevNonEmpty: ScreenplayElement | null = null;
  let prev: ScreenplayElement | null = null;

  for (let i = 0; i < lines.length; i++) {
    const el = classifyLine(lines[i], { prev, prevNonEmpty, nextLine: lines[i + 1] ?? '' }, i);
    elements.push(el);
    if (el.type !== 'empty') prevNonEmpty = el;
    prev = el;
  }

  const scenes = buildScenes(elements);
  let si = -1;
  for (const el of elements) {
    if (el.type === 'scene_heading') si++;
    if (si >= 0) el.sceneIndex = si;
  }

  const wordCount = elements
    .filter(e => e.type === 'action' || e.type === 'dialogue')
    .reduce((s, e) => s + e.displayText.split(/\s+/).filter(Boolean).length, 0);
  const pageCount = Math.max(1, Math.ceil(elements.filter(e => e.type !== 'empty').length / 55));

  return { elements, scenes, wordCount, pageCount, titleData };
}

// ─── Scene Builder ────────────────────────────────────────────────────────────
function buildScenes(elements: ScreenplayElement[]): Scene[] {
  const scenes: Scene[] = [];
  let cur: Scene | null = null;
  let idx = 0;

  const finalize = (s: Scene, lastLine: number) => {
    s.endLine = lastLine;
    s.dialogueLineCount = s.elements.filter(e => e.type === 'dialogue').length;
    s.actionLineCount = s.elements.filter(e => e.type === 'action').length;
    s.pageCount = Math.max(0.1, s.elements.filter(e => e.type !== 'empty').length / 55);
    scenes.push(s);
  };

  for (const el of elements) {
    if (el.type === 'scene_heading') {
      if (cur) finalize(cur, el.lineNumber - 1);
      cur = {
        id: genId(), index: idx++, heading: el.displayText,
        location: parseLocation(el.displayText), timeOfDay: parseTimeOfDay(el.displayText),
        interior: parseInterior(el.displayText), startLine: el.lineNumber, endLine: el.lineNumber,
        elements: [el], pageCount: 0, dialogueLineCount: 0, actionLineCount: 0,
      };
    } else if (cur) cur.elements.push(el);
  }
  if (cur) finalize(cur, elements[elements.length - 1]?.lineNumber ?? cur.startLine);
  return scenes;
}

function parseLocation(h: string): string {
  return h.replace(/^(INT|EXT|EST|INT\.\/EXT|EXT\.\/INT|I\/E)[\.\s]+/i, '').replace(/\s*[-–—]\s*.+$/, '').trim();
}
function parseTimeOfDay(h: string): string {
  return h.match(/[-–—]\s*(.+)$/)?.[1]?.trim() ?? '';
}
function parseInterior(h: string): boolean | null {
  if (/^INT/i.test(h)) return true;
  if (/^EXT/i.test(h)) return false;
  return null;
}

// ─── Fountain Export ──────────────────────────────────────────────────────────
export function toFountain(elements: ScreenplayElement[]): string {
  return elements.map(e => e.rawText).join('\n');
}
