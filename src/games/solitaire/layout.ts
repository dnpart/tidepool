// Where every card sits on the Solitaire table. Pure, so the screen can animate between layouts.
import { cardId, type Card } from '../../cards/deck';
import type { Board, Source, Target } from './rules';

export interface Metrics {
  width: number;
  height: number;
  cardW: number;
  cardH: number;
  pad: number;
  gap: number;
  top: number;
  row2: number;
}

export interface Placed {
  card: Card;
  x: number;
  y: number;
  z: number;
  faceUp: boolean;
  /** Where a drag or tap on this card picks up from; absent for cards that can't be picked up. */
  source?: Source;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PAD = 8;
const GAP = 5;
const TOP = 10;
const ROW_GAP = 14;
const DOWN_STEP = 10;
const UP_STEP = 24;
const MIN_DOWN_STEP = 4;
const MIN_UP_STEP = 14;
const WASTE_FAN = 13;

/** Card width = (table width − 16 − 6 × 5) / 7, from PLAN.md. */
export function measure(width: number, height: number): Metrics {
  const cardW = Math.floor((width - 2 * PAD - 6 * GAP) / 7);
  const cardH = Math.round(cardW * 1.4);
  return { width, height, cardW, cardH, pad: PAD, gap: GAP, top: TOP, row2: TOP + cardH + ROW_GAP };
}

export const columnX = (m: Metrics, i: number): number => m.pad + i * (m.cardW + m.gap);

/** Face-down and face-up steps for a column, squeezed if it would run off the bottom of the table. */
export function columnSteps(m: Metrics, down: number, up: number): { downStep: number; upStep: number } {
  const room = m.height - m.row2 - m.cardH - 8;
  let downStep = DOWN_STEP;
  let upStep = UP_STEP;
  const need = () => down * downStep + Math.max(0, up - 1) * upStep;
  if (need() <= room) return { downStep, upStep };
  downStep = MIN_DOWN_STEP;
  if (up > 1) upStep = Math.max(MIN_UP_STEP, Math.min(UP_STEP, (room - down * downStep) / (up - 1)));
  return { downStep, upStep };
}

export const stockRect = (m: Metrics): Rect => ({ x: columnX(m, 0), y: m.top, w: m.cardW, h: m.cardH });
export const wasteRect = (m: Metrics): Rect => ({ x: columnX(m, 1), y: m.top, w: m.cardW, h: m.cardH });
export const foundationRect = (m: Metrics, i: number): Rect => ({ x: columnX(m, 3 + i), y: m.top, w: m.cardW, h: m.cardH });

/** The area a column covers, from its slot to the bottom of its last card. */
export function columnRect(m: Metrics, board: Board, i: number): Rect {
  const { down, up } = board.tableau[i];
  const { downStep, upStep } = columnSteps(m, down.length, up.length);
  const extra = down.length * downStep + Math.max(0, up.length - 1) * upStep;
  return { x: columnX(m, i), y: m.row2, w: m.cardW, h: m.cardH + (up.length || down.length ? extra : 0) };
}

export const targetRect = (m: Metrics, board: Board, t: Target): Rect =>
  t.pile === 'foundation' ? foundationRect(m, t.index) : columnRect(m, board, t.index);

export function layout(board: Board, m: Metrics, drawCount: 1 | 3): Map<string, Placed> {
  const placed = new Map<string, Placed>();
  const put = (p: Placed) => placed.set(cardId(p.card), p);

  board.stock.forEach((card, i) => put({ card, x: columnX(m, 0), y: m.top, z: i, faceUp: false }));

  // With Draw 3 the top three waste cards fan out to the right
  const fanned = drawCount === 3 ? 3 : 1;
  const fanStart = Math.max(0, board.waste.length - fanned);
  board.waste.forEach((card, i) => {
    const offset = Math.max(0, i - fanStart) * WASTE_FAN;
    const isTop = i === board.waste.length - 1;
    put({ card, x: columnX(m, 1) + offset, y: m.top, z: 100 + i, faceUp: true, source: isTop ? { pile: 'waste' } : undefined });
  });

  board.foundations.forEach((pile, index) =>
    pile.forEach((card, i) => {
      const isTop = i === pile.length - 1;
      put({ card, x: columnX(m, 3 + index), y: m.top, z: 200 + i, faceUp: true, source: isTop ? { pile: 'foundation', index } : undefined });
    }),
  );

  board.tableau.forEach((column, index) => {
    const { downStep, upStep } = columnSteps(m, column.down.length, column.up.length);
    const x = columnX(m, index);
    column.down.forEach((card, i) => put({ card, x, y: m.row2 + i * downStep, z: 300 + i, faceUp: false }));
    const upTop = m.row2 + column.down.length * downStep;
    column.up.forEach((card, i) =>
      put({
        card,
        x,
        y: upTop + i * upStep,
        z: 300 + column.down.length + i,
        faceUp: true,
        source: { pile: 'tableau', index, cardIndex: i },
      }),
    );
  });

  return placed;
}

const overlap = (a: Rect, b: Rect): number =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** The legal target a dropped card covers most, or the nearest one within a card's width. */
export function dropTarget(m: Metrics, board: Board, dragged: Rect, legal: Target[]): Target | null {
  let best: Target | null = null;
  let bestArea = 0;
  for (const t of legal) {
    const area = overlap(dragged, targetRect(m, board, t));
    if (area > bestArea) [best, bestArea] = [t, area];
  }
  if (best) return best;
  const cx = dragged.x + dragged.w / 2;
  const cy = dragged.y + dragged.h / 2;
  let bestDist = m.cardW * 1.1;
  for (const t of legal) {
    const r = targetRect(m, board, t);
    const dx = Math.max(r.x - cx, 0, cx - (r.x + r.w));
    const dy = Math.max(r.y - cy, 0, cy - (r.y + r.h));
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) [best, bestDist] = [t, dist];
  }
  return best;
}
