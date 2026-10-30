// Saves the game in progress to localStorage (key tidepool.pairs).
import { cardId, createDeck } from '../../cards/deck';
import { BOARD_SIZES, isPair, type BoardSize, type PairsState } from './rules';

export const STORAGE_KEY = 'tidepool.pairs';

export interface SavedPairs {
  game: PairsState;
  /** Board size for the next new game. */
  nextSize: BoardSize;
  elapsedMs: number;
  showStats: boolean;
}

const BY_ID = new Map(createDeck().map((card) => [cardId(card), card]));

export function serialize(saved: SavedPairs): string {
  const { game } = saved;
  return JSON.stringify({
    v: 1,
    size: game.size,
    t: game.tiles.map((t) => cardId(t.card)),
    m: game.tiles.map((t) => (t.matched ? 1 : 0)),
    // A pending miss is not saved: those two cards are face down again next time
    o: game.open.length === 1 ? game.open : [],
    mv: game.moves,
    next: saved.nextSize,
    e: Math.round(saved.elapsedMs),
    st: saved.showStats,
  });
}

const asSize = (n: unknown): BoardSize | null => (BOARD_SIZES.includes(n as BoardSize) ? (n as BoardSize) : null);

/** Restores a saved game, or null if there is none or it is damaged. */
export function deserialize(raw: string | null): SavedPairs | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const size = asSize(data?.size);
    if (data?.v !== 1 || !size || !Array.isArray(data.t) || data.t.length !== size) return null;
    const tiles = data.t.map((id: unknown, i: number) => {
      const card = BY_ID.get(String(id));
      if (!card) throw new Error('bad card');
      return { card, matched: data.m?.[i] === 1 };
    });
    // Every card must have exactly one partner on the board, and matched flags must come in pairs
    for (const tile of tiles) {
      const partners = tiles.filter((t: typeof tile) => t !== tile && isPair(t.card, tile.card));
      if (partners.length !== 1 || partners[0].matched !== tile.matched) return null;
    }
    const open = Array.isArray(data.o) ? data.o.filter((i: unknown) => Number.isInteger(i) && !tiles[i as number]?.matched).slice(0, 1) : [];
    return {
      game: { size, tiles, open, moves: Number(data.mv) || 0 },
      nextSize: asSize(data.next) ?? size,
      elapsedMs: Number(data.e) || 0,
      showStats: data.st === true,
    };
  } catch {
    return null;
  }
}

export function loadSaved(): SavedPairs | null {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function save(saved: SavedPairs): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(saved));
  } catch {
    // not saved; the game still works
  }
}
