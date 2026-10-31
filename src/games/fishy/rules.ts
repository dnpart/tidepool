// Fishy rules as pure functions (PLAN.md "Game 7: Fishy"): the bluffing game also called Cheat or I Doubt It.
// Nothing here mutates its input. Seats are numbered: 0 is you, then the opponents. The rules never ask who is a
// computer, so a person can take any seat when two phones play together.
import { cardId, createDeck, shuffle, type Card, type Rank } from '../../cards/deck';

export type Opponents = 1 | 2 | 3;

/** Seat 1 bluffs boldly and rarely calls, seat 2 rarely bluffs and calls often, seat 3 (the King) is in between. */
export type Personality = 'bold' | 'careful' | 'steady';
export const PERSONALITIES: readonly Personality[] = ['steady', 'bold', 'careful', 'steady'];

export const MAX_PLAY = 4;
export const EMPTY_TALLY: readonly number[] = [0, 0, 0, 0];

/** One play on the pile: the cards really put down, and the rank they were claimed as. */
export interface Play {
  seat: number;
  cards: Card[];
  rank: Rank;
}

/** What just happened, for the status line and the speech bubbles. */
export type LastEvent =
  | { kind: 'play'; seat: number; count: number; rank: Rank }
  | { kind: 'letGo'; seat: number }
  /** `caller` called the play by `player` (claimed as `rank`); `cards` were turned over and `pickedUp` took the whole pile. */
  | { kind: 'call'; caller: number; player: number; rank: Rank; lie: boolean; cards: Card[]; pickedUp: number; size: number };

export interface FishyState {
  /** One hand per seat, kept in rank order. */
  hands: Card[][];
  /** With two players, 18 cards set aside face down for the whole game, so nobody can be sure where every card is. */
  aside: Card[];
  /** Plays since the pile was last picked up, oldest first. */
  pile: Play[];
  /** The rank the next play must be claimed as. */
  due: Rank;
  /**
   * 'play': `turn` puts cards down. 'call': the last play is waiting, and `asking` decides whether to call it.
   * 'done': `winner` played their last card and it stood.
   */
  phase: 'play' | 'call' | 'done';
  turn: number;
  asking: number | null;
  last: LastEvent | null;
  winner: number | null;
  /** The seat that played first this game; the next game starts one seat round. */
  starter: number;
  /** Plays made this game; 0 means the opponents can still be changed at once. */
  plays: number;
  /** Games won by seats 0 to 3. Kept when the number of opponents changes. */
  tally: number[];
}

// --- cards and words ---

const RANK_ORDER = (a: Card, b: Card) => a.rank - b.rank || 'hdsc'.indexOf(a.suit[0]) - 'hdsc'.indexOf(b.suit[0]);
export const sortHand = (hand: readonly Card[]): Card[] => [...hand].sort(RANK_ORDER);

/** The rank due after this one: Aces up to Kings, then Aces again. */
export const nextRank = (rank: Rank): Rank => ((rank % 13) + 1) as Rank;

const COUNT_WORDS = ['', 'One', 'Two', 'Three', 'Four'];
const RANK_WORDS: Partial<Record<Rank, [string, string]>> = {
  1: ['Ace', 'Aces'], 11: ['Jack', 'Jacks'], 12: ['Queen', 'Queens'], 13: ['King', 'Kings'],
};

/** The rank on its own, plural: "Aces", "7s". */
export const rankPlural = (rank: Rank): string => RANK_WORDS[rank]?.[1] ?? `${rank}s`;

/** A claim as spoken: "One Ace", "Two 7s", "Four Queens". */
export function claimText(count: number, rank: Rank): string {
  const words = RANK_WORDS[rank];
  const name = words ? words[count === 1 ? 0 : 1] : count === 1 ? `${rank}` : `${rank}s`;
  return `${COUNT_WORDS[count] ?? count} ${name}`;
}

export const seatsOf = (state: FishyState): number => state.hands.length;
const after = (state: FishyState, seat: number) => (seat + 1) % seatsOf(state);
export const pileSize = (state: FishyState): number => state.pile.reduce((n, p) => n + p.cards.length, 0);
export const lastPlay = (state: FishyState): Play | null => state.pile[state.pile.length - 1] ?? null;

// --- a game ---

/** Cards each player gets with two players; the rest are set aside unseen (all-cards games ran far too long). */
export const TWO_PLAYER_HAND = 17;

/**
 * Deals all 52 cards round the table, starting with seat 0 (with three players: 18, 17, 17). With two players each gets
 * 17 and 18 are set aside.
 */
export function newGame(
  opponents: Opponents,
  opts: { starter?: number; tally?: readonly number[]; random?: () => number } = {},
): FishyState {
  const seats = opponents + 1;
  const deck = shuffle(createDeck(), opts.random);
  const hands: Card[][] = Array.from({ length: seats }, () => []);
  const dealt = seats === 2 ? deck.slice(0, TWO_PLAYER_HAND * 2) : deck;
  dealt.forEach((card, i) => hands[i % seats].push(card));
  const starter = (opts.starter ?? 0) % seats;
  return {
    hands: hands.map(sortHand),
    aside: deck.slice(dealt.length),
    pile: [],
    due: 1,
    phase: 'play',
    turn: starter,
    asking: null,
    last: null,
    winner: null,
    starter,
    plays: 0,
    tally: EMPTY_TALLY.map((_, i) => opts.tally?.[i] ?? 0),
  };
}

/** The next game: same players, the starting seat moved round one, the tally kept. */
export const nextGame = (state: FishyState, opponents: Opponents = (seatsOf(state) - 1) as Opponents, random?: () => number): FishyState =>
  newGame(opponents, { starter: state.starter + 1, tally: state.tally, random });

/**
 * The seat whose turn it is puts down the cards with these ids, claimed as the rank that's due.
 * Null unless it's a play turn and the ids are 1 to 4 different cards from that hand.
 */
export function play(state: FishyState, ids: readonly string[]): FishyState | null {
  if (state.phase !== 'play' || ids.length < 1 || ids.length > MAX_PLAY || new Set(ids).size !== ids.length) return null;
  const hand = state.hands[state.turn];
  const cards = ids.map((id) => hand.find((c) => cardId(c) === id));
  if (cards.some((c) => !c)) return null;
  const seat = state.turn;
  return {
    ...state,
    hands: state.hands.map((h, s) => (s === seat ? h.filter((c) => !ids.includes(cardId(c))) : h)),
    pile: [...state.pile, { seat, cards: cards as Card[], rank: state.due }],
    due: nextRank(state.due),
    phase: 'call',
    plays: state.plays + 1,
    asking: after(state, seat),
    last: { kind: 'play', seat, count: ids.length, rank: state.due },
  };
}

/** Ends the call phase with nobody calling: the play stands. */
function stand(state: FishyState, play: Play, last: LastEvent): FishyState {
  if (state.hands[play.seat].length === 0) return win(state, play.seat, last);
  return { ...state, phase: 'play', turn: after(state, play.seat), asking: null, last };
}

function win(state: FishyState, seat: number, last: LastEvent): FishyState {
  return {
    ...state,
    phase: 'done',
    asking: null,
    winner: seat,
    last,
    tally: state.tally.map((n, s) => (s === seat ? n + 1 : n)),
  };
}

/** The seat being asked lets the last play go. Once everyone has, the play stands. */
export function letGo(state: FishyState): FishyState | null {
  const play = lastPlay(state);
  if (state.phase !== 'call' || state.asking === null || !play) return null;
  const last: LastEvent = { kind: 'letGo', seat: state.asking };
  const next = after(state, state.asking);
  if (next === play.seat) return stand(state, play, last);
  return { ...state, asking: next, last };
}

/**
 * The seat being asked calls "Fishy!" on the last play. Its cards are turned over: a lie and the player picks up the
 * whole pile, all true and the caller does. A true last card wins the game.
 */
export function call(state: FishyState): FishyState | null {
  const play = lastPlay(state);
  if (state.phase !== 'call' || state.asking === null || !play) return null;
  const caller = state.asking;
  const lie = play.cards.some((c) => c.rank !== play.rank);
  const pickedUp = lie ? play.seat : caller;
  const everything = state.pile.flatMap((p) => p.cards);
  const cleared: FishyState = {
    ...state,
    hands: state.hands.map((h, s) => (s === pickedUp ? sortHand([...h, ...everything]) : h)),
    pile: [],
  };
  const last: LastEvent = { kind: 'call', caller, player: play.seat, rank: play.rank, lie, cards: play.cards, pickedUp, size: everything.length };
  return stand(cleared, play, last);
}

export const resetTally = (state: FishyState): FishyState => ({ ...state, tally: [...EMPTY_TALLY] });

// --- what a seat may know ---

/**
 * Everything one seat can know, and all the opponents' choices get: its own hand, the cards it put in the pile, how many
 * cards everyone holds, and the claim waiting to be called. Never anyone else's cards.
 */
export interface SeatView {
  seat: number;
  seats: number;
  hand: Card[];
  /** This seat's own cards in the pile. */
  mine: Card[];
  pileSize: number;
  handCounts: number[];
  due: Rank;
  /** The play waiting for calls: who made it, how many cards, and the rank claimed. */
  claim: { seat: number; count: number; rank: Rank } | null;
}

export function viewFor(state: FishyState, seat: number): SeatView {
  const play = state.phase === 'call' ? lastPlay(state) : null;
  return {
    seat,
    seats: seatsOf(state),
    hand: state.hands[seat],
    mine: state.pile.filter((p) => p.seat === seat).flatMap((p) => p.cards),
    pileSize: pileSize(state),
    handCounts: state.hands.map((h) => h.length),
    due: state.due,
    claim: play && { seat: play.seat, count: play.cards.length, rank: play.rank },
  };
}

// --- the opponents ---

/** How many of this seat's own turns away it will next need each rank (1 = its next turn after this one). */
function turnsUntilNeeded(view: SeatView, rank: Rank): number {
  for (let k = 1; k <= 13; k++) {
    if (((view.due - 1 + view.seats * k) % 13) + 1 === rank) return k;
  }
  return 14;
}

const BLUFF_TWO: Record<Personality, number> = { bold: 0.35, steady: 0.15, careful: 0.05 };
const SLIP_EXTRA: Record<Personality, number> = { bold: 0.3, steady: 0.08, careful: 0 };

/**
 * The cards an opponent puts down: every card of the rank that's due (a bold one sometimes slips one more in), or
 * otherwise a bluff of one card (sometimes two), choosing the cards it will need furthest in the future.
 */
export function choosePlay(view: SeatView, personality: Personality, random: () => number = Math.random): string[] {
  const honest = view.hand.filter((c) => c.rank === view.due);
  // Furthest-off cards first: the best ones to give away
  const spare = view.hand
    .filter((c) => c.rank !== view.due)
    .sort((a, b) => turnsUntilNeeded(view, b.rank) - turnsUntilNeeded(view, a.rank) || RANK_ORDER(a, b));
  if (honest.length > 0) {
    const slip = honest.length < MAX_PLAY && spare.length > 0 && random() < SLIP_EXTRA[personality];
    return [...honest, ...(slip ? [spare[0]] : [])].map(cardId);
  }
  const two = spare.length >= 3 && random() < BLUFF_TWO[personality];
  return spare.slice(0, two ? 2 : 1).map(cardId);
}

const CALL_BASE: Record<Personality, number> = { bold: 0.05, steady: 0.1, careful: 0.17 };
const CALL_GOING_OUT: Record<Personality, number> = { bold: 0.7, steady: 0.8, careful: 0.9 };

/**
 * The chance (0 to 1) that an opponent calls the waiting claim. Apart from a claim that can't be true, the chances are
 * for the whole table: each of the other seats gets a share, so more players don't mean more calls.
 */
export function callChance(view: SeatView, personality: Personality): number {
  const claim = view.claim;
  if (!claim || claim.seat === view.seat) return 0;
  const known = [...view.hand, ...view.mine].filter((c) => c.rank === claim.rank).length;
  // More than four of a rank can't be true
  if (claim.count + known > 4) return 1;
  // Bigger claims and the cards it holds make a lie likelier; a big pile makes being wrong cost more
  const table =
    view.handCounts[claim.seat] === 0
      ? CALL_GOING_OUT[personality]
      : Math.min(0.75, Math.max(0.02, CALL_BASE[personality] + 0.07 * (claim.count - 1) + 0.06 * known - 0.02 * view.pileSize));
  return 1 - (1 - table) ** (1 / (view.seats - 1));
}

export const chooseCall = (view: SeatView, personality: Personality, random: () => number = Math.random): boolean =>
  random() < callChance(view, personality);

/** A computer seat's move, for whichever seat is up: plays its cards, or answers the waiting claim. */
export function computerMove(state: FishyState, random: () => number = Math.random): FishyState {
  if (state.phase === 'play') {
    const view = viewFor(state, state.turn);
    return play(state, choosePlay(view, PERSONALITIES[state.turn], random)) ?? state;
  }
  if (state.phase === 'call' && state.asking !== null) {
    const view = viewFor(state, state.asking);
    return (chooseCall(view, PERSONALITIES[state.asking], random) ? call(state) : letGo(state)) ?? state;
  }
  return state;
}

/** The seat that acts next (plays or answers a claim), or null when the game is over. */
export const actingSeat = (state: FishyState): number | null =>
  state.phase === 'play' ? state.turn : state.phase === 'call' ? state.asking : null;
