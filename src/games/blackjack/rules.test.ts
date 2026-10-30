import { describe, expect, it } from 'vitest';
import { cardId, createDeck, type Card, type Rank, type Suit } from '../../cards/deck';
import { seededRandom } from '../../util/random';
import {
  actions,
  canSplit,
  deal,
  dealerShouldDraw,
  dealerStep,
  EMPTY_TALLY,
  handValue,
  hit,
  isBlackjack,
  newGame,
  playDealer,
  recommend,
  resetTally,
  RESHUFFLE_BELOW,
  split,
  stand,
  type BlackjackState,
} from './rules';
import { deserialize, serialize } from './storage';

// --- helpers ---

const SUIT_CODES: Record<string, Suit> = { h: 'hearts', d: 'diamonds', s: 'spades', c: 'clubs' };
const RANK_CODES: Record<string, Rank> = { A: 1, J: 11, Q: 12, K: 13 };
function c(code: string): Card {
  const rank = RANK_CODES[code.slice(0, -1)] ?? (Number(code.slice(0, -1)) as Rank);
  return { rank, suit: SUIT_CODES[code.slice(-1)] };
}
const cards = (codes: string) => codes.split(' ').map(c);

/**
 * A game whose shoe deals the given cards in order (you, dealer up, you, dealer hole, then draws),
 * padded with the rest of the deck underneath so there's no reshuffle.
 */
function stacked(order: string): BlackjackState {
  const top = cards(order);
  const used = new Set(top.map(cardId));
  const rest = createDeck().filter((x) => !used.has(cardId(x)));
  return { ...newGame(seededRandom(1)), shoe: [...rest, ...[...top].reverse()] };
}

const onTable = (s: BlackjackState) => [...s.shoe, ...s.dealer, ...s.hands.flatMap((h) => h.cards)];

// --- tests ---

describe('hand values', () => {
  it('counts number cards at face value and J, Q, K as 10', () => {
    expect(handValue(cards('2h 9c'))).toEqual({ total: 11, soft: false });
    expect(handValue(cards('Jh Qc'))).toEqual({ total: 20, soft: false });
    expect(handValue(cards('Ks 7d'))).toEqual({ total: 17, soft: false });
  });

  it('counts an Ace as 11 when that fits (soft) and 1 when it would bust (hard)', () => {
    expect(handValue(cards('Ah 6c'))).toEqual({ total: 17, soft: true });
    expect(handValue(cards('Ah 6c 9d'))).toEqual({ total: 16, soft: false });
    expect(handValue(cards('Ah Ad'))).toEqual({ total: 12, soft: true });
    expect(handValue(cards('Ah Ad Ac As'))).toEqual({ total: 14, soft: true });
    expect(handValue(cards('Ah Ad 9c Kd'))).toEqual({ total: 21, soft: false });
  });

  it('knows a blackjack, but not from a split or with three cards', () => {
    expect(isBlackjack(cards('Ah Kc'))).toBe(true);
    expect(isBlackjack(cards('10d As'))).toBe(true);
    expect(isBlackjack(cards('Ah Kc'), true)).toBe(false);
    expect(isBlackjack(cards('7h 7c 7d'))).toBe(false);
  });
});

describe('dealing', () => {
  it('deals you two cards and the dealer an up card plus a hidden hole card', () => {
    const s = deal(stacked('9h 5c 7d Kc'));
    expect(s.hands[0].cards).toEqual(cards('9h 7d'));
    expect(s.dealer).toEqual(cards('5c Kc'));
    expect(s.holeHidden).toBe(true);
    expect(s.phase).toBe('player');
    expect(actions(s)).toEqual(['hit', 'stand']);
  });

  it('pays your blackjack straight away when the dealer has none', () => {
    const s = deal(stacked('Ah 5c Kd 9c'));
    expect(s.phase).toBe('done');
    expect(s.results).toEqual(['blackjack']);
    expect(s.holeHidden).toBe(false);
    expect(s.tally).toEqual({ wins: 1, losses: 0, pushes: 0 });
  });

  it('peeks under an Ace or 10 and ends the hand on a dealer blackjack', () => {
    const lose = deal(stacked('9h Ac 7d Kc'));
    expect(lose.phase).toBe('done');
    expect(lose.results).toEqual(['lose']);
    const tie = deal(stacked('Ah Kc Kd As'));
    expect(tie.results).toEqual(['push']);
  });

  it('keeps playing when the peek finds no blackjack', () => {
    const s = deal(stacked('9h Ac 7d 6c'));
    expect(s.phase).toBe('player');
    expect(s.holeHidden).toBe(true);
  });

  it('reshuffles before a hand when fewer than 15 cards remain', () => {
    const low = { ...newGame(seededRandom(2)), shoe: createDeck().slice(0, RESHUFFLE_BELOW - 1) };
    const s = deal(low, seededRandom(3));
    expect(s.shuffled).toBe(true);
    expect(s.shoe).toHaveLength(52 - 4);
    const enough = { ...newGame(seededRandom(2)), shoe: createDeck().slice(0, RESHUFFLE_BELOW) };
    expect(deal(enough).shuffled).toBe(false);
  });
});

describe('your turn', () => {
  it('hits and stands', () => {
    const s = hit(deal(stacked('5h 9c 6d 8c 4s')))!;
    expect(s.hands[0].cards).toEqual(cards('5h 6d 4s'));
    expect(s.phase).toBe('player');
    const stood = stand(s)!;
    expect(stood.phase).toBe('dealer');
  });

  it('a bust loses at once, and the dealer only shows the hole card', () => {
    const s = hit(deal(stacked('Kh 9c 6d 8c Qs')))!;
    expect(s.phase).toBe('done');
    expect(s.results).toEqual(['lose']);
    expect(s.dealer).toHaveLength(2);
  });

  it('stops for you at 21', () => {
    const s = hit(deal(stacked('Kh 9c 6d 8c 5s')))!;
    expect(s.phase).toBe('dealer');
  });

  it('refuses moves outside your turn', () => {
    const done = deal(stacked('Ah 5c Kd 9c'));
    expect(hit(done)).toBeNull();
    expect(stand(done)).toBeNull();
    expect(split(done)).toBeNull();
  });
});

describe('splitting', () => {
  it('splits a pair into two hands played one after the other', () => {
    const s = deal(stacked('8h 9c 8d 7c 3s Kd'));
    expect(canSplit(s)).toBe(true);
    expect(actions(s)).toContain('split');
    const sp = split(s)!;
    expect(sp.hands.map((h) => h.cards)).toEqual([cards('8h 3s'), cards('8d Kd')]);
    expect(sp.active).toBe(0);
    const second = stand(sp)!;
    expect(second.active).toBe(1);
    expect(stand(second)!.phase).toBe('dealer');
  });

  it('stops split Aces after one card even on a low total', () => {
    const sp = split(deal(stacked('Ah 9c Ad 7c 5c 6s')))!; // soft 16 and soft 17
    expect(sp.hands.every((h) => h.done)).toBe(true);
    expect(sp.phase).toBe('dealer');
    expect(hit(sp)).toBeNull();
  });

  it('allows only one split per round and only matching ranks', () => {
    const sp = split(deal(stacked('8h 9c 8d 7c 8s 2d')))!;
    expect(canSplit(sp)).toBe(false);
    expect(canSplit(deal(stacked('Kh 9c Qd 7c')))).toBe(false);
  });

  it('gives split Aces one card each and goes straight to the dealer', () => {
    const sp = split(deal(stacked('Ah 9c Ad 7c Kc 5s')))!;
    expect(sp.hands.map((h) => h.cards.length)).toEqual([2, 2]);
    expect(sp.hands.every((h) => h.done)).toBe(true);
    expect(sp.phase).toBe('dealer');
    // Ace + King after a split is 21, not blackjack
    const done = playDealer(sp);
    expect(done.results![0]).toBe('win');
  });

  it('counts each split hand in the tally', () => {
    const sp = split(deal(stacked('8h 10c 8d 7c 2s Kd')))!; // 8+2 and 8+K vs dealer 17
    const done = playDealer(stand(stand(sp)!)!);
    expect(done.results).toEqual(['lose', 'win']);
    expect(done.tally).toEqual({ wins: 1, losses: 1, pushes: 0 });
  });
});

describe("the dealer's turn", () => {
  it('turns the hole card first, then draws one card at a time', () => {
    const s = stand(deal(stacked('Kh 6c 9d 5c 4s 3h')))!;
    const turned = dealerStep(s);
    expect(turned.holeHidden).toBe(false);
    expect(turned.dealer).toHaveLength(2);
    const drew = dealerStep(turned);
    expect(drew.dealer).toEqual(cards('6c 5c 4s'));
  });

  it('draws to 17 or more', () => {
    const done = playDealer(stand(deal(stacked('Kh 6c 9d 5c 4s 3h')))!);
    expect(done.dealer).toEqual(cards('6c 5c 4s 3h')); // 18
    expect(done.results).toEqual(['win']); // your 19 beats 18
  });

  it('stands on soft 17', () => {
    expect(dealerShouldDraw(cards('Ah 6c'))).toBe(false);
    expect(dealerShouldDraw(cards('10h 6c'))).toBe(true);
    const done = playDealer(stand(deal(stacked('Kh Ac 8d 6c 9s')))!);
    expect(done.dealer).toEqual(cards('Ac 6c'));
    expect(done.results).toEqual(['win']);
  });

  it('busts, and you win', () => {
    const done = playDealer(stand(deal(stacked('Kh 6c 2d 10c 9s')))!);
    expect(done.dealer).toEqual(cards('6c 10c 9s'));
    expect(done.results).toEqual(['win']);
  });

  it('pushes on a tie', () => {
    const done = playDealer(stand(deal(stacked('Kh 10c 8d 8c')))!);
    expect(done.results).toEqual(['push']);
    expect(done.tally.pushes).toBe(1);
  });
});

describe('tally and saving', () => {
  it('resets the tally', () => {
    expect(resetTally(deal(stacked('Ah 5c Kd 9c'))).tally).toEqual(EMPTY_TALLY);
  });

  it('round-trips a round in progress', () => {
    const s = split(deal(stacked('8h 9c 8d 7c 3s Kd')))!;
    const saved = { game: s, showTally: true, showHints: false };
    expect(deserialize(serialize(saved))).toEqual(saved);
  });

  it('rejects damaged saves', () => {
    expect(deserialize(null)).toBeNull();
    expect(deserialize('[]')).toBeNull();
    const data = JSON.parse(serialize({ game: deal(stacked('9h 5c 7d Kc')), showTally: false, showHints: false }));
    data.d.push(data.s[0]);
    expect(deserialize(JSON.stringify(data))).toBeNull();
  });
});

describe('hints (basic strategy, no doubling)', () => {
  const hintFor = (order: string) => recommend(deal(stacked(order)));
  it('splits Aces and 8s, never 10s or 5s', () => {
    expect(hintFor('Ah 9c Ad 7c')).toBe('split');
    expect(hintFor('8h Kc 8d 7c')).toBe('split');
    expect(hintFor('Kh 6c Kd 7c')).toBe('stand');
    expect(hintFor('5h 6c 5d 7c')).toBe('hit');
  });

  it('stands on 13–16 against a weak dealer card and hits against a strong one', () => {
    expect(hintFor('10h 6c 4d 7c')).toBe('stand');
    expect(hintFor('10h Kc 4d 7c')).toBe('hit');
    expect(hintFor('10h 3c 2d 7c')).toBe('hit');
    expect(hintFor('10h 5c 2d 7c')).toBe('stand');
  });

  it('plays soft hands', () => {
    expect(hintFor('Ah 6c 7d 7c')).toBe('stand'); // soft 18 vs 6
    expect(hintFor('Ah 9c 7d 7c')).toBe('hit'); // soft 18 vs 9
    expect(hintFor('Ah 10c 6d 7c')).toBe('hit'); // soft 17
  });
});

describe('many rounds', () => {
  it('never loses or duplicates a card, and the tally adds up', () => {
    const random = seededRandom(9);
    let s = newGame(random);
    let hands = 0;
    for (let round = 0; round < 300; round++) {
      s = deal(s, random);
      for (let guard = 0; guard < 20 && s.phase === 'player'; guard++) {
        const move = recommend(s)!;
        s = (move === 'split' ? split(s, random) : move === 'hit' ? hit(s, random) : stand(s))!;
      }
      s = playDealer(s, random);
      expect(s.phase).toBe('done');
      hands += s.hands.length;
      const ids = onTable(s).map(cardId);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBeLessThanOrEqual(52);
    }
    expect(s.tally.wins + s.tally.losses + s.tally.pushes).toBe(hands);
  });
});
