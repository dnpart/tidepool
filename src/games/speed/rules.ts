// Speed rules as pure functions (PLAN.md "Game 2: Speed"). Nothing here mutates its input.
import { createDeck, shuffle, type Card } from '../../cards/deck';

export type Who = 'you' | 'octo';

export interface Player {
  /** Five hand slots; null once the draw pile can no longer refill a slot. */
  hand: (Card | null)[];
  /** Face down; the last card is the top. */
  draw: Card[];
}

export interface SpeedState {
  you: Player;
  octo: Player;
  /** Two center piles, face up; the last card is the top. */
  center: [Card[], Card[]];
  /** Two side piles, face down, flipped onto the center piles at a stalemate. */
  side: [Card[], Card[]];
  winner: Who | null;
}

export interface SpeedMove {
  slot: number;
  pile: 0 | 1;
}

export const HAND_SIZE = 5;
const PILE_SIZE = 20;
const SIDE_SIZE = 6;

const top = <T>(cards: readonly T[]): T | undefined => cards[cards.length - 1];

export function deal(random: () => number = Math.random): SpeedState {
  const deck = shuffle(createDeck(), random);
  const player = (cards: Card[]): Player => ({ hand: cards.slice(0, HAND_SIZE), draw: cards.slice(HAND_SIZE) });
  const you = player(deck.slice(0, PILE_SIZE));
  const octo = player(deck.slice(PILE_SIZE, PILE_SIZE * 2));
  const sideA = deck.slice(40, 40 + SIDE_SIZE);
  const sideB = deck.slice(40 + SIDE_SIZE, 40 + SIDE_SIZE * 2);
  // Flip the top of each side pile to start the two center piles
  return {
    you,
    octo,
    center: [sideA.slice(-1), sideB.slice(-1)],
    side: [sideA.slice(0, -1), sideB.slice(0, -1)],
    winner: null,
  };
}

/** One rank above or below, wrapping so King and Ace connect. Suits and teams don't matter. */
export function isAdjacent(a: Card, b: Card): boolean {
  const diff = Math.abs(a.rank - b.rank);
  return diff === 1 || diff === 12;
}

export function canPlay(state: SpeedState, who: Who, move: SpeedMove): boolean {
  if (state.winner) return false;
  const card = state[who].hand[move.slot];
  const target = top(state.center[move.pile]);
  return !!card && !!target && isAdjacent(card, target);
}

export function legalMoves(state: SpeedState, who: Who): SpeedMove[] {
  const moves: SpeedMove[] = [];
  state[who].hand.forEach((_, slot) =>
    ([0, 1] as const).forEach((pile) => canPlay(state, who, { slot, pile }) && moves.push({ slot, pile })),
  );
  return moves;
}

/** Piles a given hand card could go on. */
export const pilesFor = (state: SpeedState, who: Who, slot: number): (0 | 1)[] =>
  ([0, 1] as const).filter((pile) => canPlay(state, who, { slot, pile }));

const isOut = (p: Player) => p.draw.length === 0 && p.hand.every((c) => c === null);

/** Plays a hand card and refills that slot from the draw pile. Null if the move is illegal. */
export function play(state: SpeedState, who: Who, move: SpeedMove): SpeedState | null {
  if (!canPlay(state, who, move)) return null;
  const player = state[who];
  const card = player.hand[move.slot]!;
  const refill = top(player.draw) ?? null;
  const next: Player = {
    hand: player.hand.map((c, i) => (i === move.slot ? refill : c)),
    draw: player.draw.slice(0, -1),
  };
  const center = state.center.map((pile, i) => (i === move.pile ? [...pile, card] : pile)) as [Card[], Card[]];
  return { ...state, [who]: next, center, winner: isOut(next) ? who : null };
}

/** Neither player can move, so the side piles need to flip. */
export const isStalemate = (state: SpeedState): boolean =>
  !state.winner && legalMoves(state, 'you').length === 0 && legalMoves(state, 'octo').length === 0;

const cardsLeft = (p: Player) => p.draw.length + p.hand.filter(Boolean).length;

export interface FlipResult {
  state: SpeedState;
  /** True when the center piles were shuffled back into new side piles first. */
  recycled: boolean;
}

/**
 * Breaks a stalemate: each side pile flips a card onto its center pile. If the side piles are empty,
 * the center piles (except their top cards) are shuffled into new side piles first.
 *
 * Not covered by the plan: if there is nothing at all to recycle, each player's draw pile gives up its
 * top card instead, and if even that is impossible the player with fewer cards left wins (you win a tie).
 */
export function stalemateFlip(state: SpeedState, random: () => number = Math.random): FlipResult {
  let { side, center } = state;
  let recycled = false;

  if (side[0].length === 0 && side[1].length === 0) {
    const pool = shuffle([...center[0].slice(0, -1), ...center[1].slice(0, -1)], random);
    if (pool.length > 0) {
      const half = Math.ceil(pool.length / 2);
      side = [pool.slice(0, half), pool.slice(half)];
      center = [center[0].slice(-1), center[1].slice(-1)];
      recycled = true;
    }
  }

  if (side[0].length || side[1].length) {
    const flipped = side.map((pile, i) => (pile.length ? [...center[i], top(pile)!] : center[i])) as [Card[], Card[]];
    return {
      state: { ...state, side: side.map((pile) => pile.slice(0, -1)) as [Card[], Card[]], center: flipped },
      recycled,
    };
  }

  // Nothing to recycle: take from the players' draw piles
  const fromYou = top(state.you.draw);
  const fromOcto = top(state.octo.draw);
  if (fromYou || fromOcto) {
    return {
      state: {
        ...state,
        you: { ...state.you, draw: state.you.draw.slice(0, fromYou ? -1 : undefined) },
        octo: { ...state.octo, draw: state.octo.draw.slice(0, fromOcto ? -1 : undefined) },
        center: [fromYou ? [...center[0], fromYou] : center[0], fromOcto ? [...center[1], fromOcto] : center[1]],
      },
      recycled,
    };
  }

  const winner: Who = cardsLeft(state.octo) < cardsLeft(state.you) ? 'octo' : 'you';
  return { state: { ...state, winner }, recycled };
}

export const cardsRemaining = (state: SpeedState, who: Who): number => cardsLeft(state[who]);
