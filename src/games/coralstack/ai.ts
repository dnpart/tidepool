// The Coral Stack opponent: where to put each piece, and the presses that get it there. It only looks at its own tank,
// as a person would. The pace sets how carefully it chooses; the screen sets how fast it presses.
import {
  barsForWave,
  COLS,
  fits,
  HIDDEN,
  MAX_SANDBARS_AT_ONCE,
  MAX_SENT,
  pieceCells,
  ROWS,
  simulate,
  SPAWN_COL,
  turn as turnPiece,
  type Board,
  type Pace,
  type Piece,
  type Tank,
  type Turn,
} from './rules';

export interface Placement {
  col: number;
  turn: Turn;
}

export type Press = 'left' | 'right' | 'turn' | 'drop';

/** The piece turned to `turn` and slid to `col` at the row it's on, if every column on the way is clear. */
function reach(board: Board, piece: Piece, { col, turn }: Placement): Piece | null {
  const turned: Piece = { ...piece, turn };
  if (!fits(board, turned)) return null;
  const step = col > piece.col ? 1 : -1;
  let p = turned;
  while (p.col !== col) {
    p = { ...p, col: p.col + step };
    if (!fits(board, p)) return null;
  }
  return p;
}

/** Every different place the piece can be dropped from where it is now. */
export function placements(tank: Tank): Placement[] {
  const piece = tank.piece;
  if (!piece) return [];
  const seen = new Set<string>();
  const out: Placement[] = [];
  for (const turn of [0, 1, 2, 3] as Turn[]) {
    for (let col = 0; col < COLS; col++) {
      const p = reach(tank.board, piece, { col, turn });
      if (!p) continue;
      // A straight piece looks the same turned halfway round, so keep one of each shape and place
      const key = pieceCells(p).map(({ row, col: c }) => `${row - p.row},${c}`).sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ col, turn });
    }
  }
  return out;
}

const height = (board: Board, col: number) => {
  let r = 0;
  while (r < ROWS && board[r][col] === null) r++;
  return ROWS - r;
};

/** Empty cells with a block somewhere above them. */
function holes(board: Board): number {
  let n = 0;
  for (let c = 0; c < COLS; c++) {
    let roof = false;
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c] !== null) roof = true;
      else if (roof) n++;
    }
  }
  return n;
}

export interface Weights {
  rows: number;
  bars: number;
  /** Sandbars the best next piece could send from the stack this leaves (0: don't look). */
  probe: number;
  height: number;
  holes: number;
  bumps: number;
  /** The stack height where a low, safe stack starts to matter more. */
  safe: number;
}

/**
 * By pace. In 200 pieces with no clock, Gentle sends about 20 sandbars, Steady 35 and Quick 52: the sharper paces care
 * less about washing a lone row, and look for stacks where the next piece could wash several or set off a chain.
 */
export const WEIGHTS: Record<Pace, Weights> = {
  gentle: { rows: 120, bars: 40, probe: 0, height: 4, holes: 30, bumps: 6, safe: 9 },
  steady: { rows: 40, bars: 200, probe: 60, height: 3, holes: 18, bumps: 5, safe: 9 },
  quick: { rows: -20, bars: 260, probe: 140, height: 2, holes: 14, bumps: 5, safe: 10 },
};

/** The most sandbars one more piece (either shape, any place it can reach from the top) could send from this stack. */
function bestNext(board: Board): number {
  let best = 0;
  for (const shape of ['straight', 'bent'] as const) {
    for (const turn of (shape === 'straight' ? [0, 1] : [0, 1, 2, 3]) as Turn[]) {
      for (let col = 0; col < COLS; col++) {
        const result = simulate(board, { shape, color: 'a', row: 1, col, turn });
        if (!result) continue;
        const bars = result.waves.reduce((n, w) => n + barsForWave(w.rows.length, w.chain), 0);
        if (bars > best) best = bars;
      }
    }
  }
  return best;
}

/** How good a placement looks: sandbars sent and rows washed, then a low, smooth stack without holes. */
export function score(tank: Tank, placement: Placement, pace: Pace, w: Weights = WEIGHTS[pace]): number {
  const p = tank.piece && reach(tank.board, tank.piece, placement);
  const result = p && simulate(tank.board, p);
  if (!result) return -Infinity;
  const { board, waves } = result;
  const rows = waves.reduce((n, wave) => n + wave.rows.length, 0);
  const bars = waves.reduce((n, wave) => n + barsForWave(wave.rows.length, wave.chain), 0);
  const heights = Array.from({ length: COLS }, (_, c) => height(board, c));
  // Sandbars waiting here will push the whole stack up after this piece
  const pushed = Math.min(MAX_SANDBARS_AT_ONCE, Math.max(0, tank.incoming - Math.min(MAX_SENT, bars)));
  const tallest = Math.max(...heights) + pushed;
  // Anything left above the tank, or a stack where the next piece comes out, is how games are lost
  const spawnHeight = Math.max(...[-1, 0, 1].map((d) => heights[SPAWN_COL + d])) + pushed;
  if (tallest > ROWS - HIDDEN || spawnHeight >= ROWS - HIDDEN) return -1_000_000 + tallest;
  // A careless player washes whatever row it can; a sharper one would rather wash several at once, or set off a chain
  let value = rows * w.rows + bars * w.bars;
  if (w.probe) value += bestNext(board) * w.probe;
  value -= heights.reduce((a, h) => a + h, 0) * w.height;
  value -= holes(board) * w.holes;
  for (let c = 0; c + 1 < COLS; c++) value -= Math.abs(heights[c] - heights[c + 1]) * w.bumps;
  // The higher the stack, the more a low, safe one matters
  if (tallest > w.safe) value -= (tallest - w.safe) ** 2 * 40;
  return value;
}

/** Where to put the current piece. Quick picks the best; Steady usually does; Gentle often settles for something nearby. */
export function choosePlacement(tank: Tank, pace: Pace, random: () => number = Math.random, w: Weights = WEIGHTS[pace]): Placement {
  const ranked = placements(tank)
    .map((p) => ({ p, v: score(tank, p, pace, w) }))
    .sort((a, b) => b.v - a.v);
  if (!ranked.length) return { col: tank.piece?.col ?? 0, turn: tank.piece?.turn ?? 0 };
  const safe = ranked.filter((r) => r.v > -1_000_000 + ROWS);
  const pool = safe.length ? safe : ranked;
  const reachOf = pace === 'quick' ? 1 : pace === 'steady' ? (random() < 0.75 ? 1 : 2) : random() < 0.4 ? 1 : 4;
  return pool[Math.floor(random() * Math.min(reachOf, pool.length))].p;
}

/** The next press toward a placement: turn first, then slide, then drop. Drops if the way is blocked. */
export function nextPress(tank: Tank, target: Placement): Press {
  const piece = tank.piece;
  if (!piece) return 'drop';
  if (piece.turn !== target.turn && turnPiece(tank) !== tank) return 'turn';
  if (piece.col !== target.col) {
    const moved = { ...piece, col: piece.col + (target.col > piece.col ? 1 : -1) };
    if (fits(tank.board, moved)) return target.col > piece.col ? 'right' : 'left';
  }
  return 'drop';
}
