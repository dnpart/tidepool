// Bubble Pals rules as pure functions (PLAN.md "Game 8: Bubble Pals"): our own falling-pairs game in the family of
// Mean Bean Machine. Nothing here mutates its input, and nothing here knows about time: the screen calls `fall` on its
// own timer and `resolve` once per chain link, so each step can be shown. One `Tank` is one player's side; Versus is two
// tanks passing clams with `exchange`, so either side could later be a person on another phone.
import { seededRandom } from '../../util/random';

export const COLS = 6;
/** Row 0 is a hidden row above the tank (pieces start there); rows 1 to 12 are the tank you see. */
export const ROWS = 13;
export const SPAWN_COL = 2;
/** Four or more of the same friend touching pop. */
export const POP_SIZE = 4;
/** Friends popped between pearls. */
export const PEARL_EVERY = 25;
/** Most clams that drop into a tank at once (five rows). */
export const MAX_CLAMS_AT_ONCE = 30;
/** Clams a chain sends by its length (index = links), before bonuses. A single pop sends none. */
export const CHAIN_CLAMS = [0, 0, 3, 6, 12, 18, 24] as const;
/** Most clams one chain can send. */
export const MAX_SENT = 30;

/** The friends, in the order they join: four to start, the jellyfish later in Solo. */
export const KINDS = ['octo', 'manta', 'star', 'turtle', 'jelly'] as const;
export type Pal = (typeof KINDS)[number];
export type Cell = Pal | 'clam' | 'pearl' | null;
/** `board[row][col]`, row 0 at the top. */
export type Board = Cell[][];
/** Where the second friend of a pair sits around the first: 0 above, 1 right, 2 below, 3 left. */
export type Turn = 0 | 1 | 2 | 3;

export type Piece =
  | { type: 'pair'; pivot: Pal; other: Pal; row: number; col: number; turn: Turn }
  | { type: 'pearl'; row: number; col: number };

/** What the next piece will be, for the preview. */
export type Preview = { type: 'pair'; pivot: Pal; other: Pal } | { type: 'pearl' };

/** One link of a chain: the cells that popped (friends, clams, a pearl), and what it was worth. */
export interface Link {
  cells: [number, number][];
  /** Friends popped (not clams or the pearl). */
  pals: number;
  /** Size of each group that popped; a pearl's pop counts as one group. */
  groups: number[];
  /** 1 for the first pop after a piece lands, 2 for the next, and so on. */
  chain: number;
  points: number;
  pearl: boolean;
}

export type TankEvent =
  | { kind: 'lock'; wastedPearl?: boolean }
  | { kind: 'pop'; link: Link }
  /** The chain (if any) is over: clams sent and cancelled, clams that dropped in, and the next piece is out. */
  | { kind: 'settled'; sent: number; cancelled: number; clams: [number, number][] }
  | null;

export interface Tank {
  board: Board;
  piece: Piece | null;
  /** 'falling': a piece is coming down. 'resolving': it landed; call `resolve` until it's 'falling' again. */
  phase: 'falling' | 'resolving' | 'over';
  /** The pair sequence: two tanks with the same seed get the same pairs, which keeps Versus fair. */
  seed: number;
  /** Pairs dealt so far (pearls don't count). */
  dealt: number;
  /** Kinds of friend in play to start (4), and the level at which the jellyfish joins (null: never). */
  kinds: number;
  fifthAt: number | null;
  score: number;
  /** Friends popped this game. */
  popped: number;
  /** Friends still to pop before the next pearl. */
  toPearl: number;
  /** Links so far in the chain being resolved, and the bonus clams it has earned (big groups, several groups). */
  chain: number;
  bonus: number;
  /** Clams waiting to drop into this tank. */
  incoming: number;
  /** Clams this tank has sent and the other tank hasn't taken yet (`exchange`). */
  outgoing: number;
  last: TankEvent;
}

// --- the board ---

export const emptyBoard = (): Board => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
const copy = (board: Board): Board => board.map((row) => [...row]);
export const isPal = (cell: Cell): cell is Pal => cell !== null && cell !== 'clam' && cell !== 'pearl';

/** Everything drops straight down its column as far as it can, keeping its order. */
export function gravity(board: Board): Board {
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

const NEIGHBORS = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;
const inside = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

/** Every group of POP_SIZE or more touching friends of one kind (side by side or stacked, not diagonal). */
export function findGroups(board: Board): [number, number][][] {
  const seen = board.map((row) => row.map(() => false));
  const groups: [number, number][][] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const kind = board[r][c];
      if (!isPal(kind) || seen[r][c]) continue;
      const group: [number, number][] = [];
      const todo: [number, number][] = [[r, c]];
      seen[r][c] = true;
      while (todo.length) {
        const [y, x] = todo.pop()!;
        group.push([y, x]);
        for (const [dy, dx] of NEIGHBORS) {
          const ny = y + dy, nx = x + dx;
          if (inside(ny, nx) && !seen[ny][nx] && board[ny][nx] === kind) {
            seen[ny][nx] = true;
            todo.push([ny, nx]);
          }
        }
      }
      if (group.length >= POP_SIZE) groups.push(group);
    }
  }
  return groups;
}

/** The pops waiting on this board, as one link (null if nothing pops): a landed pearl first, otherwise every group. */
function nextLink(board: Board, chain: number): { link: Link; board: Board } | null {
  const popped: [number, number][] = [];
  let groups: number[] = [];
  let pearl = false;
  let pearlRow = -1, pearlCol = -1;
  board.forEach((row, r) => row.forEach((cell, c) => { if (cell === 'pearl') { pearlRow = r; pearlCol = c; } }));
  if (pearlRow >= 0) {
    pearl = true;
    const below = pearlRow + 1 < ROWS ? board[pearlRow + 1][pearlCol] : null;
    popped.push([pearlRow, pearlCol]);
    let n = 0;
    if (isPal(below)) {
      board.forEach((row, r) => row.forEach((cell, c) => { if (cell === below) { popped.push([r, c]); n++; } }));
    }
    groups = [n];
  } else {
    const found = findGroups(board);
    if (!found.length) return null;
    for (const g of found) popped.push(...g);
    groups = found.map((g) => g.length);
  }
  // Clams beside any popped friend wake up and leave too
  const gone = new Set(popped.map(([r, c]) => r * COLS + c));
  const clams: [number, number][] = [];
  for (const [r, c] of popped) {
    if (!isPal(board[r][c])) continue;
    for (const [dy, dx] of NEIGHBORS) {
      const ny = r + dy, nx = c + dx;
      if (inside(ny, nx) && board[ny][nx] === 'clam' && !gone.has(ny * COLS + nx)) {
        gone.add(ny * COLS + nx);
        clams.push([ny, nx]);
      }
    }
  }
  const cells = [...popped, ...clams];
  const next = copy(board);
  for (const [r, c] of cells) next[r][c] = null;
  const pals = groups.reduce((a, b) => a + b, 0);
  const points = pals * 10 * 2 ** (Math.min(chain, 6) - 1);
  return { link: { cells, pals, groups, chain, points, pearl }, board: gravity(next) };
}

// --- pieces ---

const OFFSETS: Record<Turn, [number, number]> = { 0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1] };

/** The cells a piece covers, with what's in each. */
export function pieceCells(piece: Piece): { row: number; col: number; cell: Pal | 'pearl' }[] {
  if (piece.type === 'pearl') return [{ row: piece.row, col: piece.col, cell: 'pearl' }];
  const [dy, dx] = OFFSETS[piece.turn];
  return [
    { row: piece.row, col: piece.col, cell: piece.pivot },
    { row: piece.row + dy, col: piece.col + dx, cell: piece.other },
  ];
}

export const fits = (board: Board, piece: Piece): boolean =>
  pieceCells(piece).every(({ row, col }) => inside(row, col) && board[row][col] === null);

/** The pair dealt at `index` for this seed. */
export function pairAt(seed: number, index: number, kinds: number): { pivot: Pal; other: Pal } {
  const random = seededRandom((seed + Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  return { pivot: KINDS[Math.floor(random() * kinds)], other: KINDS[Math.floor(random() * kinds)] };
}

export const level = (tank: Tank): number => 1 + Math.floor(tank.popped / 30);
const kindsNow = (tank: Tank): number => (tank.fifthAt !== null && level(tank) >= tank.fifthAt ? 5 : tank.kinds);

export function preview(tank: Tank): Preview {
  if (tank.toPearl <= 0) return { type: 'pearl' };
  return { type: 'pair', ...pairAt(tank.seed, tank.dealt, kindsNow(tank)) };
}

/** Clears the hidden row and brings out the next piece, or ends the game if the spot it starts on is filled. */
function spawn(tank: Tank): Tank {
  const board = copy(tank.board);
  board[0] = Array<Cell>(COLS).fill(null);
  if (board[1][SPAWN_COL] !== null) return { ...tank, board, piece: null, phase: 'over' };
  if (tank.toPearl <= 0) {
    return { ...tank, board, piece: { type: 'pearl', row: 1, col: SPAWN_COL }, phase: 'falling', toPearl: PEARL_EVERY };
  }
  const pair = pairAt(tank.seed, tank.dealt, kindsNow(tank));
  return {
    ...tank,
    board,
    piece: { type: 'pair', ...pair, row: 1, col: SPAWN_COL, turn: 0 },
    phase: 'falling',
    dealt: tank.dealt + 1,
  };
}

export function newTank(opts: { seed: number; kinds?: number; fifthAt?: number | null }): Tank {
  return spawn({
    board: emptyBoard(),
    piece: null,
    phase: 'falling',
    seed: opts.seed >>> 0,
    dealt: 0,
    kinds: opts.kinds ?? 4,
    fifthAt: opts.fifthAt ?? null,
    score: 0,
    popped: 0,
    toPearl: PEARL_EVERY,
    chain: 0,
    bonus: 0,
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

/**
 * Turns a pair a quarter clockwise (1) or counterclockwise (-1). Against a wall or a stack it steps away to make room;
 * in a one-wide gap it flips over instead. Returns the same tank if nothing works (or for a pearl).
 */
export function turn(tank: Tank, dir: 1 | -1 = 1): Tank {
  const piece = tank.piece;
  if (tank.phase !== 'falling' || !piece || piece.type !== 'pair') return tank;
  const tryTurn = (t: Turn) => {
    const turned = { ...piece, turn: t };
    const [dy, dx] = OFFSETS[t];
    // Step away from whatever is in the way: left of a wall on the right, up from the floor
    const kicked = { ...turned, row: turned.row - dy, col: turned.col - dx };
    return [turned, kicked].find((p) => fits(tank.board, p)) ?? null;
  };
  const next = tryTurn(((piece.turn + dir + 4) % 4) as Turn) ?? tryTurn(((piece.turn + 2) % 4) as Turn);
  return next ? { ...tank, piece: next, last: null } : tank;
}

/** Puts the piece into the board where it is; the two halves of a pair then drop on their own. */
function lock(tank: Tank): Tank {
  const piece = tank.piece!;
  const board = copy(tank.board);
  let wastedPearl = false;
  if (piece.type === 'pearl') {
    const below = piece.row + 1 < ROWS ? board[piece.row + 1][piece.col] : null;
    // A pearl that lands on the floor or a clam has nothing to pop and just melts away
    if (isPal(below)) board[piece.row][piece.col] = 'pearl';
    else wastedPearl = true;
  } else {
    for (const { row, col, cell } of pieceCells(piece)) board[row][col] = cell;
  }
  return {
    ...tank,
    board: gravity(board),
    piece: null,
    phase: 'resolving',
    chain: 0,
    bonus: 0,
    last: wastedPearl ? { kind: 'lock', wastedPearl } : { kind: 'lock' },
  };
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

/** Clams a finished chain sends: by its length, plus one for each friend past four in a group and two for each extra group in a link. */
export const clamsFor = (chain: number, bonus: number): number =>
  chain === 0 ? 0 : Math.min(MAX_SENT, CHAIN_CLAMS[Math.min(chain, CHAIN_CLAMS.length - 1)] + bonus);

/** Drops up to MAX_CLAMS_AT_ONCE waiting clams: whole rows first, the rest in different random columns. */
function dropClams(tank: Tank): { board: Board; cells: [number, number][]; dropped: number } {
  const n = Math.min(tank.incoming, MAX_CLAMS_AT_ONCE);
  const board = copy(tank.board);
  const cells: [number, number][] = [];
  if (n === 0) return { board, cells, dropped: 0 };
  const random = seededRandom((tank.seed ^ 0x5bd1e995) + Math.imul(tank.dealt, 7919) + tank.popped);
  const perCol = Array<number>(COLS).fill(Math.floor(n / COLS));
  const cols = [...Array(COLS).keys()];
  for (let i = cols.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cols[i], cols[j]] = [cols[j], cols[i]];
  }
  cols.slice(0, n % COLS).forEach((c) => perCol[c]++);
  perCol.forEach((count, c) => {
    for (let k = 0; k < count; k++) {
      let r = ROWS - 1;
      while (r >= 0 && board[r][c] !== null) r--;
      if (r < 0) break; // a full column loses the rest
      board[r][c] = 'clam';
      cells.push([r, c]);
    }
  });
  return { board, cells, dropped: n };
}

/**
 * The next step after a piece lands, one per call so the screen can show it: a link of the chain pops (and everything
 * drops), or, once nothing more pops, the chain's clams go out (first cancelling clams waiting here), any clams still
 * waiting drop in, and the next piece comes out.
 */
export function resolve(tank: Tank): Tank {
  if (tank.phase !== 'resolving') return tank;
  const chain = tank.chain + 1;
  const found = nextLink(tank.board, chain);
  if (found) {
    const { link } = found;
    // A pearl's own pop sends nothing extra (it's a gift, not a combo), though any chain it sets off counts
    const bonus = link.pearl ? 0 : link.groups.reduce((n, g) => n + Math.max(0, g - POP_SIZE), 0) + 2 * (link.groups.length - 1);
    return {
      ...tank,
      board: found.board,
      chain,
      bonus: tank.bonus + bonus,
      score: tank.score + link.points,
      popped: tank.popped + link.pals,
      toPearl: tank.toPearl - link.pals,
      last: { kind: 'pop', link },
    };
  }
  const attack = clamsFor(tank.chain, tank.bonus);
  const cancelled = Math.min(attack, tank.incoming);
  const settled = { ...tank, incoming: tank.incoming - cancelled, outgoing: tank.outgoing + attack - cancelled, chain: 0, bonus: 0 };
  const { board, cells, dropped } = dropClams(settled);
  const next = spawn({ ...settled, board, incoming: settled.incoming - dropped });
  return { ...next, last: { kind: 'settled', sent: attack - cancelled, cancelled, clams: cells } };
}

/** Versus: each tank's sent clams join the other's waiting clams. */
export function exchange(a: Tank, b: Tank): [Tank, Tank] {
  if (!a.outgoing && !b.outgoing) return [a, b];
  return [
    { ...a, outgoing: 0, incoming: a.incoming + b.outgoing },
    { ...b, outgoing: 0, incoming: b.incoming + a.outgoing },
  ];
}

/**
 * What a piece would do if dropped where it is now, without changing anything: the board once every link has popped,
 * and the links. Used by the opponent to weigh its choices.
 */
export function simulate(board: Board, piece: Piece): { board: Board; links: Link[] } | null {
  if (!fits(board, piece)) return null;
  let t: Tank = { ...newTank({ seed: 0 }), board, piece, phase: 'falling' };
  t = drop(t);
  const links: Link[] = [];
  let b = t.board;
  for (let chain = 1; ; chain++) {
    const found = nextLink(b, chain);
    if (!found) break;
    links.push(found.link);
    b = found.board;
  }
  return { board: b, links };
}

// --- speed ---

export type Pace = 'gentle' | 'steady' | 'quick';
export const PACES: readonly Pace[] = ['gentle', 'steady', 'quick'];

/** Milliseconds per row in Solo: 800 at level 1, a little quicker each level, never under 150. */
export const soloFallMs = (lvl: number): number => Math.max(150, Math.round(800 * 0.9 ** (lvl - 1)));

const VERSUS_START: Record<Pace, number> = { gentle: 900, steady: 650, quick: 420 };
/** Milliseconds per row in Versus: set by the pace, and a little quicker every 45 seconds so a game always ends. */
export const versusFallMs = (pace: Pace, seconds: number): number =>
  Math.max(140, Math.round(VERSUS_START[pace] * 0.9 ** Math.floor(seconds / 45)));
