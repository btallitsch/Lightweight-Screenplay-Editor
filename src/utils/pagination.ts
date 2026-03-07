export const LINES_PER_PAGE = 55;

export function calculatePageCount(lineCount: number) {
  return Math.max(1, Math.ceil(lineCount / LINES_PER_PAGE));
}
