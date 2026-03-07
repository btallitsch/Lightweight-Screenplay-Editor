import { ElementType, ScreenplayLine, Scene } from '../types/screenplay';

// ─────────────────────────────────────────────
// Parser state machine
// ─────────────────────────────────────────────

interface ParseState {
  inDialogue: boolean;
  afterBlank: boolean;
  sceneIndex: number;
  seenFirstSceneHeading: boolean;
}

const SCENE_HEADING_PREFIXES = /^(INT|EXT|INT\.\/EXT\.|I\/E|EST)[\.\s]/i;
const TRANSITION_PATTERN = /^(FADE\s(IN|OUT)[.:]|CUT\sTO:|SMASH\sCUT\sTO:|MATCH\sCUT\sTO:|DISSOLVE\sTO:|IRIS\s(IN|OUT)[.:])/i;
const IS_ALL_CAPS = (s: string) => s.trim().length > 0 && s.trim() === s.trim().toUpperCase() && /[A-Z]/.test(s.trim());

function classifyLine(text: string, state: ParseState): ElementType {
  const trimmed = text.trim();

  // Blank line
  if (trimmed === '') return 'blank';

  // Notes: [[...]]
  if (trimmed.startsWith('[[') && trimmed.endsWith(']]')) return 'note';

  // Forced scene heading: starts with single dot
  if (trimmed.startsWith('.') && !trimmed.startsWith('..')) return 'scene-heading';

  // Scene heading by keyword
  if (SCENE_HEADING_PREFIXES.test(trimmed)) return 'scene-heading';

  // Forced transition: starts with >
  if (trimmed.startsWith('>') && !trimmed.endsWith('<')) return 'transition';

  // Transition pattern (ALL CAPS ending TO: or known transitions)
  if (IS_ALL_CAPS(trimmed) && (trimmed.endsWith('TO:') || TRANSITION_PATTERN.test(trimmed))) {
    return 'transition';
  }

  // Parenthetical (in dialogue context)
  if (state.inDialogue && trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return 'parenthetical';
  }

  // Dialogue continuation
  if (state.inDialogue) {
    return 'dialogue';
  }

  // Character cue: ALL CAPS after a blank line, not a transition
  if (state.afterBlank && IS_ALL_CAPS(trimmed) && !trimmed.endsWith('TO:') && !TRANSITION_PATTERN.test(trimmed)) {
    return 'character';
  }

  return 'action';
}

function updateState(state: ParseState, type: ElementType): ParseState {
  const next = { ...state };
  switch (type) {
    case 'blank':
      next.inDialogue = false;
      next.afterBlank = true;
      break;
    case 'character':
      next.inDialogue = true;
      next.afterBlank = false;
      break;
    case 'dialogue':
    case 'parenthetical':
      next.inDialogue = true;
      next.afterBlank = false;
      break;
    case 'scene-heading':
      next.inDialogue = false;
      next.afterBlank = false;
      next.seenFirstSceneHeading = true;
      next.sceneIndex += 1;
      break;
    default:
      next.inDialogue = false;
      next.afterBlank = false;
      break;
  }
  return next;
}

// ─────────────────────────────────────────────
// Public: parse a full array of raw text lines
// ─────────────────────────────────────────────

export function parseLines(rawLines: string[]): ScreenplayLine[] {
  let state: ParseState = {
    inDialogue: false,
    afterBlank: true,
    sceneIndex: -1,
    seenFirstSceneHeading: false,
  };

  return rawLines.map((text, idx) => {
    const id = `line-${idx}`;
    const type = classifyLine(text, state);
    const sceneIndex = type === 'scene-heading' ? state.sceneIndex + 1 : state.sceneIndex;
    state = updateState(state, type);
    return { id, text, type, sceneIndex };
  });
}

// ─────────────────────────────────────────────
// Public: reparse from a specific index forward
// (efficient update on edit)
// ─────────────────────────────────────────────

export function reparseLinesFrom(
  lines: ScreenplayLine[],
  fromIdx: number
): ScreenplayLine[] {
  // Rebuild state up to fromIdx
  let state: ParseState = {
    inDialogue: false,
    afterBlank: true,
    sceneIndex: -1,
    seenFirstSceneHeading: false,
  };

  for (let i = 0; i < fromIdx; i++) {
    state = updateState(state, lines[i].type);
  }

  const result = [...lines];

  for (let i = fromIdx; i < result.length; i++) {
    const type = classifyLine(result[i].text, state);
    const sceneIndex = type === 'scene-heading' ? state.sceneIndex + 1 : state.sceneIndex;
    result[i] = { ...result[i], type, sceneIndex };
    state = updateState(state, type);
  }

  return result;
}

// ─────────────────────────────────────────────
// Public: extract scenes from parsed lines
// ─────────────────────────────────────────────

export function extractScenes(lines: ScreenplayLine[]): Scene[] {
  const scenes: Scene[] = [];
  let currentScene: Scene | null = null;

  lines.forEach((line, idx) => {
    if (line.type === 'scene-heading') {
      if (currentScene) {
        currentScene.endLineIndex = idx - 1;
        currentScene.lineCount = currentScene.endLineIndex - currentScene.startLineIndex + 1;
        scenes.push(currentScene);
      }
      const headingText = line.text.trim().startsWith('.')
        ? line.text.trim().slice(1).trim()
        : line.text.trim();
      currentScene = {
        id: `scene-${idx}`,
        index: scenes.length,
        heading: headingText || 'UNTITLED SCENE',
        startLineIndex: idx,
        endLineIndex: idx,
        lineCount: 1,
        dialogueLines: 0,
        actionLines: 0,
        characterLines: 0,
      };
    } else if (currentScene) {
      if (line.type === 'dialogue') currentScene.dialogueLines++;
      else if (line.type === 'action') currentScene.actionLines++;
      else if (line.type === 'character') currentScene.characterLines++;
    }
  });

  if (currentScene) {
    const sc = currentScene as Scene;
    sc.endLineIndex = lines.length - 1;
    sc.lineCount = sc.endLineIndex - sc.startLineIndex + 1;
    scenes.push(sc);
  }

  return scenes;
}

// ─────────────────────────────────────────────
// Public: determine the "next smart" element type
// after pressing Enter on a given type
// ─────────────────────────────────────────────

export function getNextLineType(current: ElementType): ElementType {
  switch (current) {
    case 'scene-heading': return 'action';
    case 'action':        return 'action';
    case 'character':     return 'dialogue';
    case 'dialogue':      return 'action';   // double Enter → action
    case 'parenthetical': return 'dialogue';
    case 'transition':    return 'scene-heading';
    default:              return 'action';
  }
}

// ─────────────────────────────────────────────
// Public: Tab key cycles through manual overrides
// ─────────────────────────────────────────────

export function cycleElementType(current: ElementType): ElementType {
  const cycle: ElementType[] = [
    'action',
    'scene-heading',
    'character',
    'dialogue',
    'parenthetical',
    'transition',
  ];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}

// ─────────────────────────────────────────────
// Public: serialize lines to plain Fountain text
// ─────────────────────────────────────────────

export function linesToFountain(lines: ScreenplayLine[]): string {
  return lines.map((l) => l.text).join('\n');
}

// ─────────────────────────────────────────────
// Public: parse Fountain text into raw lines
// ─────────────────────────────────────────────

export function fountainToLines(text: string): string[] {
  return text.split('\n');
}
