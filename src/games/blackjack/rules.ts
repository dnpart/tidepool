// Blackjack rules as pure functions (PLAN.md "Game 4: Blackjack"). Nothing here mutates its input.
import { cardId, createDeck, shuffle, type Card } from '../../cards/deck';

/** Reshuffle before a hand when fewer cards than this remain in the shoe. */
export const RESHUFFLE_BELOW = 15;

export interface Hand {
  cards: Card[];
  /** Finished: stood, busted, reached 21, or a split Ace that got its one card. */
  done: boolean;
  /** Made by splitting, so two-card 21 counts as 21, not blackjack. */
  fromSplit: boolean;
}

export type Phase = 'player' | 'dealer' | 'done';
export type Result = 'blackjack' | 'win' | 'push' | 'lose';
export type Action = 'hit' | 'stand' | 'split';

export interface Tally {
  wins: number;
  losses: number;
  pushes: number;
}

export interface BlackjackState {
  /** Face down; the last card is drawn next. */
  shoe: Card[];
  /** Dealer cards: [up card, hole card, ...draws]. */
  dealer: Card[];
  holeHidden: boolean;
  hands: Hand[];
  /** Index of the hand being played. */
  active: number;
  phase: Phase;
  /** One result per hand once the round is done. */
  results: Result[] | null;
  /** True for the round that started with a freshly shuffled shoe. */
  shuffled: boolean;
  tally: Tally;
}

export const EMPTY_TALLY: Tally = { wins: 0, losses: 0, pushes: 0 };

// --- hand values ---

const cardValue = (card: Card): number => (card.rank === 1 ? 11 : Math.min(card.rank, 10));

/** Best total without going over 21 where possible. Soft means an Ace is still counting 11. */
export function handValue(cards: readonly Card[]): { total: number; soft: boolean } {
  let total = cards.reduce((sum, c) => sum + cardValue(c), 0);
  let elevens = cards.filter((c) => c.rank === 1).length;
  while (total > 21 && elevens > 0) {
    total -= 10;
    elevens--;
  }
  return { total, soft: elevens > 0 };
}

export const isBust = (cards: readonly Card[]): boolean => handValue(cards).total > 21;

/** An Ace and a 10-value card as the first two cards of a hand that wasn't split. */
export const isBlackjack = (cards: readonly Card[], fromSplit = false): boolean =>
  !fromSplit && cards.length === 2 && handValue(cards).total === 21;

const isTenOrAce = (card: Card) => card.rank === 1 || card.rank >= 10;

// --- drawing ---

/** Draws the next card. If the shoe is ever empty mid-round, the cards not on the table are reshuffled. */
function draw(state: BlackjackState, random: () => number): { card: Card; shoe: Card[] } {
  let shoe = state.shoe;
  if (shoe.length === 0) {
    const onTable = new Set([...state.dealer, ...state.hands.flatMap((h) => h.cards)].map(cardId));
    shoe = shuffle(createDeck().filter((c) => !onTable.has(cardId(c))), random);
  }
  return { card: shoe[shoe.length - 1], shoe: shoe.slice(0, -1) };
}

// --- a round ---

export function newGame(random: () => number = Math.random): BlackjackState {
  return {
    shoe: shuffle(createDeck(), random),
    dealer: [],
    holeHidden: true,
    hands: [],
    active: 0,
    phase: 'done',
    results: null,
    shuffled: true,
    tally: EMPTY_TALLY,
  };
}

/** Deals a new round: you, dealer up card, you, dealer hole card. Settles naturals straight away. */
export function deal(prev: BlackjackState, random: () => number = Math.random): BlackjackState {
  const shuffled = prev.shoe.length < RESHUFFLE_BELOW;
  let shoe = shuffled ? shuffle(createDeck(), random) : prev.shoe;
  const take = () => {
    const card = shoe[shoe.length - 1];
    shoe = shoe.slice(0, -1);
    return card;
  };
  const p1 = take();
  const up = take();
  const p2 = take();
  const hole = take();

  const state: BlackjackState = {
    ...prev,
    shoe,
    dealer: [up, hole],
    holeHidden: true,
    hands: [{ cards: [p1, p2], done: false, fromSplit: false }],
    active: 0,
    phase: 'player',
    results: null,
    shuffled,
  };

  const playerBJ = isBlackjack(state.hands[0].cards);
  // The dealer peeks under an Ace or 10-value up card; a dealer blackjack ends the hand at once
  const dealerBJ = isTenOrAce(up) && isBlackjack(state.dealer);
  if (dealerBJ) return settle({ ...state, holeHidden: false, hands: [{ ...state.hands[0], done: true }] });
  if (playerBJ) return settle({ ...state, holeHidden: false, hands: [{ ...state.hands[0], done: true }] });
  return state;
}

export function canSplit(state: BlackjackState): boolean {
  if (state.phase !== 'player' || state.hands.length !== 1) return false;
  const [a, b] = state.hands[0].cards;
  return state.hands[0].cards.length === 2 && a.rank === b.rank;
}

/** Actions open to you right now. */
export function actions(state: BlackjackState): Action[] {
  if (state.phase !== 'player') return [];
  return canSplit(state) ? ['hit', 'stand', 'split'] : ['hit', 'stand'];
}

/** Moves to the next unfinished hand, or hands over to the dealer. */
function advance(state: BlackjackState): BlackjackState {
  const next = state.hands.findIndex((h) => !h.done);
  if (next >= 0) return { ...state, active: next };
  // Everything busted: the dealer just shows the hole card
  if (state.hands.every((h) => isBust(h.cards))) return settle({ ...state, holeHidden: false });
  return { ...state, phase: 'dealer' };
}

const finishIfDone = (hand: Hand): Hand => ({ ...hand, done: hand.done || handValue(hand.cards).total >= 21 });

export function hit(state: BlackjackState, random: () => number = Math.random): BlackjackState | null {
  if (state.phase !== 'player') return null;
  const { card, shoe } = draw(state, random);
  const hands = state.hands.map((h, i) => (i === state.active ? finishIfDone({ ...h, cards: [...h.cards, card] }) : h));
  return advance({ ...state, shoe, hands });
}

export function stand(state: BlackjackState): BlackjackState | null {
  if (state.phase !== 'player') return null;
  const hands = state.hands.map((h, i) => (i === state.active ? { ...h, done: true } : h));
  return advance({ ...state, hands });
}

/** Splits a pair into two hands, each getting a second card. Split Aces get just that one card each. */
export function split(state: BlackjackState, random: () => number = Math.random): BlackjackState | null {
  if (!canSplit(state)) return null;
  const [a, b] = state.hands[0].cards;
  const aces = a.rank === 1;
  let current = state;
  const extra: Card[] = [];
  for (let i = 0; i < 2; i++) {
    const { card, shoe } = draw(current, random);
    extra.push(card);
    current = { ...current, shoe };
  }
  const hands: Hand[] = [
    finishIfDone({ cards: [a, extra[0]], done: aces, fromSplit: true }),
    finishIfDone({ cards: [b, extra[1]], done: aces, fromSplit: true }),
  ];
  return advance({ ...current, hands, active: 0 });
}

// --- the dealer ---

/** The dealer draws until 17 or more, and stands on soft 17. */
export const dealerShouldDraw = (cards: readonly Card[]): boolean => handValue(cards).total < 17;

/** One dealer step: turn the hole card, then draw one card at a time, then settle. */
export function dealerStep(state: BlackjackState, random: () => number = Math.random): BlackjackState {
  if (state.phase !== 'dealer') return state;
  if (state.holeHidden) return { ...state, holeHidden: false };
  if (dealerShouldDraw(state.dealer)) {
    const { card, shoe } = draw(state, random);
    return { ...state, shoe, dealer: [...state.dealer, card] };
  }
  return settle(state);
}

/** Plays the dealer's whole turn at once. */
export function playDealer(state: BlackjackState, random: () => number = Math.random): BlackjackState {
  let current = state;
  for (let guard = 0; guard < 20 && current.phase === 'dealer'; guard++) current = dealerStep(current, random);
  return current;
}

// --- results ---

function resultFor(hand: Hand, dealer: Card[]): Result {
  const player = handValue(hand.cards).total;
  const house = handValue(dealer).total;
  const dealerBJ = isBlackjack(dealer);
  const playerBJ = isBlackjack(hand.cards, hand.fromSplit);
  if (player > 21) return 'lose';
  if (playerBJ && dealerBJ) return 'push';
  if (dealerBJ) return 'lose';
  if (playerBJ) return 'blackjack';
  if (house > 21 || player > house) return 'win';
  return player === house ? 'push' : 'lose';
}

function settle(state: BlackjackState): BlackjackState {
  const results = state.hands.map((h) => resultFor(h, state.dealer));
  const tally = results.reduce(
    (t, r) =>
      r === 'push' ? { ...t, pushes: t.pushes + 1 } : r === 'lose' ? { ...t, losses: t.losses + 1 } : { ...t, wins: t.wins + 1 },
    state.tally,
  );
  return { ...state, phase: 'done', holeHidden: false, results, tally };
}

export const resetTally = (state: BlackjackState): BlackjackState => ({ ...state, tally: EMPTY_TALLY });

// --- hints: basic strategy without doubling ---

/** The move basic strategy suggests for the active hand (dealer stands on soft 17, no doubling). */
export function recommend(state: BlackjackState): Action | null {
  if (state.phase !== 'player') return null;
  const hand = state.hands[state.active];
  const up = cardValue(state.dealer[0]); // 2..11, with 11 for an Ace
  if (canSplit(state)) {
    const rank = Math.min(hand.cards[0].rank, 10);
    const splitIt =
      rank === 1 ||
      rank === 8 ||
      (rank === 9 && up !== 7 && up < 10) ||
      ((rank === 2 || rank === 3 || rank === 7) && up <= 7) ||
      (rank === 6 && up <= 6);
    if (splitIt) return 'split';
  }
  const { total, soft } = handValue(hand.cards);
  if (soft) {
    if (total >= 19) return 'stand';
    if (total === 18) return up >= 9 ? 'hit' : 'stand';
    return 'hit';
  }
  if (total >= 17) return 'stand';
  if (total >= 13) return up <= 6 ? 'stand' : 'hit';
  if (total === 12) return up >= 4 && up <= 6 ? 'stand' : 'hit';
  return 'hit';
}
