// ─── Fountain Element Types ────────────────────────────────────────────────────

export type ElementType =
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'
  | 'note'
  | 'section'
  | 'synopsis'
  | 'page_break'
  | 'title_page'
  | 'empty'
  | 'unknown';

export interface ScreenplayElement {
  id: string;
  type: ElementType;
  rawText: string;
  displayText: string;
  lineNumber: number;
  sceneIndex?: number;     // which scene this belongs to
  isDualDialogue?: boolean;
  isForcedType?: boolean;  // user manually forced a type with Fountain prefix
}

// ─── Scene Types ───────────────────────────────────────────────────────────────

export interface Scene {
  id: string;
  index: number;
  heading: string;
  location: string;
  timeOfDay: string;
  interior: boolean | null; // true=INT, false=EXT, null=other
  startLine: number;
  endLine: number;
  elements: ScreenplayElement[];
  pageCount: number;
  dialogueLineCount: number;
  actionLineCount: number;
}

// ─── Pace Meter Types ─────────────────────────────────────────────────────────

export interface PaceDataPoint {
  sceneIndex: number;
  sceneHeading: string;
  totalLines: number;
  dialogueDensity: number;   // 0–1 ratio of dialogue to total
  actionDensity: number;     // 0–1 ratio of action to total
  estimatedPageLength: number;
  warning?: PaceWarning;
}

export type PaceWarningType =
  | 'verbose_dialogue'
  | 'verbose_action'
  | 'very_long_scene'
  | 'no_dialogue'
  | 'no_action';

export interface PaceWarning {
  type: PaceWarningType;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

// ─── Version / Diff Types ─────────────────────────────────────────────────────

export type DiffOperation = 'insert' | 'delete' | 'equal';

export interface DiffChunk {
  op: DiffOperation;
  text: string;
}

export interface ScreenplayVersion {
  id: string;
  timestamp: number;
  label: string;
  content: string;
  wordCount: number;
  pageCount: number;
  diff?: DiffChunk[];  // diff from previous version
}

// ─── Editor State ─────────────────────────────────────────────────────────────

export interface EditorState {
  title: string;
  author: string;
  content: string;
  elements: ScreenplayElement[];
  scenes: Scene[];
  currentSceneIndex: number | null;
  isolatedSceneIndex: number | null;  // for scene isolation mode
  cursorLine: number;
  wordCount: number;
  pageCount: number;
  isDirty: boolean;
  lastSaved: number | null;
}

export interface TitlePageData {
  title: string;
  credit: string;
  author: string;
  source: string;
  draftDate: string;
  contact: string;
  copyright: string;
}

// ─── Formatting Rules ─────────────────────────────────────────────────────────

export interface FormattingRule {
  id: string;
  name: string;
  elementType: ElementType;
  marginLeft: number;   // in characters (Courier Prime at 12pt)
  marginRight: number;
  width: number;
  textTransform: 'uppercase' | 'none';
  alignment: 'left' | 'center' | 'right';
}

export const DEFAULT_FORMATTING_RULES: Record<ElementType, Partial<FormattingRule>> = {
  scene_heading:  { marginLeft: 0, width: 60, textTransform: 'uppercase', alignment: 'left' },
  action:         { marginLeft: 0, width: 60, textTransform: 'none',      alignment: 'left' },
  character:      { marginLeft: 22, width: 38, textTransform: 'uppercase', alignment: 'left' },
  dialogue:       { marginLeft: 10, width: 35, textTransform: 'none',     alignment: 'left' },
  parenthetical:  { marginLeft: 15, width: 25, textTransform: 'none',     alignment: 'left' },
  transition:     { marginLeft: 0, width: 60, textTransform: 'uppercase',  alignment: 'right' },
  note:           { marginLeft: 0, width: 60, textTransform: 'none',      alignment: 'left' },
  section:        { marginLeft: 0, width: 60, textTransform: 'none',      alignment: 'left' },
  synopsis:       { marginLeft: 0, width: 60, textTransform: 'none',      alignment: 'left' },
  page_break:     { marginLeft: 0, width: 60, textTransform: 'none',      alignment: 'center' },
  title_page:     { marginLeft: 0, width: 60, textTransform: 'none',      alignment: 'center' },
  empty:          { marginLeft: 0, width: 60, textTransform: 'none',      alignment: 'left' },
  unknown:        { marginLeft: 0, width: 60, textTransform: 'none',      alignment: 'left' },
};
