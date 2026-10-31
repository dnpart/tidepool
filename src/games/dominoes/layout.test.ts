import { describe, expect, it } from 'vitest';
import { layoutLine, TILE_SIZES, type LineItem } from './layout';
import type { Placed } from './rules';

/** "63 34" is a line 6|3 then 3|4, left to right. */
const line = (ids: string): Placed[] => ids.split(' ').map((id) => ({ left: Number(id[0]), right: Number(id[1]) }));
const tiles = (items: LineItem[]) => items.filter((i) => i.kind === 'tile');

/** A long line of 28 tiles linked end to end, a few of them doubles. */
function longLine(): Placed[] {
  const out: Placed[] = [];
  for (let i = 0; out.length < 28; i++) {
    const n = i % 7;
    out.push({ left: n, right: (n + 1) % 7 });
    if (i % 5 === 0) out.push({ left: (n + 1) % 7, right: (n + 1) % 7 });
  }
  return out.slice(0, 28);
}

describe('the line of play', () => {
  it('is empty with no targets before the first tile', () => {
    expect(layoutLine([], 340, 400).items).toEqual([]);
  });

  it('puts the left end target first and the right end target last, showing the open numbers', () => {
    const { items } = layoutLine(line('63 34'), 340, 400);
    expect(items[0]).toMatchObject({ kind: 'end', end: 'left', value: 6 });
    expect(items[items.length - 1]).toMatchObject({ kind: 'end', end: 'right', value: 4 });
    expect(tiles(items).map((t) => t.kind === 'tile' && t.index)).toEqual([0, 1]);
  });

  it('uses the biggest tiles while the line is short', () => {
    expect(layoutLine(line('63 34'), 340, 400).size).toBe(TILE_SIZES[0]);
  });

  it('stands doubles crosswise', () => {
    const t = tiles(layoutLine(line('63 33 34'), 340, 400).items);
    expect(t.map((x) => x.kind === 'tile' && x.vertical)).toEqual([false, true, false]);
  });

  it('turns at the right edge and comes back, with tiles drawn the other way round', () => {
    const l = longLine().slice(0, 10);
    const { items, size } = layoutLine(l, 340, 1000);
    const rows = [...new Set(items.map((i) => Math.round(i.y / size)))];
    expect(rows.length).toBeGreaterThan(1);
    // The second row runs right to left
    const backRow = tiles(items).filter((t) => t.y > size * 2 && t.y < size * 4.5 && t.kind === 'tile' && !t.vertical);
    expect(backRow.length).toBeGreaterThan(0);
    for (const t of backRow) {
      if (t.kind !== 'tile') continue;
      // Going right to left, the line's left number is drawn on the right
      expect([t.a, t.b]).toEqual([l[t.index].right, l[t.index].left]);
    }
  });

  it('keeps every item inside the box, shrinking the tiles for a long line', () => {
    const l = longLine();
    for (const [w, h] of [[340, 480], [300, 260], [560, 300]]) {
      const layout = layoutLine(l, w, h);
      expect(layout.size).toBeLessThan(TILE_SIZES[0]);
      expect(layout.height).toBeLessThanOrEqual(h);
      for (const item of layout.items) {
        const iw = item.kind === 'end' ? layout.target : item.vertical ? layout.size : layout.size * 2;
        expect(item.x).toBeGreaterThanOrEqual(0);
        expect(item.x + iw).toBeLessThanOrEqual(w + 0.001);
      }
    }
  });

  it('never overlaps two items', () => {
    const layout = layoutLine(longLine(), 340, 480);
    const boxes = layout.items.map((i) => {
      const w = i.kind === 'end' ? layout.target : i.vertical ? layout.size : layout.size * 2;
      const h = i.kind === 'end' ? layout.target : i.vertical ? layout.size * 2 : layout.size;
      return { x: i.x, y: i.y, w, h };
    });
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart).toBe(true);
      }
    }
  });
});
