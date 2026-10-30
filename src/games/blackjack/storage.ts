// Saves the shoe, the round in progress and the tally to localStorage (key tidepool.blackjack).
import { cardId, createDeck, type Card } from '../../cards/deck';
import type { BlackjackState, Phase, Result } from './rules';

export const STORAGE_KEY = 'tidepool.blackjack';

export interface SavedBlackjack {
  game: BlackjackState;
  showTally: boolean;
  showHints: boolean;
}

const BY_ID = new Map(createDeck().map((card) => [cardId(card), card]));
const PHASES: Phase[] = ['player', 'dealer', 'done'];
const RESULTS: Result[] = ['blackjack', 'win', 'push', 'lose'];

const enc = (cards: Card[]) => cards.map(cardId);

function dec(ids: unknown): Card[] {
  if (!Array.isArray(ids)) throw new Error('bad pile');
  return ids.map((id) => {
    const card = BY_ID.get(String(id));
    if (!card) throw new Error('bad card');
    return card;
  });
}

const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0);

export function serialize(saved: SavedBlackjack): string {
  const g = saved.game;
  return JSON.stringify({
    v: 1,
    s: enc(g.shoe),
    d: enc(g.dealer),
    hh: g.holeHidden,
    h: g.hands.map((h) => ({ c: enc(h.cards), done: h.done, sp: h.fromSplit })),
    a: g.active,
    p: g.phase,
    r: g.results,
    sh: g.shuffled,
    t: g.tally,
    st: saved.showTally,
    hi: saved.showHints,
  });
}

/** Restores a saved game, or null if there is none or it is damaged. */
export function deserialize(raw: string | null): SavedBlackjack | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (d?.v !== 1 || !PHASES.includes(d.p) || !Array.isArray(d.h)) return null;
    const hands = d.h.map((h: { c: unknown; done: unknown; sp: unknown }) => ({
      cards: dec(h.c),
      done: h.done === true,
      fromSplit: h.sp === true,
    }));
    const game: BlackjackState = {
      shoe: dec(d.s),
      dealer: dec(d.d),
      holeHidden: d.hh === true,
      hands,
      active: Math.min(count(d.a), Math.max(0, hands.length - 1)),
      phase: d.p,
      results: Array.isArray(d.r) && d.r.every((r: Result) => RESULTS.includes(r)) ? d.r : null,
      shuffled: d.sh === true,
      tally: { wins: count(d.t?.wins), losses: count(d.t?.losses), pushes: count(d.t?.pushes) },
    };
    const all = [...game.shoe, ...game.dealer, ...hands.flatMap((h: { cards: Card[] }) => h.cards)].map(cardId);
    if (new Set(all).size !== all.length) return null;
    if (game.phase !== 'done' && (hands.length === 0 || game.dealer.length < 2)) return null;
    return { game, showTally: d.st === true, showHints: d.hi === true };
  } catch {
    return null;
  }
}

export function loadSaved(): SavedBlackjack | null {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function save(saved: SavedBlackjack): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(saved));
  } catch {
    // not saved; the game still works
  }
}
