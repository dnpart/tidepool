// Saves the game in progress and the tally to localStorage (key tidepool.fishy), including a claim waiting for your call.
import { cardId, RANKS, SUITS, type Card, type Rank } from '../../cards/deck';
import { EMPTY_TALLY, sortHand, type FishyState, type Opponents, type Play } from './rules';

export const STORAGE_KEY = 'tidepool.fishy';

export interface SavedFishy {
  game: FishyState;
  /** Opponents for the next game. */
  opponents: Opponents;
  showTally: boolean;
}

const BY_ID = new Map<string, Card>(SUITS.flatMap((suit) => RANKS.map((rank) => [cardId({ suit, rank }), { suit, rank }])));
const ids = (cards: readonly Card[]) => cards.map(cardId);
const isSeat = (n: unknown, seats: number) => Number.isInteger(n) && (n as number) >= 0 && (n as number) < seats;
const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0);

export function serialize(saved: SavedFishy): string {
  const g = saved.game;
  return JSON.stringify({
    v: 1,
    h: g.hands.map(ids),
    x: ids(g.aside),
    p: g.pile.map((p) => ({ s: p.seat, c: ids(p.cards), r: p.rank })),
    d: g.due,
    ph: g.phase,
    t: g.turn,
    a: g.asking,
    w: g.winner,
    st: g.starter,
    n: g.plays,
    ta: g.tally,
    o: saved.opponents,
    sh: saved.showTally,
  });
}

function cardsFrom(raw: unknown): Card[] | null {
  if (!Array.isArray(raw)) return null;
  const cards = raw.map((id) => BY_ID.get(id));
  return cards.every(Boolean) ? (cards as Card[]) : null;
}

/** Restores a saved game, or null if there is none or it is damaged. The last event isn't kept. */
export function deserialize(raw: string | null): SavedFishy | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (d?.v !== 1 || !Array.isArray(d.h) || d.h.length < 2 || d.h.length > 4 || !Array.isArray(d.p)) return null;
    const seats = d.h.length;
    const hands = d.h.map(cardsFrom);
    if (hands.some((h: Card[] | null) => !h)) return null;
    const pile: Play[] = [];
    for (const p of d.p) {
      const cards = cardsFrom(p?.c);
      if (!cards || cards.length < 1 || cards.length > 4 || !isSeat(p.s, seats) || !RANKS.includes(p.r)) return null;
      pile.push({ seat: p.s, cards, rank: p.r as Rank });
    }
    const aside = cardsFrom(d.x ?? []);
    if (!aside) return null;
    // Every card exactly once, in a hand, the pile or set aside
    const all = [...hands.flat(), ...pile.flatMap((p) => p.cards), ...aside].map(cardId);
    if (all.length !== 52 || new Set(all).size !== 52) return null;
    if (!RANKS.includes(d.d) || !isSeat(d.t, seats) || !isSeat(d.st, seats)) return null;

    const phase = d.ph;
    let asking: number | null = null;
    let winner: number | null = null;
    if (phase === 'call') {
      const play = pile[pile.length - 1];
      if (!play || !isSeat(d.a, seats) || d.a === play.seat) return null;
      asking = d.a;
    } else if (phase === 'done') {
      if (!isSeat(d.w, seats) || hands[d.w].length > 0) return null;
      winner = d.w;
    } else if (phase !== 'play' || hands[d.t].length === 0) {
      return null;
    }

    const game: FishyState = {
      hands: hands.map((h: Card[]) => sortHand(h)),
      aside,
      pile,
      due: d.d as Rank,
      phase,
      turn: d.t,
      asking,
      last: null,
      winner,
      starter: d.st,
      plays: count(d.n),
      tally: EMPTY_TALLY.map((_, seat) => count(Array.isArray(d.ta) ? d.ta[seat] : 0)),
    };
    return { game, opponents: d.o === 1 || d.o === 3 ? d.o : 2, showTally: d.sh === true };
  } catch {
    return null;
  }
}

export function loadSaved(): SavedFishy | null {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function save(saved: SavedFishy): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(saved));
  } catch {
    // not saved; the game still works
  }
}
