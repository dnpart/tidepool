// Saves the game in progress and the tally to localStorage (key tidepool.pondhop).
import {
  CORNER,
  EMPTY_TALLY,
  holeOf,
  isHome,
  LANE_LAST,
  MARBLES,
  type Capture,
  type LastTurn,
  type Move,
  type Opponents,
  type PondHopState,
} from './rules';

export const STORAGE_KEY = 'tidepool.pondhop';

export interface SavedPondHop {
  game: PondHopState;
  /** Opponents for the next game. */
  opponents: Opponents;
  showTally: boolean;
}

const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0);
const isProgress = (n: unknown) => Number.isInteger(n) && (n as number) >= CORNER && (n as number) <= LANE_LAST;

export function serialize(saved: SavedPondHop): string {
  const g = saved.game;
  return JSON.stringify({
    v: 1,
    m: g.marbles,
    t: g.turn,
    r: g.rolled,
    la: g.last,
    w: g.winner,
    ta: g.tally,
    o: saved.opponents,
    st: saved.showTally,
  });
}

function decLast(raw: unknown, seats: number): LastTurn | null {
  const l = raw as { seat?: unknown; roll?: unknown; move?: Partial<Move> | null } | null;
  if (!l || !Number.isInteger(l.seat) || (l.seat as number) >= seats) return null;
  if (!Number.isInteger(l.roll) || (l.roll as number) < 1 || (l.roll as number) > 6) return null;
  const m = l.move;
  if (!m) return { seat: l.seat as number, roll: l.roll as number, move: null };
  if (!Number.isInteger(m.marble) || !isProgress(m.from) || !isProgress(m.to)) return null;
  const captures: Capture[] = Array.isArray(m.captures)
    ? m.captures.filter((c) => Number.isInteger(c?.seat) && Number.isInteger(c?.marble)).map((c) => ({ seat: c.seat, marble: c.marble }))
    : [];
  return {
    seat: l.seat as number,
    roll: l.roll as number,
    move: { marble: m.marble as number, from: m.from as number, to: m.to as number, out: m.out === true, hop: m.hop === true, captures },
  };
}

/** Restores a saved game, or null if there is none or it is damaged. */
export function deserialize(raw: string | null): SavedPondHop | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (d?.v !== 1 || !Array.isArray(d.m) || d.m.length < 2 || d.m.length > 4) return null;
    const marbles: number[][] = d.m;
    if (!marbles.every((own) => Array.isArray(own) && own.length === MARBLES && own.every(isProgress))) return null;
    // Your own marbles never share a spot outside the corner
    if (!marbles.every((own) => { const out = own.filter((p) => p !== CORNER); return new Set(out).size === out.length; })) return null;
    // Nor do two players' marbles share a track hole
    const holes = marbles.flatMap((own, seat) => own.map((p) => holeOf(seat, p)).filter((h) => h !== null));
    if (new Set(holes).size !== holes.length) return null;
    const seats = marbles.length;
    const turn = count(d.t);
    if (turn >= seats) return null;
    const rolled = Number.isInteger(d.r) && d.r >= 1 && d.r <= 6 ? (d.r as number) : null;
    const winner = Number.isInteger(d.w) && d.w < seats && marbles[d.w].every(isHome) ? (d.w as number) : null;
    const game: PondHopState = {
      marbles: marbles.map((own) => [...own]),
      turn,
      rolled: winner === null ? rolled : null,
      last: decLast(d.la, seats),
      phase: winner === null ? 'play' : 'done',
      winner,
      tally: EMPTY_TALLY.map((_, seat) => count(Array.isArray(d.ta) ? d.ta[seat] : 0)),
    };
    return { game, opponents: d.o === 1 || d.o === 3 ? d.o : 2, showTally: d.st === true };
  } catch {
    return null;
  }
}

export function loadSaved(): SavedPondHop | null {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function save(saved: SavedPondHop): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(saved));
  } catch {
    // not saved; the game still works
  }
}
