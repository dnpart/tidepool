import { describe, expect, it } from 'vitest';
import { fallDistances, riseDistances } from './fallDistances';

/** A board from rows of letters ('.' is empty), row 0 at the top. */
const board = (rows: string[]) => rows.map((r) => [...r].map((ch) => (ch === '.' ? null : ch)));

describe('fallDistances', () => {
  it('matches things in a column by their order, minus what left', () => {
    // The bottom row washes away; the block above it falls one row, the one above that two (into a hole)
    const before = board(['a.', '..', 'b.', 'cc']);
    const after = board(['..', '..', 'a.', 'b.']);
    const gone = new Set(['3,0', '3,1']);
    expect([...fallDistances(before, after, gone, [])]).toEqual([['3,0', 1], ['2,0', 2]]);
  });

  it('counts a dropped piece from where it was, and new things from above the top', () => {
    const before = board(['..', '..', '..']);
    const after = board(['..', '.x', 'yx']);
    const drops = fallDistances(before, after, new Set(), [{ row: 0, col: 1 }, { row: 1, col: 1 }]);
    expect(drops.get('2,1')).toBe(1);
    expect(drops.get('1,1')).toBe(1);
    expect(drops.get('2,0')).toBe(3); // nothing to match: it came from row -1
  });
});

describe('riseDistances', () => {
  it('moves everything up by the rows pushed in', () => {
    expect([...riseDistances(board(['..', 'a.', 'ss']), 1)]).toEqual([['1,0', -1], ['2,0', -1], ['2,1', -1]]);
  });
});
