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

// --- the spinner: a cross that zooms out only once it needs the room ---

type Dir = 0 | 1 | 2 | 3; // right, down, left, up
const STEP: Record<Dir, [number, number]> = { 0: [1, 0], 1: [0, 1], 2: [-1, 0], 3: [0, -1] };
/** The way each arm leaves the spinner. */
const ARM_DIR: Record<End, Dir> = { right: 0, down: 1, left: 2, up: 3 };

interface Rect { x: number; y: number; w: number; h: number }

export interface CrossLayout extends LineLayout {
  /** Draw everything at `size`, then scale the whole table by this (1 until it needs the room). */
  scale: number;
}

/** Zoom levels, from the full size down; the first that fits wins. */
export const ZOOMS = [1, 0.9, 0.8, 0.72, 0.64, 0.57, 0.5, 0.45, 0.4, 0.36] as const;

/**
 * Lays out a table with a spinner as a cross: the spinner standing in the middle, the left and right arms leaving its
 * long sides and the up and down arms its short ends. An arm runs straight until it would leave the table, then turns
 * a corner clockwise (right turns down, down turns left, and so on), the way tiles go round a real table. Tiles stay
 * at the full size while everything fits; after that the whole table zooms out a step at a time.
 */
export function layoutCross(
  board: { line: readonly Placed[]; spinner: number; up: readonly Placed[]; down: readonly Placed[] },
  ends: { end: End; value: number }[],
  width: number,
  height: number,
  size: number = TILE_SIZES[0],
): CrossLayout {
  // Every zoom and spinner spot is tried; the easiest to read wins: few corners, little zooming out, the spinner near
  // the middle
  let best: { layout: CrossLayout; cost: number } | null = null;
  let fallback: CrossLayout | null = null;
  for (const scale of ZOOMS) {
    for (const [fx, fy] of SPOTS) {
      const layout = cross(board, ends, width / scale, height / scale, size, fx, fy);
      const result = { ...layout.layout, scale };
      fallback = result;
      if (!layout.fits) continue;
      const cost = TURN_COST * layout.turns + (1 / scale - 1) + OFF_CENTER_COST * Math.hypot(fx - 0.5, fy - 0.5);
      if (!best || cost < best.cost - 1e-9) best = { layout: result, cost };
    }
  }
  return best?.layout ?? fallback!;
}

/**
 * How much a corner, and the spinner straying from the middle, count against a layout. Zooming out costs 1 / zoom - 1,
 * so a little is cheap and a lot is dear: one corner is worth zooming to about 85%, three to about 65%.
 */
const TURN_COST = 0.18;
const OFF_CENTER_COST = 0.3;

/** Where the spinner may sit, as fractions of the table, nearest the middle first. */
const SPOTS: [number, number][] = (() => {
  const steps = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74];
  const all = steps.flatMap((x) => steps.map((y): [number, number] => [x, y]));
  return all.sort((a, b) => Math.hypot(a[0] - 0.5, a[1] - 0.5) - Math.hypot(b[0] - 0.5, b[1] - 0.5));
})();

function cross(
  board: { line: readonly Placed[]; spinner: number; up: readonly Placed[]; down: readonly Placed[] },
  ends: { end: End; value: number }[],
  W: number,
  H: number,
  size: number,
  fx = 0.5,
  fy = 0.5,
): { layout: LineLayout; fits: boolean; turns: number } {
  let turns = 0;
  const gap = Math.round(size * 0.14);
  const target = Math.round(size * 1.1);
  const s = size;
  const value = board.line[board.spinner].left;
  const spin: Rect = { x: W * fx - s / 2, y: H * fy - s, w: s, h: 2 * s };
  const items: LineItem[] = [{ kind: 'tile', index: board.spinner, x: spin.x, y: spin.y, vertical: true, a: value, b: value }];
  const rects: Rect[] = [spin];

  // Each arm from the spinner outward, as (inner, outer) numbers
  const arms: Record<End, [number, number][]> = {
    left: board.line.slice(0, board.spinner).reverse().map((p) => [p.right, p.left]),
    right: board.line.slice(board.spinner + 1).map((p) => [p.left, p.right]),
    up: board.up.map((p) => [p.left, p.right]),
    down: board.down.map((p) => [p.left, p.right]),
  };
  let index = board.line.length;
  for (const end of ['left', 'right', 'up', 'down'] as End[]) {
    let dir = ARM_DIR[end];
    let head = spin;
    const lay = (along: number, across: number): Rect => {
      // Straight on, centered on the head; or round the corner if that would leave the table
      const straight = next(head, dir, along, across, gap, false);
      if (inside(straight, W, H, dir)) return straight;
      dir = ((dir + 1) % 4) as Dir;
      turns++;
      return next(head, dir, along, across, gap, true);
    };
    const armIndex = end === 'left' ? board.spinner - 1 : end === 'right' ? board.spinner + 1 : 0;
    arms[end].forEach(([inner, outer], k) => {
      const double = inner === outer;
      const rect = lay(double ? s : 2 * s, double ? 2 * s : s);
      const horizontal = dir === 0 || dir === 2;
      const vertical = double ? horizontal : !horizontal;
      // Pips read in the direction of travel: right and down put the inner number first
      const [a, b] = dir === 0 || dir === 1 ? [inner, outer] : [outer, inner];
      const tileIndex = end === 'left' ? armIndex - k : end === 'right' ? armIndex + k : index++;
      items.push({ kind: 'tile', index: tileIndex, x: rect.x, y: rect.y, vertical, a, b });
      rects.push(rect);
      head = rect;
    });
    const open = ends.find((e) => e.end === end);
    if (open) {
      const rect = lay(target, target);
      items.push({ kind: 'end', end, x: rect.x, y: rect.y, value: open.value });
      rects.push(rect);
    }
  }
  const fits = rects.every((r) => r.x >= -0.5 && r.y >= -0.5 && r.x + r.w <= W + 0.5 && r.y + r.h <= H + 0.5)
    && rects.every((r, i) => rects.every((q, j) => j <= i || !overlap(r, q)));
  return { layout: { size, items, target, height: H }, fits, turns };
}

/**
 * The next piece after `head` going `dir`: `along` long in that direction and `across` wide. Straight on, it's centered
 * on the head; after a corner, it sits flush with the head's far end, the way a turned tile hangs off the last one.
 */
function next(head: Rect, dir: Dir, along: number, across: number, gap: number, turned: boolean): Rect {
  const [dx, dy] = STEP[dir];
  const w = dx ? along : across;
  const h = dx ? across : along;
  let x: number, y: number;
  if (dx) x = dx > 0 ? head.x + head.w + gap : head.x - gap - w;
  else if (turned) {
    // Coming down or up out of a horizontal run: flush with whichever end the run was heading for
    x = dir === 1 ? head.x + head.w - w : head.x;
  } else x = head.x + head.w / 2 - w / 2;
  if (dy) y = dy > 0 ? head.y + head.h + gap : head.y - gap - h;
  else if (turned) y = dir === 2 ? head.y + head.h - h : head.y;
  else y = head.y + head.h / 2 - h / 2;
  return { x, y, w, h };
}

/** Whether a piece stays on the table in the direction it's heading. */
function inside(r: Rect, W: number, H: number, dir: Dir): boolean {
  if (dir === 0) return r.x + r.w <= W;
  if (dir === 1) return r.y + r.h <= H;
  if (dir === 2) return r.x >= 0;
  return r.y >= 0;
}

const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
