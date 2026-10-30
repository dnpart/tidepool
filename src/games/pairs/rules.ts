// Tide Pairs rules as pure functions (PLAN.md "Game 3: Tide Pairs"). Nothing here mutates its input.
import { RANKS, shuffle, teamOf, type Card, type Suit } from '../../cards/deck';

export type BoardSize = 12 | 16 | 20;
export const BOARD_SIZES: readonly BoardSize[] = [12, 16, 20];
export const COLUMNS = 4;

export interface Tile {
  card: Card;
  matched: boolean;
}

export interface PairsState {
  size: BoardSize;
  tiles: Tile[];
  /** Face-up tiles that aren't matched yet, in the order they were flipped (at most two). */
  open: number[];
  /** One move = two flips. */
  moves: number;
}

export type FlipResult = 'flip' | 'match' | 'miss';

const TEAM_SUITS: Record<'octopus' | 'manta', [Suit, Suit]> = {
  octopus: ['hearts', 'diamonds'],
  manta: ['spades', 'clubs'],
};

/** Two cards pair up when they share a rank and a team: 7♥ with 7♦, or Q♠ with Q♣. */
export const isPair = (a: Card, b: Card): boolean => a.rank === b.rank && teamOf(a.suit) === teamOf(b.suit);

export function deal(size: BoardSize = 16, random: () => number = Math.random): PairsState {
  // 13 ranks × 2 teams = 26 possible pairs; pick size / 2 of them
  const options = RANKS.flatMap((rank) => (['octopus', 'manta'] as const).map((team) => ({ rank, team })));
  const chosen = shuffle(options, random).slice(0, size / 2);
  const cards = chosen.flatMap(({ rank, team }) => TEAM_SUITS[team].map((suit) => ({ suit, rank })));
  return { size, tiles: shuffle(cards, random).map((card) => ({ card, matched: false })), open: [], moves: 0 };
}

/** Flips the two unmatched open tiles back face down. */
export const closeMiss = (state: PairsState): PairsState => (state.open.length === 2 ? { ...state, open: [] } : state);

/**
 * Flips a tile. If two unmatched tiles are still showing from a miss, they flip back first.
 * Returns null when the tap does nothing (a matched or already-open tile).
 */
export function flip(state: PairsState, index: number): { state: PairsState; result: FlipResult } | null {
  const tile = state.tiles[index];
  if (!tile || tile.matched) return null;
  const base = closeMiss(state);
  if (base.open.includes(index)) return null;

  if (base.open.length === 0) return { state: { ...base, open: [index] }, result: 'flip' };

  const first = base.open[0];
  const moves = base.moves + 1;
  if (isPair(base.tiles[first].card, tile.card)) {
    const tiles = base.tiles.map((t, i) => (i === first || i === index ? { ...t, matched: true } : t));
    return { state: { ...base, tiles, open: [], moves }, result: 'match' };
  }
  return { state: { ...base, open: [first, index], moves }, result: 'miss' };
}

export const isFaceUp = (state: PairsState, index: number): boolean =>
  state.tiles[index]?.matched || state.open.includes(index);

export const isWon = (state: PairsState): boolean => state.tiles.every((t) => t.matched);

export const pairsFound = (state: PairsState): number => state.tiles.filter((t) => t.matched).length / 2;
