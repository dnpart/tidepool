// Saves the game in progress, the tally and the settings to localStorage (key tidepool.checkers).
import type { Level } from './ai';
import { EMPTY_TALLY, isDark, type Board, type CheckersState, type Move, type Seat } from './rules';

export const STORAGE_KEY = 'tidepool.checkers';

/** Who plays the other side: the deck's character, or a friend passing the phone. */
export type Opponent = 'computer' | 'friend';

export interface SavedCheckers {
  game: CheckersState;
  level: Level;
  opponent: Opponent;
  showTally: boolean;
}

const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0);
const isSeat = (n: unknown): n is Seat => n === 0 || n === 1;
const isSquare = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) < 64;

/** The board as 64 letters: '.' empty, 'm' / 'k' your man / king, 'M' / 'K' the other side's. */
const encodeBoard = (board: Board) => board.map((p) => (!p ? '.' : p.seat === 0 ? (p.king ? 'k' : 'm') : p.king ? 'K' : 'M')).join('');

function decodeBoard(s: unknown): Board {
  if (typeof s !== 'string' || s.length !== 64) throw new Error('bad board');
  return [...s].map((c, sq) => {
    if (c === '.') return null;
    if (!isDark(sq)) throw new Error('piece on a light square');
    if (c === 'm' || c === 'k') return { seat: 0, king: c === 'k' };
    if (c === 'M' || c === 'K') return { seat: 1, king: c === 'K' };
    throw new Error('bad square');
  });
}

function decodeMove(m: unknown): (Move & { crowned: boolean }) | null {
  if (!m || typeof m !== 'object') return null;
  const o = m as Record<string, unknown>;
  if (!isSquare(o.f) || !Array.isArray(o.p) || !o.p.every(isSquare) || !Array.isArray(o.c) || !o.c.every(isSquare)) return null;
  return { from: o.f as number, path: o.p as number[], captures: o.c as number[], crowned: o.k === true };
}

export function serialize(saved: SavedCheckers): string {
  const g = saved.game;
  return JSON.stringify({
    v: 1,
    b: encodeBoard(g.board),
    t: g.turn,
    j: g.mustJump,
    q: g.quiet,
    n: g.moves,
    s: g.starter,
    la: g.last && { f: g.last.from, p: g.last.path, c: g.last.captures, k: g.last.crowned },
    r: g.result,
    ta: g.tally,
    l: saved.level,
    o: saved.opponent,
    st: saved.showTally,
  });
}

/** Restores a saved game, or null if there is none or it is damaged. */
export function deserialize(raw: string | null): SavedCheckers | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (d?.v !== 1 || !isSeat(d.t) || !isSeat(d.s)) return null;
    const board = decodeBoard(d.b);
    const r = d.r;
    const result = r && (r.winner === null || isSeat(r.winner)) && (r.reason === 'stuck' || r.reason === 'quiet')
      ? { winner: r.winner as Seat | null, reason: r.reason as 'stuck' | 'quiet' }
      : null;
    const game: CheckersState = {
      board,
      turn: d.t,
      mustJump: d.j !== false,
      quiet: count(d.q),
      moves: count(d.n),
      starter: d.s,
      last: decodeMove(d.la),
      phase: result ? 'done' : 'play',
      result,
      tally: EMPTY_TALLY.map((_, i) => count(Array.isArray(d.ta) ? d.ta[i] : 0)) as [number, number, number],
    };
    const level = d.l === 'easy' || d.l === 'hard' ? d.l : 'medium';
    return { game, level, opponent: d.o === 'friend' ? 'friend' : 'computer', showTally: d.st === true };
  } catch {
    return null;
  }
}

export function loadSaved(): SavedCheckers | null {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function save(saved: SavedCheckers): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(saved));
  } catch {
    // not saved; the game still works
  }
}
