/**
 * diff.ts — Lightweight diff utility for version history
 * Implements a simplified Myers diff algorithm on lines.
 */
import type { DiffChunk } from '../types/screenplay';

export function computeDiff(oldText: string, newText: string): DiffChunk[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const chunks: DiffChunk[] = [];

  // LCS-based line diff
  const lcs = buildLCS(oldLines, newLines);
  let oi = 0, ni = 0;

  for (const [oidx, nidx] of lcs) {
    while (oi < oidx) { chunks.push({ op: 'delete', text: oldLines[oi++] + '\n' }); }
    while (ni < nidx) { chunks.push({ op: 'insert', text: newLines[ni++] + '\n' }); }
    chunks.push({ op: 'equal', text: oldLines[oi++] + '\n' });
    ni++;
  }
  while (oi < oldLines.length) { chunks.push({ op: 'delete', text: oldLines[oi++] + '\n' }); }
  while (ni < newLines.length) { chunks.push({ op: 'insert', text: newLines[ni++] + '\n' }); }

  return mergeChunks(chunks);
}

function buildLCS(a: string[], b: string[]): [number, number][] {
  const m = a.length, n = b.length;
  // For large diffs, use a simplified patience approach
  if (m * n > 100000) return simpleLCS(a, b);

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }

  const result: [number, number][] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i-1] === b[j-1]) { result.unshift([i-1, j-1]); i--; j--; }
    else if (dp[i-1][j] > dp[i][j-1]) i--;
    else j--;
  }
  return result;
}

function simpleLCS(a: string[], b: string[]): [number, number][] {
  // Simplified: just match lines by hash for large files
  const bMap = new Map<string, number[]>();
  b.forEach((line, i) => {
    if (!bMap.has(line)) bMap.set(line, []);
    bMap.get(line)!.push(i);
  });

  const matches: [number, number][] = [];
  const usedB = new Set<number>();
  for (let i = 0; i < a.length; i++) {
    const candidates = bMap.get(a[i]) ?? [];
    for (const j of candidates) {
      if (!usedB.has(j)) {
        matches.push([i, j]);
        usedB.add(j);
        break;
      }
    }
  }
  return matches;
}

function mergeChunks(chunks: DiffChunk[]): DiffChunk[] {
  const merged: DiffChunk[] = [];
  for (const chunk of chunks) {
    const last = merged[merged.length - 1];
    if (last && last.op === chunk.op) last.text += chunk.text;
    else merged.push({ ...chunk });
  }
  return merged;
}

export function getDiffStats(chunks: DiffChunk[]): { added: number; removed: number } {
  let added = 0, removed = 0;
  for (const c of chunks) {
    const lines = c.text.split('\n').filter(Boolean).length;
    if (c.op === 'insert') added += lines;
    else if (c.op === 'delete') removed += lines;
  }
  return { added, removed };
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
