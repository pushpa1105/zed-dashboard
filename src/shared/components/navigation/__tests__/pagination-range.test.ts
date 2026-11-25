import { getPaginationRange } from '../pagination-range';

describe('getPaginationRange', () => {
  it('lists every page when they fit', () => {
    expect(getPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses the end near the start', () => {
    expect(getPaginationRange(1, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 10]);
    expect(getPaginationRange(3, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 10]);
  });

  it('collapses both sides in the middle', () => {
    expect(getPaginationRange(6, 10)).toEqual([1, 'ellipsis-start', 5, 6, 7, 'ellipsis-end', 10]);
  });

  it('collapses the start near the end', () => {
    expect(getPaginationRange(10, 10)).toEqual([1, 'ellipsis-start', 6, 7, 8, 9, 10]);
    expect(getPaginationRange(8, 10)).toEqual([1, 'ellipsis-start', 6, 7, 8, 9, 10]);
  });

  it('honours wider sibling counts', () => {
    expect(getPaginationRange(10, 20, 2)).toEqual([
      1,
      'ellipsis-start',
      8,
      9,
      10,
      11,
      12,
      'ellipsis-end',
      20,
    ]);
  });

  it('clamps out-of-range pages and handles empty sets', () => {
    expect(getPaginationRange(99, 3)).toEqual([1, 2, 3]);
    expect(getPaginationRange(1, 0)).toEqual([]);
  });

  it('never hides a single page behind an ellipsis', () => {
    for (let page = 1; page <= 12; page++) {
      const tokens = getPaginationRange(page, 12);
      tokens.forEach((token, i) => {
        if (typeof token === 'number') return;
        const prev = tokens[i - 1] as number;
        const next = tokens[i + 1] as number;
        expect(next - prev).toBeGreaterThan(2);
      });
    }
  });
});
