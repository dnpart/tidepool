// Where the line of play sits on the table: a snake that runs along the top, turns at the right edge and comes back,
// shrinking a little when it gets long (PLAN.md "Game 5: Dominoes", Screen). The two open ends are dashed targets at
// the start and the end of the snake.
import type { End, Placed } from './rules';

/** Short side of a tile in px, from roomy to tight. */
export const TILE_SIZES = [36, 33, 30, 27, 24, 21, 18, 16] as const;

export type LineItem =
  | {
      kind: 'tile';
      /** Index on the line, left to right. */
      index: number;
      x: number;
      y: number;
      /** A double stands crosswise. */
      vertical: boolean;
      /** The numbers as drawn: left then right, or top then bottom. */
      a: number;
      b: number;
    }
  | { kind: 'end'; end: End; x: number; y: number; value: number };

export interface LineLayout {
  size: number;
  items: LineItem[];
  /** Width and height of a target. */
  target: number;
  height: number;
}

const isDouble = (p: Placed) => p.left === p.right;

/** Lays out the line in a box `width` × `height`, at the biggest tile size that fits. */
export function layoutLine(line: readonly Placed[], width: number, height: number): LineLayout {
  let fallback: LineLayout | null = null;
  for (const size of TILE_SIZES) {
    const layout = snake(line, width, size);
    fallback = layout;
    if (layout.height <= height) return layout;
  }
  return fallback!;
}

function snake(line: readonly Placed[], width: number, size: number): LineLayout {
  const gap = Math.round(size * 0.14);
  const target = Math.round(size * 1.1);
  const rowH = size * 2;
  const rowGap = Math.round(size * 0.5);
  if (line.length === 0) return { size, items: [], target, height: 0 };

  type Cell = { w: number; place: (x: number, y: number, leftToRight: boolean) => LineItem };
  const ends = { left: line[0].left, right: line[line.length - 1].right };
  const cells: Cell[] = [
    { w: target, place: (x, y) => ({ kind: 'end', end: 'left', x, y: y + (rowH - target) / 2, value: ends.left }) },
    ...line.map((p, index): Cell => {
      const vertical = isDouble(p);
      return {
        w: vertical ? size : size * 2,
        place: (x, y, leftToRight) =>
          vertical
            ? { kind: 'tile', index, x, y, vertical, a: p.left, b: p.right }
            : // Going right to left, the tile's left number sits on the right
              { kind: 'tile', index, x, y: y + size / 2, vertical, a: leftToRight ? p.left : p.right, b: leftToRight ? p.right : p.left },
      };
    }),
    { w: target, place: (x, y) => ({ kind: 'end', end: 'right', x, y: y + (rowH - target) / 2, value: ends.right }) },
  ];

  // Split into rows, then lay each row out in its direction
  const rows: Cell[][] = [[]];
  let used = 0;
  for (const cell of cells) {
    const extra = (rows[rows.length - 1].length ? gap : 0) + cell.w;
    if (used + extra > width && rows[rows.length - 1].length) {
      rows.push([cell]);
      used = cell.w;
    } else {
      rows[rows.length - 1].push(cell);
      used += extra;
    }
  }
  const items: LineItem[] = [];
  rows.forEach((row, r) => {
    const y = r * (rowH + rowGap);
    const leftToRight = r % 2 === 0;
    let x = leftToRight ? 0 : width;
    for (const cell of row) {
      if (!leftToRight) x -= cell.w;
      items.push(cell.place(x, y, leftToRight));
      x = leftToRight ? x + cell.w + gap : x - gap;
    }
  });
  return { size, items, target, height: rows.length * rowH + (rows.length - 1) * rowGap };
}
