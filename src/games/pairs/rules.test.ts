import { describe, expect, it } from 'vitest';
import { cardId, teamOf, type Card } from '../../cards/deck';
import { seededRandom } from '../../util/random';
import { BOARD_SIZES, closeMiss, deal, flip, isFaceUp, isPair, isWon, pairsFound, type PairsState } from './rules';
import { deserialize, serialize } from './storage';

/** Index of the partner of tile i. */
const partnerOf = (s: PairsState, i: number) => s.tiles.findIndex((t, j) => j !== i && isPair(t.card, s.tiles[i].card));
/** A tile that is not the partner of tile i. */
const strangerOf = (s: PairsState, i: number) => s.tiles.findIndex((t, j) => j !== i && !isPair(t.card, s.tiles[i].card));

describe('deal', () => {
  for (const size of BOARD_SIZES) {
    it(`lays out ${size} cards as ${size / 2} pairs, all face down`, () => {
      const s = deal(size, seededRandom(size));
      expect(s.tiles).toHaveLength(size);
      expect(new Set(s.tiles.map((t) => cardId(t.card))).size).toBe(size);
      s.tiles.forEach((_, i) => expect(partnerOf(s, i)).toBeGreaterThanOrEqual(0));
      expect(s.open).toEqual([]);
      expect(s.tiles.some((t) => t.matched)).toBe(false);
    });
  }

  it('pairs share a rank and a team', () => {
    const s = deal(20, seededRandom(1));
    s.tiles.forEach((t, i) => {
      const p = s.tiles[partnerOf(s, i)].card;
      expect(p.rank).toBe(t.card.rank);
      expect(teamOf(p.suit)).toBe(teamOf(t.card.suit));
    });
  });

  it('gives different boards for different seeds', () => {
    expect(deal(16, seededRandom(1))).not.toEqual(deal(16, seededRandom(2)));
  });
});

describe('isPair', () => {
  const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });
  it('matches same rank on the same team only', () => {
    expect(isPair(c(7, 'hearts'), c(7, 'diamonds'))).toBe(true);
    expect(isPair(c(12, 'spades'), c(12, 'clubs'))).toBe(true);
    expect(isPair(c(7, 'hearts'), c(7, 'spades'))).toBe(false);
    expect(isPair(c(7, 'hearts'), c(8, 'diamonds'))).toBe(false);
  });
});

describe('flipping', () => {
  const s = deal(12, seededRandom(3));

  it('a first flip shows one card', () => {
    const r = flip(s, 0)!;
    expect(r.result).toBe('flip');
    expect(isFaceUp(r.state, 0)).toBe(true);
    expect(r.state.moves).toBe(0);
  });

  it('a matching second flip keeps both face up and counts a move', () => {
    const r = flip(flip(s, 0)!.state, partnerOf(s, 0))!;
    expect(r.result).toBe('match');
    expect(r.state.open).toEqual([]);
    expect(r.state.tiles[0].matched).toBe(true);
    expect(r.state.moves).toBe(1);
    expect(pairsFound(r.state)).toBe(1);
  });

  it('a miss leaves both showing until they close or a third card is tapped', () => {
    const other = strangerOf(s, 0);
    const miss = flip(flip(s, 0)!.state, other)!;
    expect(miss.result).toBe('miss');
    expect(miss.state.open).toEqual([0, other]);
    expect(miss.state.moves).toBe(1);
    expect(closeMiss(miss.state).open).toEqual([]);

    const third = s.tiles.findIndex((_, j) => j !== 0 && j !== other);
    const next = flip(miss.state, third)!;
    expect(next.state.open).toEqual([third]);
  });

  it('never shows more than two unmatched cards', () => {
    let state = s;
    for (let i = 0; i < s.tiles.length; i++) {
      state = flip(state, i)?.state ?? state;
      expect(state.open.length).toBeLessThanOrEqual(2);
    }
  });

  it('ignores taps on open or matched cards', () => {
    const one = flip(s, 0)!.state;
    expect(flip(one, 0)).toBeNull();
    const matched = flip(one, partnerOf(s, 0))!.state;
    expect(flip(matched, 0)).toBeNull();
  });

  it('wins once every pair is found, with one move per pair when played perfectly', () => {
    let state = deal(16, seededRandom(4));
    while (!isWon(state)) {
      const i = state.tiles.findIndex((t) => !t.matched);
      state = flip(flip(state, i)!.state, partnerOf(state, i))!.state;
    }
    expect(state.moves).toBe(8);
    expect(pairsFound(state)).toBe(8);
  });

  it('never changes the state it was given', () => {
    const snapshot = JSON.stringify(s);
    flip(s, 0);
    flip(flip(s, 0)!.state, 1);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});

describe('storage', () => {
  it('round-trips a game in progress', () => {
    const s = deal(20, seededRandom(5));
    const matched = flip(flip(s, 0)!.state, partnerOf(s, 0))!.state;
    const opened = flip(matched, strangerOf(matched, 0))!.state;
    const saved = { game: opened, nextSize: 12 as const, elapsedMs: 42000, showStats: true };
    expect(deserialize(serialize(saved))).toEqual(saved);
  });

  it('turns a pending miss face down again', () => {
    const s = deal(12, seededRandom(6));
    const miss = flip(flip(s, 0)!.state, strangerOf(s, 0))!.state;
    const back = deserialize(serialize({ game: miss, nextSize: 12, elapsedMs: 0, showStats: false }))!;
    expect(back.game.open).toEqual([]);
    expect(back.game.moves).toBe(1);
  });

  it('rejects damaged saves', () => {
    expect(deserialize(null)).toBeNull();
    expect(deserialize('{')).toBeNull();
    const data = JSON.parse(serialize({ game: deal(12, seededRandom(7)), nextSize: 12, elapsedMs: 0, showStats: false }));
    data.t[0] = data.t[1];
    expect(deserialize(JSON.stringify(data))).toBeNull();
  });
});
