import { describe, expect, it } from 'vitest';
import { cardId, type Card, type Rank, type Suit } from '../../cards/deck';
import { seededRandom } from '../../util/random';
import { chooseMove, MIN_GAP_MS, nextDelay, PACE_MS } from './ai';
import {
  cardsRemaining,
  deal,
  isAdjacent,
  isStalemate,
  legalMoves,
  pilesFor,
  play,
  stalemateFlip,
  type SpeedState,
} from './rules';

const SUIT_CODES: Record<string, Suit> = { h: 'hearts', d: 'diamonds', s: 'spades', c: 'clubs' };
const RANK_CODES: Record<string, Rank> = { A: 1, J: 11, Q: 12, K: 13 };
function c(code: string): Card {
  const rank = RANK_CODES[code.slice(0, -1)] ?? (Number(code.slice(0, -1)) as Rank);
  return { rank, suit: SUIT_CODES[code.slice(-1)] };
}
const cards = (codes: string) => (codes ? codes.split(' ').map(c) : []);
const hand = (codes: string) => {
  const list: (Card | null)[] = cards(codes);
  while (list.length < 5) list.push(null);
  return list;
};

function state(parts: {
  you?: string; youDraw?: string; octo?: string; octoDraw?: string;
  center?: [string, string]; side?: [string, string];
}): SpeedState {
  return {
    you: { hand: hand(parts.you ?? ''), draw: cards(parts.youDraw ?? '') },
    octo: { hand: hand(parts.octo ?? ''), draw: cards(parts.octoDraw ?? '') },
    center: [cards(parts.center?.[0] ?? ''), cards(parts.center?.[1] ?? '')],
    side: [cards(parts.side?.[0] ?? ''), cards(parts.side?.[1] ?? '')],
    winner: null,
  };
}

const allCards = (s: SpeedState) =>
  [s.you, s.octo].flatMap((p) => [...p.hand.filter((x): x is Card => !!x), ...p.draw]).concat(s.center.flat(), s.side.flat());

describe('deal', () => {
  const s = deal(seededRandom(1));

  it('gives each player 5 in hand and 15 to draw', () => {
    for (const p of [s.you, s.octo]) {
      expect(p.hand.filter(Boolean)).toHaveLength(5);
      expect(p.draw).toHaveLength(15);
    }
  });

  it('starts two center piles from two side piles of 6', () => {
    expect(s.center.map((p) => p.length)).toEqual([1, 1]);
    expect(s.side.map((p) => p.length)).toEqual([5, 5]);
  });

  it('uses all 52 cards once', () => {
    expect(new Set(allCards(s).map(cardId)).size).toBe(52);
  });
});

describe('playing cards', () => {
  it('allows one rank above or below, wrapping King and Ace, any suit', () => {
    expect(isAdjacent(c('5h'), c('6s'))).toBe(true);
    expect(isAdjacent(c('5h'), c('4h'))).toBe(true);
    expect(isAdjacent(c('Kc'), c('Ad'))).toBe(true);
    expect(isAdjacent(c('Ad'), c('Kc'))).toBe(true);
    expect(isAdjacent(c('5h'), c('5s'))).toBe(false);
    expect(isAdjacent(c('5h'), c('7s'))).toBe(false);
  });

  it('plays onto either center pile and refills the slot from the draw pile', () => {
    const s = state({ you: '6s 9h', youDraw: '2c 3c', center: ['5d', 'Kh'] });
    expect(pilesFor(s, 'you', 0)).toEqual([0]);
    const next = play(s, 'you', { slot: 0, pile: 0 })!;
    expect(next.center[0]).toEqual(cards('5d 6s'));
    expect(next.you.hand[0]).toEqual(c('3c'));
    expect(next.you.draw).toEqual(cards('2c'));
  });

  it('rejects illegal plays and empty slots', () => {
    const s = state({ you: '9h', center: ['5d', 'Kh'] });
    expect(play(s, 'you', { slot: 0, pile: 0 })).toBeNull();
    expect(play(s, 'you', { slot: 3, pile: 0 })).toBeNull();
  });

  it('leaves the slot empty when the draw pile has run out', () => {
    const s = state({ you: '6s 9h', center: ['5d', 'Kh'] });
    expect(play(s, 'you', { slot: 0, pile: 0 })!.you.hand[0]).toBeNull();
  });

  it('declares a winner when hand and draw pile are both empty', () => {
    const s = state({ octo: 'Qs', you: '2c', youDraw: '3d', center: ['Kh', '9c'] });
    const won = play(s, 'octo', { slot: 0, pile: 0 })!;
    expect(won.winner).toBe('octo');
    expect(play(won, 'you', { slot: 0, pile: 0 })).toBeNull();
  });

  it('never changes the state it was given', () => {
    const s = deal(seededRandom(2));
    const snapshot = JSON.stringify(s);
    const move = legalMoves(s, 'you')[0];
    if (move) play(s, 'you', move);
    stalemateFlip(s, seededRandom(3));
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});

describe('stalemates', () => {
  it('detects when neither player can move', () => {
    expect(isStalemate(state({ you: '9h', octo: '9c', center: ['5d', '2h'] }))).toBe(true);
    expect(isStalemate(state({ you: '9h', octo: '6c', center: ['5d', '2h'] }))).toBe(false);
    expect(isStalemate(state({ you: '6h', octo: '9c', center: ['5d', '2h'] }))).toBe(false);
  });

  it('flips one card from each side pile onto the center piles', () => {
    const s = state({ you: '9h', octo: '9c', center: ['5d', '2h'], side: ['3s 7c', '4s Jd'] });
    const { state: next, recycled } = stalemateFlip(s);
    expect(recycled).toBe(false);
    expect(next.center).toEqual([cards('5d 7c'), cards('2h Jd')]);
    expect(next.side).toEqual([cards('3s'), cards('4s')]);
  });

  it('reshuffles the center piles, keeping their top cards, when the side piles are empty', () => {
    const s = state({ you: '9h', octo: '9c', center: ['2c 3d 4s 5d', 'Ac Qd 2h'] });
    const { state: next, recycled } = stalemateFlip(s, seededRandom(4));
    expect(recycled).toBe(true);
    // Old tops stay underneath the freshly flipped cards
    expect(next.center[0][0]).toEqual(c('5d'));
    expect(next.center[1][0]).toEqual(c('2h'));
    expect(next.center.map((p) => p.length)).toEqual([2, 2]);
    expect(next.side[0].length + next.side[1].length).toBe(3);
    expect(allCards(next).map(cardId).sort()).toEqual(allCards(s).map(cardId).sort());
  });

  it('takes from the draw piles when there is nothing left to recycle', () => {
    const s = state({ you: '9h', youDraw: '7d', octo: '9c', octoDraw: '8s', center: ['5d', '2h'] });
    const { state: next } = stalemateFlip(s);
    expect(next.center).toEqual([cards('5d 7d'), cards('2h 8s')]);
    expect(next.winner).toBeNull();
  });

  it('ends a true deadlock in favor of whoever has fewer cards left (you win a tie)', () => {
    expect(stalemateFlip(state({ you: '9h 9d', octo: '9c', center: ['5d', '2h'] })).state.winner).toBe('octo');
    expect(stalemateFlip(state({ you: '9h', octo: '9c', center: ['5d', '2h'] })).state.winner).toBe('you');
  });

  it('plays a whole game out between two random players without losing a card', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const random = seededRandom(seed);
      let s = deal(random);
      for (let turn = 0; turn < 2000 && !s.winner; turn++) {
        if (isStalemate(s)) {
          s = stalemateFlip(s, random).state;
          continue;
        }
        const who = random() < 0.5 ? 'you' : 'octo';
        const moves = legalMoves(s, who);
        if (moves.length) s = play(s, who, moves[Math.floor(random() * moves.length)])!;
        expect(allCards(s)).toHaveLength(52);
      }
      expect(s.winner).not.toBeNull();
      expect(cardsRemaining(s, s.winner!)).toBe(0);
    }
  });
});

describe('octopus AI', () => {
  it('waits the pace ±30%, and never less than 400ms', () => {
    expect(nextDelay('gentle', () => 0)).toBeCloseTo(PACE_MS.gentle * 0.7);
    expect(nextDelay('gentle', () => 0.999999)).toBeCloseTo(PACE_MS.gentle * 1.3, 0);
    expect(nextDelay('quick', () => 0)).toBeGreaterThanOrEqual(MIN_GAP_MS);
    expect(PACE_MS).toEqual({ gentle: 2200, normal: 1400, quick: 900 });
  });

  it('only ever picks legal moves', () => {
    const s = state({ octo: '6s 9h 4c', center: ['5d', 'Kh'] });
    for (let i = 0; i < 20; i++) {
      const move = chooseMove(s, seededRandom(i))!;
      expect(play(s, 'octo', move)).not.toBeNull();
    }
    expect(chooseMove(state({ octo: '9h', center: ['5d', '2h'] }))).toBeNull();
  });
});
