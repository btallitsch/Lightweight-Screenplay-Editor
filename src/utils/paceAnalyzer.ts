/**
 * paceAnalyzer.ts — Analyzes scene pacing and generates visual data
 */
import type { Scene, PaceDataPoint, PaceWarning } from '../types/screenplay';

export function analyzePacing(scenes: Scene[]): PaceDataPoint[] {
  return scenes.map((scene) => {
    const totalLines = scene.elements.filter(e => e.type !== 'empty').length;
    const dialogueDensity = totalLines > 0 ? scene.dialogueLineCount / totalLines : 0;
    const actionDensity = totalLines > 0 ? scene.actionLineCount / totalLines : 0;

    const warning = getWarning(scene, dialogueDensity, actionDensity);

    return {
      sceneIndex: scene.index,
      sceneHeading: scene.heading,
      totalLines,
      dialogueDensity,
      actionDensity,
      estimatedPageLength: scene.pageCount,
      warning,
    };
  });
}

function getWarning(
  scene: Scene,
  dialogueDensity: number,
  actionDensity: number
): PaceWarning | undefined {
  const total = scene.elements.filter(e => e.type !== 'empty').length;
  if (total < 3) return undefined;

  if (scene.pageCount > 5) {
    return {
      type: 'very_long_scene',
      message: `This scene is ~${scene.pageCount.toFixed(1)} pages. Consider splitting for better pacing.`,
      severity: 'warning',
    };
  }
  if (dialogueDensity > 0.75 && total > 10) {
    return {
      type: 'verbose_dialogue',
      message: 'Heavy dialogue density. Trim this exchange for tighter rhythm?',
      severity: 'warning',
    };
  }
  if (actionDensity > 0.85 && total > 10) {
    return {
      type: 'verbose_action',
      message: 'Dense action block. Break it up with reaction beats or dialogue?',
      severity: 'info',
    };
  }
  if (scene.dialogueLineCount === 0 && total > 15) {
    return {
      type: 'no_dialogue',
      message: 'Long silent scene — intentional or missing beats?',
      severity: 'info',
    };
  }
  return undefined;
}

export function getOverallStats(points: PaceDataPoint[]) {
  if (points.length === 0) return null;
  const totalPages = points.reduce((s, p) => s + p.estimatedPageLength, 0);
  const avgDialogue = points.reduce((s, p) => s + p.dialogueDensity, 0) / points.length;
  const avgAction = points.reduce((s, p) => s + p.actionDensity, 0) / points.length;
  const warnings = points.filter(p => p.warning).length;
  return { totalPages, avgDialogue, avgAction, warnings, sceneCount: points.length };
}
