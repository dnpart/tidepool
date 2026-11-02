// Coral Stack rules as pure functions (PLAN.md "Game 9: Coral Stack"): our own rows-of-blocks game. Pieces are three
// coral blocks, straight or bent; a full row washes away, and then every loose block sinks like sand into the holes
// below it, which can fill more rows (a chain). Nothing here mutates its input, and nothing here knows about time: the
// screen calls `fall` on its own timer and `resolve` once per wave, so each can be shown. One `Tank` is one player's
// side; Versus is two tanks passing sandbars with `exchange`, so either side could later be a person on another phone.
import { seededRandom } from '../../util/random';

export const COLS = 8;
/** Rows 0 and 1 are hidden above the tank (pieces start there); rows 2 to 16 are the 15 rows you see. */
export const HIDDEN = 2;
export const ROWS = HIDDEN + 15;
/** The column a new piece's pivot block starts in, on the top row you see. */
export const SPAWN_COL = 3;
export const SPAWN_ROW = HIDDEN;
/** Rows washed away for each level. */
export const ROWS_PER_LEVEL = 10;
/** Points for washing 1, 2, 3 or 4 rows in one wave; each row past four adds ROW_POINTS_EXTRA. */
export const ROW_POINTS = [0, 100, 300, 600, 1000] as const;
export const ROW_POINTS_EXTRA = 500;
/** The chain doubling stops growing here (×32), as in Bubble Pals. */
export const MAX_DOUBLING = 32;
/** Most sandbars that push up into a tank at once. */
export const MAX_SANDBARS_AT_ONCE = 4;
/** Most sandbars one chain can send. */
export const MAX_SENT = 8;

/** Three coral colors; they're only decoration. */
export const CORALS = ['a', 'b', 'c'] as const;
export type Coral = (typeof CORALS)[number];
export type Cell = Coral | 'sand' | null;
/** `board[row][col]`, row 0 at the top. */
export type Board = Cell[][];
export type Shape = 'straight' | 'bent';
/** Quarter turns clockwise from the starting position. A straight piece looks the same at 0 and 2, and at 1 and 3. */
export type Turn = 0 | 1 | 2 | 3;

/** The pivot block is at `row`, `col`; the other two sit around it, by the shape and turn. */
export interface Piece {
  shape: Shape;
  color: Coral;
  row: number;
  col: number;
  turn: Turn;
}

/** What the next piece will be, for the preview. */
export interface Preview {
  shape: Shape;
  color: Coral;
}

/** One wave of a chain: the rows that washed away (row numbers before the wave), and what it was worth. */
export interface Wave {
  rows: number[];
  /** 1 for the first wave after a piece lands, 2 for the next, and so on. */
  chain: number;
  points: number;
  /** The board once the rows are gone, before the sand sinks (for the screen to show the wave, then the sinking). */
  washed: Board;
}

export type TankEvent =
  | { kind: 'lock' }
  | { kind: 'wave'; wave: Wave }
  /** The chain (if any) is over: sandbars sent and cancelled, sandbars that pushed up (and their gap), and the next piece is out. */
  | { kind: 'settled'; sent: number; cancelled: number; sandbars: number; gap: number | null }
  | null;

export interface Tank {
  board: Board;
  piece: Piece | null;
  /** 'falling': a piece is coming down. 'resolving': it landed; call `resolve` until it's 'falling' again. */
  phase: 'falling' | 'resolving' | 'over';
  /** The piece sequence: two tanks with the same seed get the same pieces, which keeps Versus fair. */
  seed: number;
  /** Pieces dealt so far. */
  dealt: number;
  score: number;
  /** Rows washed away this game. */
  rows: number;
  /** Waves so far in the chain being resolved, and the sandbars it has earned. */
  chain: number;
  bars: number;
  /** Sandbars waiting to push up into this tank. */
  incoming: number;
  /** Sandbars this tank has sent and the other tank hasn't taken yet (`exchange`). */
  outgoing: number;
  last: TankEvent;
}

// --- the board ---

export const emptyBoard = (): Board => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
const copy = (board: Board): Board => board.map((row) => [...row]);
const inside = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

/** Sinking sand: every block drops straight down its column into any hole below it, keeping its order. */
export function sink(board: Board): Board {
  const out = emptyBoard();
  for (let c = 0; c < COLS; c++) {
    let r = ROWS - 1;
    for (let row = ROWS - 1; row >= 0; row--) {
      const cell = board[row][c];
      if (cell !== null) out[r--][c] = cell;
    }
  }
  return out;
}

/** The rows filled from side to side (sand counts; a sandbar's gap keeps it from being full on its own). */
export const fullRows = (board: Board): number[] =>
  board.flatMap((row, r) => (row.every((cell) => cell !== null) ? [r] : []));

/** Points for one wave of `n` rows, `chain` waves into a chain. */
export function wavePoints(n: number, chain: number): number {
  const base = n <= 4 ? ROW_POINTS[n] : ROW_POINTS[4] + (n - 4) * ROW_POINTS_EXTRA;
  return base * Math.min(MAX_DOUBLING, 2 ** (chain - 1));
}

/** Sandbars one wave earns: one for each row past the first, plus two if it's a later link of a chain. */
export const barsForWave = (n: number, chain: number): number => Math.max(0, n - 1) + (chain > 1 ? 2 : 0);

/** The next wave on this board, if a row is full: those rows wash away and everything sinks. */
function nextWave(board: Board, chain: number): { wave: Wave; board: Board } | null {
  const rows = fullRows(board);
  if (!rows.length) return null;
  const washed = copy(board);
  for (const r of rows) washed[r] = Array<Cell>(COLS).fill(null);
  return { wave: { rows, chain, points: wavePoints(rows.length, chain), washed }, board: sink(washed) };
}

// --- pieces ---

/** Where the other two blocks sit around the pivot at turn 0: straight lies flat; bent is a corner, up and right. */
const BASE: Record<Shape, [number, number][]> = {
  straight: [[0, -1], [0, 1]],
  bent: [[-1, 0], [0, 1]],
};

/** A quarter turn clockwise: up becomes right, right becomes down. */
const rotate = ([dy, dx]: [number, number]): [number, number] => [dx, -dy];

/** The cells a piece covers, pivot first. */
export function pieceCells(piece: Piece): { row: number; col: number }[] {
  const cells = [{ row: piece.row, col: piece.col }];
  for (let offset of BASE[piece.shape]) {
    for (let i = 0; i < piece.turn; i++) offset = rotate(offset);
    cells.push({ row: piece.row + offset[0], col: piece.col + offset[1] });
  }
  return cells;
}

export const fits = (board: Board, piece: Piece): boolean =>
  pieceCells(piece).every(({ row, col }) => inside(row, col) && board[row][col] === null);

/** The piece dealt at `index` for this seed: a little more often bent than straight, in any of the three colors. */
export function pieceAt(seed: number, index: number): Preview {
  const random = seededRandom((seed + Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const shape: Shape = random() < 0.4 ? 'straight' : 'bent';
  return { shape, color: CORALS[Math.floor(random() * CORALS.length)] };
}

export const level = (tank: Tank): number => 1 + Math.floor(tank.rows / ROWS_PER_LEVEL);

export const preview = (tank: Tank): Preview => pieceAt(tank.seed, tank.dealt);

/** Brings out the next piece, or ends the game if it has no room to come out. */
function spawn(tank: Tank): Tank {
  const piece: Piece = { ...pieceAt(tank.seed, tank.dealt), row: SPAWN_ROW, col: SPAWN_COL, turn: 0 };
  if (!fits(tank.board, piece)) return { ...tank, piece: null, phase: 'over' };
  return { ...tank, piece, phase: 'falling', dealt: tank.dealt + 1 };
}

export function newTank(opts: { seed: number }): Tank {
  return spawn({
    board: emptyBoard(),
    piece: null,
    phase: 'falling',
    seed: opts.seed >>> 0,
    dealt: 0,
    score: 0,
    rows: 0,
    chain: 0,
    bars: 0,
    incoming: 0,
    outgoing: 0,
    last: null,
  });
}

// --- moving the piece ---

/** Moves the piece one column left (-1) or right (1). Returns the same tank if it can't. */
export function move(tank: Tank, dx: -1 | 1): Tank {
  if (tank.phase !== 'falling' || !tank.piece) return tank;
  const moved = { ...tank.piece, col: tank.piece.col + dx };
  return fits(tank.board, moved) ? { ...tank, piece: moved, last: null } : tank;
}

/** Where a turned piece may step to make room: nowhere, one column either way, or one row up off the floor or a stack. */
const KICKS: [number, number][] = [[0, 0], [0, -1], [0, 1], [-1, 0]];

/**
 * Turns the piece a quarter clockwise (1) or counterclockwise (-1) around its pivot. Against a wall or a stack it
 * steps away to make room. Returns the same tank if nothing works.
 */
export function turn(tank: Tank, dir: 1 | -1 = 1): Tank {
  const piece = tank.piece;
  if (tank.phase !== 'falling' || !piece) return tank;
  const turned = { ...piece, turn: ((piece.turn + dir + 4) % 4) as Turn };
  for (const [dy, dx] of KICKS) {
    const kicked = { ...turned, row: turned.row + dy, col: turned.col + dx };
    if (fits(tank.board, kicked)) return { ...tank, piece: kicked, last: null };
  }
  return tank;
}

/** Puts the piece into the board where it is. Blocks don't sink on landing, only after a wave. */
function lock(tank: Tank): Tank {
  const piece = tank.piece!;
  const board = copy(tank.board);
  for (const { row, col } of pieceCells(piece)) board[row][col] = piece.color;
  return { ...tank, board, piece: null, phase: 'resolving', chain: 0, bars: 0, last: { kind: 'lock' } };
}

/** One row down, on the screen's timer; a piece that can't go further lands. */
export function fall(tank: Tank): Tank {
  if (tank.phase !== 'falling' || !tank.piece) return tank;
  const down = { ...tank.piece, row: tank.piece.row + 1 };
  return fits(tank.board, down) ? { ...tank, piece: down, last: null } : lock(tank);
}

/** Drops the piece straight to where it lands. */
export function drop(tank: Tank): Tank {
  let t = tank;
  while (t.phase === 'falling' && t.piece) t = fall(t);
  return t;
}

/** Where the piece would land, for the faint outline. */
export function landing(tank: Tank): Piece | null {
  let piece = tank.piece;
  if (!piece) return null;
  while (fits(tank.board, { ...piece, row: piece.row + 1 })) piece = { ...piece, row: piece.row + 1 };
  return piece;
}

// --- after a piece lands ---

/**
 * Pushes up to MAX_SANDBARS_AT_ONCE waiting sandbars in from the bottom, all with the gap in one column. Returns null
 * if that pushes a block out of the top of the tank (no room: the game is over).
 */
function pushSandbars(tank: Tank): { board: Board; sandbars: number; gap: number | null } | null {
  const n = Math.min(tank.incoming, MAX_SANDBARS_AT_ONCE);
  if (n === 0) return { board: tank.board, sandbars: 0, gap: null };
  if (tank.board.slice(0, n).some((row) => row.some((cell) => cell !== null))) return null;
  const random = seededRandom(((tank.seed ^ 0x5bd1e995) + Math.imul(tank.dealt, 7919) + tank.rows) >>> 0);
  const gap = Math.floor(random() * COLS);
  const bar = (): Cell[] => Array.from({ length: COLS }, (_, c) => (c === gap ? null : 'sand'));
  const board = [...tank.board.slice(n).map((row) => [...row]), ...Array.from({ length: n }, bar)];
  return { board, sandbars: n, gap };
}

/**
 * The next step after a piece lands, one per call so the screen can show it: a wave washes full rows away (and the
 * sand sinks), or, once no row is full, the chain's sandbars go out (first cancelling sandbars waiting here), any
 * still waiting push up from the bottom, and the next piece comes out.
 */
export function resolve(tank: Tank): Tank {
  if (tank.phase !== 'resolving') return tank;
  const chain = tank.chain + 1;
  const found = nextWave(tank.board, chain);
  if (found) {
    const { wave } = found;
    return {
      ...tank,
      board: found.board,
      chain,
      bars: tank.bars + barsForWave(wave.rows.length, chain),
      score: tank.score + wave.points,
      rows: tank.rows + wave.rows.length,
      last: { kind: 'wave', wave },
    };
  }
  const attack = Math.min(MAX_SENT, tank.bars);
  const cancelled = Math.min(attack, tank.incoming);
  const settled = { ...tank, incoming: tank.incoming - cancelled, outgoing: tank.outgoing + attack - cancelled, chain: 0, bars: 0 };
  const pushed = pushSandbars(settled);
  const event = { kind: 'settled' as const, sent: attack - cancelled, cancelled, sandbars: pushed?.sandbars ?? 0, gap: pushed?.gap ?? null };
  if (!pushed) return { ...settled, piece: null, phase: 'over', last: event };
  const next = spawn({ ...settled, board: pushed.board, incoming: settled.incoming - pushed.sandbars });
  return { ...next, last: event };
}

/** Versus: each tank's sent sandbars join the other's waiting sandbars. */
export function exchange(a: Tank, b: Tank): [Tank, Tank] {
  if (!a.outgoing && !b.outgoing) return [a, b];
  return [
    { ...a, outgoing: 0, incoming: a.incoming + b.outgoing },
    { ...b, outgoing: 0, incoming: b.incoming + a.outgoing },
  ];
}

/**
 * What a piece would do if dropped where it is now, without changing anything: the board once every wave has washed
 * away and the sand has sunk, and the waves. Used by the opponent to weigh its choices.
 */
export function simulate(board: Board, piece: Piece): { board: Board; waves: Wave[] } | null {
  if (!fits(board, piece)) return null;
  let p = piece;
  while (fits(board, { ...p, row: p.row + 1 })) p = { ...p, row: p.row + 1 };
  let b = copy(board);
  for (const { row, col } of pieceCells(p)) b[row][col] = p.color;
  const waves: Wave[] = [];
  for (let chain = 1; ; chain++) {
    const found = nextWave(b, chain);
    if (!found) break;
    waves.push(found.wave);
    b = found.board;
  }
  return { board: b, waves };
}

// --- speed (shared with the other falling-block games) ---

export { PACES, soloFallMs, versusFallMs, type Pace } from '../falling/speed';
