// Saves the round in progress and the tally to localStorage (key tidepool.dominoes).
import { createSet, EMPTY_TALLY, tileId, type DominoesState, type LastTurn, type Opponents, type Placed, type Tile } from './rules';

export const STORAGE_KEY = 'tidepool.dominoes';

export interface SavedDominoes {
  game: DominoesState;
  /** Opponents for the next round. */
  opponents: Opponents;
  showTally: boolean;
}

const BY_ID = new Map(createSet().map((t) => [tileId(t), t]));

const enc = (tiles: Tile[]) => tiles.map(tileId);

function dec(ids: unknown): Tile[] {
  if (!Array.isArray(ids)) throw new Error('bad tiles');
  return ids.map((id) => {
    const tile = BY_ID.get(String(id));
    if (!tile) throw new Error('bad tile');
    return tile;
  });
}

const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0);
const isNumber = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 6;

/** A placed tile is saved as its two numbers left to right, "63" for 6 | 3. */
function decPlaced(ids: unknown): Placed[] {
  if (!Array.isArray(ids)) throw new Error('bad line');
  return ids.map((id) => {
    const s = String(id);
    const left = Number(s[0]);
    const right = Number(s[1]);
    if (s.length !== 2 || !isNumber(left) || !isNumber(right)) throw new Error('bad placed tile');
    return { left, right };
  });
}

export function serialize(saved: SavedDominoes): string {
  const g = saved.game;
  return JSON.stringify({
    v: 1,
    h: g.hands.map(enc),
    b: enc(g.boneyard),
    l: g.line.map((p) => `${p.left}${p.right}`),
    t: g.turn,
    dr: g.drawn,
    la: g.last && { s: g.last.seat, d: g.last.drew, p: g.last.played && tileId(g.last.played) },
    r: g.result,
    ta: g.tally,
    o: saved.opponents,
    st: saved.showTally,
  });
}

/** Restores a saved round, or null if there is none or it is damaged. */
export function deserialize(raw: string | null): SavedDominoes | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (d?.v !== 1 || !Array.isArray(d.h) || (d.h.length !== 2 && d.h.length !== 3)) return null;
    const hands = d.h.map(dec);
    const boneyard = dec(d.b);
    const line = decPlaced(d.l);
    // Every tile is in exactly one place: a hand, the boneyard or the line
    const ids = [...hands.flat(), ...boneyard].map(tileId);
    const lineIds = line.map((p) => tileId({ a: Math.min(p.left, p.right), b: Math.max(p.left, p.right) }));
    const all = [...ids, ...lineIds];
    if (all.length !== 28 || new Set(all).size !== 28) return null;
    // Neighbours on the line must match
    if (line.some((p, i) => i > 0 && line[i - 1].right !== p.left)) return null;

    const turn = count(d.t);
    if (turn >= hands.length) return null;
    const last: LastTurn | null =
      d.la && Number.isInteger(d.la.s) && d.la.s < hands.length
        ? { seat: d.la.s, drew: count(d.la.d), played: d.la.p ? (BY_ID.get(String(d.la.p)) ?? null) : null }
        : null;
    const r = d.r;
    const result =
      r && Array.isArray(r.pips) && r.pips.length === hands.length && (r.winner === null || (Number.isInteger(r.winner) && r.winner < hands.length))
        ? { winner: r.winner as number | null, blocked: r.blocked === true, pips: r.pips.map(count) }
        : null;
    const tally = EMPTY_TALLY.map((_, seat) => count(Array.isArray(d.ta) ? d.ta[seat] : 0));
    const game: DominoesState = {
      hands,
      boneyard,
      line,
      turn,
      drawn: count(d.dr),
      last,
      phase: result ? 'done' : 'play',
      result,
      tally,
    };
    return { game, opponents: d.o === 1 ? 1 : 2, showTally: d.st === true };
  } catch {
    return null;
  }
}

export function loadSaved(): SavedDominoes | null {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function save(saved: SavedDominoes): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(saved));
  } catch {
    // not saved; the game still works
  }
}
