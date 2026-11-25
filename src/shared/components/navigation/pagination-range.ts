export type PageToken = number | 'ellipsis-start' | 'ellipsis-end';

/**
 * Page numbers to render for a pager, with ellipses for gaps.
 * Always keeps the first and last page and `siblings` pages around the current one,
 * and never renders an ellipsis that would hide a single page.
 *
 *   getPaginationRange(1, 10)  → [1, 2, 3, 4, 5, 'ellipsis-end', 10]
 *   getPaginationRange(6, 10)  → [1, 'ellipsis-start', 5, 6, 7, 'ellipsis-end', 10]
 */
export function getPaginationRange(page: number, totalPages: number, siblings = 1): PageToken[] {
  const total = Math.max(0, Math.floor(totalPages));
  if (total === 0) return [];
  const current = Math.min(Math.max(1, page), total);
  // first + last + current + 2*siblings + 2 ellipses
  const slots = siblings * 2 + 5;
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i);

  if (total <= slots) return range(1, total);

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const showStart = left > 3;
  const showEnd = right < total - 2;

  if (!showStart) return [...range(1, slots - 2), 'ellipsis-end', total];
  if (!showEnd) return [1, 'ellipsis-start', ...range(total - (slots - 3), total)];
  return [1, 'ellipsis-start', ...range(left, right), 'ellipsis-end', total];
}
