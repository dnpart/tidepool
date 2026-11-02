// The Bubble Pals opponent: where to put each piece, and the presses that get it there. It only looks at its own tank,
// as a person would. The pace sets how carefully it chooses; the screen sets how fast it presses.
import {
  COLS,
  isPal,
  KINDS,
  pieceCells,
  ROWS,
  simulate,
  SPAWN_COL,
  fits,
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
  const turned: Piece = piece.type === 'pair' ? { ...piece, turn } : piece;
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
  const turns: Turn[] = piece.type === 'pair' ? [0, 1, 2, 3] : [0];
  const seen = new Set<string>();
  const out: Placement[] = [];
  for (const turn of turns) {
    for (let col = 0; col < COLS; col++) {
      const p = reach(tank.board, piece, { col, turn });
      if (!p) continue;
      // A pair of two of a kind looks the same turned round, so keep one of each shape
      const cells = pieceCells(p);
      const top = Math.min(...cells.map((x) => x.row));
      const key = cells.map(({ row, col: c, cell }) => `${row - top},${c},${cell}`).sort().join('|');
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

/** How good a placement looks: chains above all, then groups taking shape, then a low, safe stack. */
export function score(tank: Tank, placement: Placement, pace: Pace): number {
  const p = tank.piece && reach(tank.board, tank.piece, placement);
  const result = p && simulate(tank.board, p);
  if (!result) return -Infinity;
  const { board, links } = result;
  if (board[1][SPAWN_COL] !== null) return -1_000_000;
  let value = 0;
  const chain = links.length;
  const pals = links.reduce((n, l) => n + l.pals, 0);
  if (chain >= 2) value += chain * chain * 400;
  // A careless player pops whatever it can; a sharper one would rather keep building for a chain
  value += pals * (pace === 'gentle' ? 25 : 12);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (!isPal(cell)) continue;
      if (c + 1 < COLS && board[r][c + 1] === cell) value += 6;
      if (r + 1 < ROWS && board[r + 1][c] === cell) value += 6;
    }
  }
  // Chain potential: the longest chain one more friend dropped anywhere would set off
  if (pace !== 'gentle') {
    let best = 0;
    for (let c = 0; c < COLS; c++) {
      for (const kind of KINDS.slice(0, tank.kinds)) {
        const probe = simulate(board, { type: 'pair', pivot: kind, other: kind, row: 1, col: c, turn: 0 });
        if (probe) best = Math.max(best, probe.links.length);
      }
    }
    if (best >= 2) value += best * best * 60;
  }
  for (let c = 0; c < COLS; c++) {
    const h = height(board, c);
    value -= h * h * (c === SPAWN_COL ? 3 : 1);
  }
  if (height(board, SPAWN_COL) >= 9) value -= 5000;
  return value;
}

/** Where to put the current piece. Quick picks the best; Steady usually does; Gentle often settles for something nearby. */
export function choosePlacement(tank: Tank, pace: Pace, random: () => number = Math.random): Placement {
  const ranked = placements(tank)
    .map((p) => ({ p, v: score(tank, p, pace) }))
    .sort((a, b) => b.v - a.v);
  if (!ranked.length) return { col: tank.piece?.col ?? SPAWN_COL, turn: 0 };
  const safe = ranked.filter((r) => r.v > -1_000_000);
  const pool = safe.length ? safe : ranked;
  const reachOf = pace === 'quick' ? 1 : pace === 'steady' ? (random() < 0.75 ? 1 : 2) : random() < 0.4 ? 1 : 4;
  return pool[Math.floor(random() * Math.min(reachOf, pool.length))].p;
}

/** The next press toward a placement: turn first, then slide, then drop. Drops if the way is blocked. */
export function nextPress(tank: Tank, target: Placement): Press {
  const piece = tank.piece;
  if (!piece) return 'drop';
  if (piece.type === 'pair' && piece.turn !== target.turn) {
    const turned = { ...piece, turn: ((piece.turn + 1) % 4) as Turn };
    if (fits(tank.board, turned)) return 'turn';
  }
  if (piece.col !== target.col) {
    const moved = { ...piece, col: piece.col + (target.col > piece.col ? 1 : -1) };
    if (fits(tank.board, moved)) return target.col > piece.col ? 'right' : 'left';
  }
  return 'drop';
}
