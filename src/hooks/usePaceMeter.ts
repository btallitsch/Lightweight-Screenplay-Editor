import { useMemo } from 'react';
import { ScreenplayLine, Scene, PaceData } from '../types/screenplay';
import { extractScenes } from '../utils/fountainParser';

const DIALOGUE_DENSITY_THRESHOLD = 0.65; // 65% dialogue = flagged
const MIN_SCENE_LINES_TO_FLAG = 8;        // only flag scenes with substance
const LONG_SCENE_LINE_COUNT = 60;         // flag scenes > 60 lines

function buildPaceData(scene: Scene): PaceData {
  const contentLines = scene.dialogueLines + scene.actionLines;
  const dialogueDensity = contentLines > 0 ? scene.dialogueLines / contentLines : 0;

  let isFlagged = false;
  let flagReason: string | undefined;

  if (scene.lineCount >= MIN_SCENE_LINES_TO_FLAG) {
    if (dialogueDensity > DIALOGUE_DENSITY_THRESHOLD) {
      isFlagged = true;
      flagReason = 'Trim this exchange for tighter rhythm?';
    } else if (scene.lineCount > LONG_SCENE_LINE_COUNT) {
      isFlagged = true;
      flagReason = 'Scene is long — consider breaking it up.';
    } else if (scene.actionLines > 30) {
      isFlagged = true;
      flagReason = 'Heavy action block — trim for pace.';
    }
  }

  return {
    sceneIndex: scene.index,
    heading: scene.heading,
    totalLines: scene.lineCount,
    dialogueLines: scene.dialogueLines,
    actionLines: scene.actionLines,
    dialogueDensity,
    isFlagged,
    flagReason,
  };
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

interface UsePaceMeterResult {
  scenes: Scene[];
  paceData: PaceData[];
  totalDialogueLines: number;
  totalActionLines: number;
  totalScenes: number;
  overallDensity: number;
  flaggedScenes: PaceData[];
}

export function usePaceMeter(lines: ScreenplayLine[]): UsePaceMeterResult {
  return useMemo(() => {
    const scenes = extractScenes(lines);
    const paceData = scenes.map(buildPaceData);

    const totalDialogueLines = scenes.reduce((s, sc) => s + sc.dialogueLines, 0);
    const totalActionLines = scenes.reduce((s, sc) => s + sc.actionLines, 0);
    const totalContent = totalDialogueLines + totalActionLines;
    const overallDensity = totalContent > 0 ? totalDialogueLines / totalContent : 0;
    const flaggedScenes = paceData.filter((p) => p.isFlagged);

    return {
      scenes,
      paceData,
      totalDialogueLines,
      totalActionLines,
      totalScenes: scenes.length,
      overallDensity,
      flaggedScenes,
    };
  }, [lines]);
}
