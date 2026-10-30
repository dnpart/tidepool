// Saves the game in progress to localStorage (key tidepool.solitaire) in a compact form.
import { cardId, createDeck, type Card } from '../../cards/deck';
import type { Board, DrawCount, Solitaire } from './rules';

export const STORAGE_KEY = 'tidepool.solitaire';

export interface Saved {
  game: Solitaire;
  elapsedMs: number;
  showStats: boolean;
}

interface EncodedBoard {
  s: string[];
  w: string[];
  f: string[][];
  t: { d: string[]; u: string[] }[];
}

const BY_ID = new Map(createDeck().map((card) => [cardId(card), card]));

const enc = (cards: Card[]) => cards.map(cardId);

function dec(ids: unknown): Card[] {
  if (!Array.isArray(ids)) throw new Error('bad pile');
  return ids.map((id) => {
    const card = BY_ID.get(String(id));
    if (!card) throw new Error('bad card');
    return card;
  });
}

const encodeBoard = (b: Board): EncodedBoard => ({
  s: enc(b.stock),
  w: enc(b.waste),
  f: b.foundations.map(enc),
  t: b.tableau.map((c) => ({ d: enc(c.down), u: enc(c.up) })),
});

function decodeBoard(e: EncodedBoard): Board {
  if (!Array.isArray(e?.f) || e.f.length !== 4 || !Array.isArray(e.t) || e.t.length !== 7) throw new Error('bad board');
  const board: Board = {
    stock: dec(e.s),
    waste: dec(e.w),
    foundations: e.f.map(dec),
    tableau: e.t.map((c) => ({ down: dec(c?.d), up: dec(c?.u) })),
  };
  const all = [...board.stock, ...board.waste, ...board.foundations.flat(), ...board.tableau.flatMap((c) => [...c.down, ...c.up])];
  if (all.length !== 52 || new Set(all.map(cardId)).size !== 52) throw new Error('cards missing');
  return board;
}

export function serialize(saved: Saved): string {
  const { game } = saved;
  return JSON.stringify({
    v: 1,
    b: encodeBoard(game.board),
    d: game.drawCount,
    m: game.moves,
    h: game.history.map((h) => ({ b: encodeBoard(h.board), m: h.moves })),
    e: Math.round(saved.elapsedMs),
    st: saved.showStats,
  });
}

/** Restores a saved game, or null if there is none or it is damaged. */
export function deserialize(raw: string | null): Saved | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data?.v !== 1) return null;
    const drawCount: DrawCount = data.d === 3 ? 3 : 1;
    return {
      game: {
        board: decodeBoard(data.b),
        drawCount,
        moves: Number(data.m) || 0,
        history: Array.isArray(data.h) ? data.h.map((h: { b: EncodedBoard; m: number }) => ({ board: decodeBoard(h.b), moves: Number(h.m) || 0 })) : [],
      },
      elapsedMs: Number(data.e) || 0,
      showStats: data.st === true,
    };
  } catch {
    return null;
  }
}

export function loadSaved(): Saved | null {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function save(saved: Saved): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(saved));
  } catch {
    // Storage full: drop the oldest undo steps and try once more
    try {
      const trimmed = { ...saved, game: { ...saved.game, history: saved.game.history.slice(-200) } };
      localStorage.setItem(STORAGE_KEY, serialize(trimmed));
    } catch {
      // still failing: the game keeps working, it just won't survive a restart
    }
  }
}
