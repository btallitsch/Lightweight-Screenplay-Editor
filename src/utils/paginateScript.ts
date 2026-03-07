export const LINES_PER_PAGE = 55;

export function paginateScript(text: string) {
  const lines = text.split("\n");
  const pages: string[][] = [];

  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE));
  }

  return pages;
}
