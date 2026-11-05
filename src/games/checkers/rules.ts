// Checkers rules as pure functions (PLAN.md "Games 8 and 9: Checkers and Chess"). American checkers on an 8 × 8 board.
// Nothing here mutates its input, and the rules never ask who is a computer: seat 0 is you at the bottom, seat 1 the
// other side at the top, which can be the deck's character, a friend passing the phone, or later a friend's phone.
//
// - Pieces stand on the dark squares (where row + column is odd). Each side starts with 12 men on its first three rows.
// - A man steps one square diagonally forward; a king steps one square diagonally either way.
// - A jump hops over a neighboring piece of the other side onto the empty square beyond, and takes it. Men jump forward
//   only, kings either way. After a jump, the same piece keeps jumping while it can: a move is the whole run of jumps.
//   A piece can't be jumped twice in one move, and the pieces it took leave the board when the move ends.
// - A man reaching the far row is crowned, and that ends the move, even in the middle of a run of jumps.
// - Jumps are required by default (`mustJump`): when any jump is open, only jumps are. With the menu's switch off, a step
//   is allowed instead; a run of jumps, once started, still goes on while it can.
// - The side to move with no move (no pieces, or all blocked) loses. Forty moves each with no capture and no man moving
//   is a draw.

export type Seat = 0 | 1;

export interface Piece {
  seat: Seat;
  king: boolean;
}

/** 64 squares, row by row from the top-left; index = row * 8 + col. Light squares are always empty. */
export type Board = (Piece | null)[];

/** One whole move: the square it starts from, every square it lands on in order, and the squares it took. */
export interface Move {
  from: number;
  path: number[];
  captures: number[];
}

export interface CheckersResult {
  /** The seat that won, or null for a draw. */
  winner: Seat | null;
  reason: 'stuck' | 'quiet';
}

export interface CheckersState {
  board: Board;
  turn: Seat;
  /** When any jump is open, only jumps may be played. */
  mustJump: boolean;
  /** Moves in a row (both sides counted) with no capture and no man moving, for the draw rule. */
  quiet: number;
  /** Moves played this game. */
  moves: number;
  /** Who moved first, so the next game can start with the other side. */
  starter: Seat;
  last: (Move & { crowned: boolean }) | null;
  phase: 'play' | 'done';
  result: CheckersResult | null;
  /** Games won by seat 0 and seat 1, and draws. */
  tally: [number, number, number];
}

/** Forty moves each without a capture or a man moving is a draw. */
export const QUIET_LIMIT = 80;
export const EMPTY_TALLY: [number, number, number] = [0, 0, 0];

export const rowOf = (sq: number) => Math.floor(sq / 8);
export const colOf = (sq: number) => sq % 8;
export const isDark = (sq: number) => (rowOf(sq) + colOf(sq)) % 2 === 1;
const at = (row: number, col: number) => (row >= 0 && row < 8 && col >= 0 && col < 8 ? row * 8 + col : -1);

/** The row where each seat's men are crowned. */
export const crownRow = (seat: Seat) => (seat === 0 ? 0 : 7);
/** Which way each seat's men go: up the board for you, down for the other side. */
const forward = (seat: Seat) => (seat === 0 ? -1 : 1);

// --- a game ---

export function startBoard(): Board {
  const board: Board = Array(64).fill(null);
  for (let sq = 0; sq < 64; sq++) {
    if (!isDark(sq)) continue;
    if (rowOf(sq) <= 2) board[sq] = { seat: 1, king: false };
    if (rowOf(sq) >= 5) board[sq] = { seat: 0, king: false };
  }
  return board;
}

export function newGame(opts: { mustJump?: boolean; starter?: Seat; tally?: [number, number, number] } = {}): CheckersState {
  const starter = opts.starter ?? 0;
  return {
    board: startBoard(),
    turn: starter,
    mustJump: opts.mustJump ?? true,
    quiet: 0,
    moves: 0,
    starter,
    last: null,
    phase: 'play',
    result: null,
    tally: [...(opts.tally ?? EMPTY_TALLY)] as [number, number, number],
  };
}

/** The next game: the other side starts, the tally and the jump rule carry on. */
export const nextGame = (prev: CheckersState, mustJump = prev.mustJump): CheckersState =>
  newGame({ mustJump, starter: prev.starter === 0 ? 1 : 0, tally: prev.tally });

// --- moves ---

/** The diagonal directions a piece may go, as [row step, col step]. */
function directions(piece: Piece): [number, number][] {
  const f = forward(piece.seat);
  return piece.king ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : [[f, -1], [f, 1]];
}

/** Every run of jumps a piece on `from` can make, each taken as far as it goes. */
function jumpsFrom(board: Board, from: number): Move[] {
  const piece = board[from];
  if (!piece) return [];
  const out: Move[] = [];
  const walk = (sq: number, path: number[], captures: number[]) => {
    let extended = false;
    // A man that reaches the far row is crowned and stops
    const crownedNow = !piece.king && path.length > 0 && rowOf(sq) === crownRow(piece.seat);
    if (!crownedNow) {
      for (const [dr, dc] of directions(piece)) {
        const over = at(rowOf(sq) + dr, colOf(sq) + dc);
        const land = at(rowOf(sq) + 2 * dr, colOf(sq) + 2 * dc);
        if (over < 0 || land < 0) continue;
        const victim = board[over];
        if (!victim || victim.seat === piece.seat || captures.includes(over)) continue;
        // The piece itself has left its starting square, so it may land back there
        if (board[land] && land !== from) continue;
        extended = true;
        walk(land, [...path, land], [...captures, over]);
      }
    }
    if (!extended && path.length > 0) out.push({ from, path, captures });
  };
  walk(from, [], []);
  return out;
}

function stepsFrom(board: Board, from: number): Move[] {
  const piece = board[from];
  if (!piece) return [];
  const out: Move[] = [];
  for (const [dr, dc] of directions(piece)) {
    const to = at(rowOf(from) + dr, colOf(from) + dc);
    if (to >= 0 && !board[to]) out.push({ from, path: [to], captures: [] });
  }
  return out;
}

/** Every move open to `seat` on `board` under the jump rule. */
export function movesFor(board: Board, seat: Seat, mustJump: boolean): Move[] {
  const jumps: Move[] = [];
  const steps: Move[] = [];
  for (let sq = 0; sq < 64; sq++) {
    if (board[sq]?.seat !== seat) continue;
    jumps.push(...jumpsFrom(board, sq));
    steps.push(...stepsFrom(board, sq));
  }
  return mustJump && jumps.length ? jumps : [...jumps, ...steps];
}

/** Every move open to the side whose turn it is. */
export const legalMoves = (state: CheckersState): Move[] =>
  state.phase === 'play' ? movesFor(state.board, state.turn, state.mustJump) : [];

const sameMove = (a: Move, b: Move) => a.from === b.from && a.path.length === b.path.length && a.path.every((sq, i) => sq === b.path[i]);

/** The board after a move, with the man crowned if it ended on the far row. */
export function applyMove(board: Board, move: Move): { board: Board; crowned: boolean } {
  const next = board.slice();
  const piece = next[move.from]!;
  next[move.from] = null;
  for (const sq of move.captures) next[sq] = null;
  const to = move.path[move.path.length - 1];
  const crowned = !piece.king && rowOf(to) === crownRow(piece.seat);
  next[to] = crowned ? { ...piece, king: true } : piece;
  return { board: next, crowned };
}

/** Plays a move for the side whose turn it is. Null if it isn't one of the legal moves. */
export function play(state: CheckersState, move: Move): CheckersState | null {
  const legal = legalMoves(state).find((m) => sameMove(m, move));
  if (!legal) return null;
  const manMoved = !state.board[legal.from]!.king;
  const { board, crowned } = applyMove(state.board, legal);
  const quiet = legal.captures.length || manMoved ? 0 : state.quiet + 1;
  const turn: Seat = state.turn === 0 ? 1 : 0;
  const next: CheckersState = { ...state, board, turn, quiet, moves: state.moves + 1, last: { ...legal, crowned } };
  if (movesFor(board, turn, state.mustJump).length === 0) return finish(next, state.turn, 'stuck');
  if (quiet >= QUIET_LIMIT) return finish(next, null, 'quiet');
  return next;
}

function finish(state: CheckersState, winner: Seat | null, reason: CheckersResult['reason']): CheckersState {
  const tally = [...state.tally] as [number, number, number];
  tally[winner === null ? 2 : winner]++;
  return { ...state, phase: 'done', result: { winner, reason }, tally };
}

/** The side whose turn it is gives up; the other side wins. */
export function resign(state: CheckersState): CheckersState {
  if (state.phase !== 'play') return state;
  return finish(state, state.turn === 0 ? 1 : 0, 'stuck');
}

export const resetTally = (state: CheckersState): CheckersState => ({ ...state, tally: [...EMPTY_TALLY] as [number, number, number] });

// --- for the screen: building a move one tap at a time ---

/** The moves that start on `from` and go through `steps` so far. */
export function movesThrough(state: CheckersState, from: number, steps: number[]): Move[] {
  return legalMoves(state).filter((m) => m.from === from && steps.every((sq, i) => m.path[i] === sq));
}

/** The squares a piece on `from` can land on next, after the landings in `steps`. */
export function nextLandings(state: CheckersState, from: number, steps: number[]): number[] {
  return [...new Set(movesThrough(state, from, steps).filter((m) => m.path.length > steps.length).map((m) => m.path[steps.length]))];
}

/** The squares whose pieces can move now (with jumps required, only the ones that can jump). */
export const movablePieces = (state: CheckersState): number[] => [...new Set(legalMoves(state).map((m) => m.from))];

/** Pieces left per seat. */
export const piecesLeft = (board: Board): [number, number] => [
  board.filter((p) => p?.seat === 0).length,
  board.filter((p) => p?.seat === 1).length,
];
