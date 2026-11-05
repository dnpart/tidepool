// The computer's checkers: a look-ahead search (alpha-beta) over the rules' own moves, at three strengths.
//   easy   looks 2 moves ahead and often settles for a good-enough move rather than the best
//   medium looks 4 moves ahead and now and then takes the second best
//   hard   looks 8 moves ahead (fewer when the board is busy), always the best it finds
import { applyMove, crownRow, movesFor, rowOf, colOf, type Board, type Move, type Seat, type CheckersState } from './rules';

export type Level = 'easy' | 'medium' | 'hard';
export const LEVELS: readonly Level[] = ['easy', 'medium', 'hard'];

const MAN = 100;
const KING = 165;
const WIN = 100000;

/** How good the board is for `seat`: material first, then men moving up, the middle, and the back row kept. */
export function evaluate(board: Board, seat: Seat): number {
  let score = 0;
  let mine = 0;
  let theirs = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (!p) continue;
    const sign = p.seat === seat ? 1 : -1;
    if (sign > 0) mine++;
    else theirs++;
    let v = p.king ? KING : MAN;
    const row = rowOf(sq);
    const col = colOf(sq);
    if (!p.king) {
      // Rows gone up the board, a little for each
      const gone = p.seat === 0 ? 7 - row : row;
      v += gone * 3;
      // Men left on the back row guard it against kings
      if (row === crownRow(p.seat === 0 ? 1 : 0)) v += 6;
    }
    // The middle four columns
    if (col >= 2 && col <= 5 && row >= 2 && row <= 5) v += 4;
    score += sign * v;
  }
  // Ahead in pieces: trading down is good for the side ahead
  if (mine && theirs) score += ((mine - theirs) * 40) / (mine + theirs);
  return score;
}

/** Captures first, longer runs first: the search cuts off sooner. */
const ordered = (moves: Move[]) => moves.slice().sort((a, b) => b.captures.length - a.captures.length);

function search(board: Board, toMove: Seat, me: Seat, depth: number, alpha: number, beta: number, mustJump: boolean, ply: number): number {
  const moves = movesFor(board, toMove, mustJump);
  if (moves.length === 0) return toMove === me ? -WIN + ply : WIN - ply;
  // Keep looking while captures are on the board, so the search doesn't stop in the middle of a trade
  if (depth <= 0 && (moves[0].captures.length === 0 || depth < -4)) return evaluate(board, me);
  const other: Seat = toMove === 0 ? 1 : 0;
  if (toMove === me) {
    let best = -Infinity;
    for (const m of ordered(moves)) {
      best = Math.max(best, search(applyMove(board, m).board, other, me, depth - 1, alpha, beta, mustJump, ply + 1));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of ordered(moves)) {
    best = Math.min(best, search(applyMove(board, m).board, other, me, depth - 1, alpha, beta, mustJump, ply + 1));
    beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return best;
}

const DEPTH: Record<Level, number> = { easy: 2, medium: 4, hard: 8 };

/** Every move with its score for the side whose turn it is, best first. */
export function rankMoves(state: CheckersState, level: Level): { move: Move; score: number }[] {
  const me = state.turn;
  const other: Seat = me === 0 ? 1 : 0;
  const moves = movesFor(state.board, me, state.mustJump);
  // Hard looks less far when there are many moves to weigh, so it stays quick on a phone
  const depth = level === 'hard' && moves.length > 9 ? 6 : DEPTH[level];
  return ordered(moves)
    .map((move) => ({ move, score: search(applyMove(state.board, move).board, other, me, depth - 1, -Infinity, Infinity, state.mustJump, 1) }))
    .sort((a, b) => b.score - a.score);
}

/** The move the computer plays for the side whose turn it is. `random` decides the easier levels' slips. */
export function chooseMove(state: CheckersState, level: Level, random: () => number = Math.random): Move | null {
  const ranked = rankMoves(state, level);
  if (ranked.length === 0) return null;
  if (ranked.length === 1 || level === 'hard') return ranked[0].move;
  const best = ranked[0].score;
  if (level === 'medium') {
    // A quarter of the time, the second best if it's nearly as good
    return random() < 0.25 && ranked[1].score > best - 30 ? ranked[1].move : ranked[0].move;
  }
  // Easy: any move within a man's worth of the best, picked at random, and a real blunder now and then
  const fine = ranked.filter((r) => r.score > best - MAN);
  if (random() < 0.12) return ranked[Math.floor(random() * ranked.length)].move;
  return fine[Math.floor(random() * fine.length)].move;
}
