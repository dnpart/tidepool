// Coral Stack rules as pure functions (PLAN.md "Game 9: Coral Stack"): our own rows-of-blocks game. Pieces are three
// coral blocks, straight or bent; a full row washes away, and then every loose block sinks like sand into the holes
// below it, which can fill more rows (a chain). Continuous (called 'solo' here) plays for as long as it can; Levels
// starts on an uneven stack of sand, and a level is won once the tank is empty: the sand and every coral block. Nothing here mutates its input, and nothing here knows
// about time: the screen calls `fall` on its own timer and `resolve` once per wave, so each can be shown.
import { seededRandom } from '../../util/random';

export const COLS = 8;
/** Rows 0 and 1 are hidden above the tank (pieces start there); rows 2 to 16 are the 15 rows you see. */
export const HIDDEN = 2;
export const ROWS = HIDDEN + 15;
/** The column a new piece's pivot block starts in, on the top row you see. */
export const SPAWN_COL = 3;
export const SPAWN_ROW = HIDDEN;
/** Continuous: rows washed away for each level. */
export const ROWS_PER_LEVEL = 10;
/** Points for washing 1, 2, 3 or 4 rows in one wave; each row past four adds ROW_POINTS_EXTRA. */
export const ROW_POINTS = [0, 100, 300, 600, 1000] as const;
export const ROW_POINTS_EXTRA = 500;
/** The chain doubling stops growing here (×32), as in Bubble Pals. */
export const MAX_DOUBLING = 32;
/** Levels: the sand starts this many rows high, one row higher every LEVELS_PER_ROW levels, up to MAX_SAND_ROWS. */
export const FIRST_SAND_ROWS = 3;
export const LEVELS_PER_ROW = 2;
export const MAX_SAND_ROWS = 9;

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
  /** Sand blocks that washed away with these rows. */
  sand: number;
  /** The board once the rows are gone, before the sand sinks (for the screen to show the wave, then the sinking). */
  washed: Board;
}

export type TankEvent =
  | { kind: 'lock' }
  | { kind: 'wave'; wave: Wave }
  /** The chain (if any) is over and the next piece is out. */
  | { kind: 'settled' }
  /** Levels: the tank is empty, sand and coral, and the level is won. */
  | { kind: 'cleared' }
  | null;

export interface Tank {
  board: Board;
  piece: Piece | null;
  /**
   * 'falling': a piece is coming down. 'resolving': it landed; call `resolve` until it's 'falling' again.
   * 'cleared': Levels only, the tank is empty and the level is won. 'over': no room for the next piece.
   */
  phase: 'falling' | 'resolving' | 'cleared' | 'over';
  /** The piece sequence (and, in Levels, the sand). */
  seed: number;
  /** Pieces dealt so far. */
  dealt: number;
  /** Levels: the level being played (its sand height and speed). Null in Continuous. */
  stage: number | null;
  score: number;
  /** Rows washed away this game. */
  rows: number;
  /** Waves so far in the chain being resolved. */
  chain: number;
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

/** The rows filled from side to side (sand counts). */
export const fullRows = (board: Board): number[] =>
  board.flatMap((row, r) => (row.every((cell) => cell !== null) ? [r] : []));

export const sandLeft = (board: Board): number => board.reduce((n, row) => n + row.filter((c) => c === 'sand').length, 0);
export const blocksLeft = (board: Board): number => board.reduce((n, row) => n + row.filter((c) => c !== null).length, 0);

/** Points for one wave of `n` rows, `chain` waves into a chain. */
export function wavePoints(n: number, chain: number): number {
  const base = n <= 4 ? ROW_POINTS[n] : ROW_POINTS[4] + (n - 4) * ROW_POINTS_EXTRA;
  return base * Math.min(MAX_DOUBLING, 2 ** (chain - 1));
}

/** The next wave on this board, if a row is full: those rows wash away and everything sinks. */
function nextWave(board: Board, chain: number): { wave: Wave; board: Board } | null {
  const rows = fullRows(board);
  if (!rows.length) return null;
  const washed = copy(board);
  for (const r of rows) washed[r] = Array<Cell>(COLS).fill(null);
  const sand = rows.reduce((n, r) => n + board[r].filter((c) => c === 'sand').length, 0);
  return { wave: { rows, chain, points: wavePoints(rows.length, chain), sand, washed }, board: sink(washed) };
}

// --- Levels: the sand ---

/** How many rows high the sand starts on a level. */
export const sandRows = (stage: number): number =>
  Math.min(MAX_SAND_ROWS, FIRST_SAND_ROWS + Math.floor((stage - 1) / LEVELS_PER_ROW));

/**
 * The starting sand for a level: uneven columns, the tallest `sandRows(stage)` high, with a few holes hidden inside
 * (they fill once a wave lets the sand sink), and never a full row.
 */
export function sandStack(seed: number, stage: number): Board {
  const random = seededRandom((seed ^ 0x2545f491) >>> 0);
  const top = sandRows(stage);
  const board = emptyBoard();
  const heights = Array.from({ length: COLS }, () => 1 + Math.floor(random() * top));
  heights[Math.floor(random() * COLS)] = top;
  heights.forEach((h, c) => {
    for (let k = 0; k < h; k++) {
      // A hole now and then, never in a column's top block (it would just be a lower column)
      if (k < h - 1 && k > 0 && random() < 0.15) continue;
      board[ROWS - 1 - k][c] = 'sand';
    }
  });
  // No row may start full: open a gap in any that is
  for (const r of fullRows(board)) board[r][Math.floor(random() * COLS)] = null;
  return board;
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

/** Continuous: one level per ROWS_PER_LEVEL rows. Levels: the level being played. */
export const level = (tank: Tank): number => tank.stage ?? 1 + Math.floor(tank.rows / ROWS_PER_LEVEL);

export const preview = (tank: Tank): Preview => pieceAt(tank.seed, tank.dealt);

/** Brings out the next piece, or ends the game if it has no room to come out. */
function spawn(tank: Tank): Tank {
  const piece: Piece = { ...pieceAt(tank.seed, tank.dealt), row: SPAWN_ROW, col: SPAWN_COL, turn: 0 };
  if (!fits(tank.board, piece)) return { ...tank, piece: null, phase: 'over' };
  return { ...tank, piece, phase: 'falling', dealt: tank.dealt + 1 };
}

/** A new tank: Continuous, or with `stage`, that level of Levels on its starting sand. */
export function newTank(opts: { seed: number; stage?: number }): Tank {
  const seed = opts.seed >>> 0;
  const stage = opts.stage ?? null;
  return spawn({
    board: stage === null ? emptyBoard() : sandStack(seed, stage),
    piece: null,
    phase: 'falling',
    seed,
    dealt: 0,
    stage,
    score: 0,
    rows: 0,
    chain: 0,
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
  return { ...tank, board, piece: null, phase: 'resolving', chain: 0, last: { kind: 'lock' } };
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
 * The next step after a piece lands, one per call so the screen can show it: a wave washes full rows away (and the
 * sand sinks), or, once no row is full, the level is won (Levels, an empty tank) or the next piece comes out.
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
      score: tank.score + wave.points,
      rows: tank.rows + wave.rows.length,
      last: { kind: 'wave', wave },
    };
  }
  const settled = { ...tank, chain: 0 };
  if (tank.stage !== null && blocksLeft(tank.board) === 0) {
    return { ...settled, piece: null, phase: 'cleared', last: { kind: 'cleared' } };
  }
  return { ...spawn(settled), last: { kind: 'settled' } };
}

// --- speed ---

/** Milliseconds per row in Continuous: 800 at level 1, a little quicker each level, never under 150. */
export { soloFallMs } from '../falling/speed';

/** Milliseconds per row in Levels: Continuous's 800 to start, a little gentler a step (the sand grows too), never under 150. */
export const levelsFallMs = (stage: number): number => Math.max(150, Math.round(800 * 0.92 ** (stage - 1)));
