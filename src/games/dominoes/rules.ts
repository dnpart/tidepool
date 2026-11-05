// Dominoes rules as pure functions (PLAN.md "Game 5: Dominoes"). Nothing here mutates its input.
// Two ways to play: Draw (first to play out wins the round) and All Fives (Nov 5, the owner asked): the same game, but
// whenever the open ends add up to a multiple of 5 the player scores that many points, going out scores the others'
// pips, and the first to 100 points wins.
// Seats are numbered: 0 is you, 1 the first opponent, 2 the second. The rules don't care who sits where,
// so a person could take an opponent's seat later.
import { shuffle } from '../../cards/deck';

/** A tile with numbers a ≤ b, each 0 to 6. */
export interface Tile {
  a: number;
  b: number;
}

/** A tile on the line, turned so `left` and `right` are the numbers as they sit left to right. */
export interface Placed {
  left: number;
  right: number;
}

export type End = 'left' | 'right';
export type Opponents = 1 | 2;
export type Mode = 'draw' | 'fives';

/** All Fives: the points that win a game. */
export const FIVES_TARGET = 100;

/** Play the tile at `index` in the hand on one end of the line. */
export interface Play {
  index: number;
  end: End;
}

/** What the last finished turn did, for the status line: drew some tiles, then played one or passed. */
export interface LastTurn {
  seat: number;
  drew: number;
  /** Null when the seat passed. */
  played: Tile | null;
  /** All Fives: points the play scored (0 when the ends didn't add up to a multiple of 5). */
  scored: number;
}

export interface RoundResult {
  /** The seat that won, or null for a shared round. */
  winner: number | null;
  /** True when nobody could play and the boneyard was empty. */
  blocked: boolean;
  /** Pips left in each seat's hand. */
  pips: number[];
  /** All Fives: points the winner got for the others' pips (0 in Draw, and when a play reached the target). */
  bonus: number;
  /** All Fives: the winner reached the target, so the game is over too. */
  gameOver: boolean;
}

export interface DominoesState {
  /** One hand per seat: two seats with one opponent, three with two. */
  hands: Tile[][];
  /** Face down; the last tile is drawn next. */
  boneyard: Tile[];
  /** The line of play, left to right. */
  line: Placed[];
  /** The seat whose turn it is. */
  turn: number;
  /** Tiles the seat whose turn it is has drawn this turn. */
  drawn: number;
  last: LastTurn | null;
  phase: 'play' | 'done';
  result: RoundResult | null;
  /** Draw: rounds won by seat 0, 1 and 2. All Fives: games won. Kept when the number of opponents changes. */
  tally: number[];
  mode: Mode;
  /** All Fives: each seat's points in the game so far (zeros in Draw). */
  scores: number[];
}

export const EMPTY_TALLY: readonly number[] = [0, 0, 0];

/** Tiles each seat draws at the start of a round. */
export const HAND_SIZE: Record<Opponents, number> = { 1: 7, 2: 5 };

// --- tiles ---

/** The double-six set: every pair of numbers 0 to 6 once, 28 tiles. */
export function createSet(): Tile[] {
  const set: Tile[] = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) set.push({ a, b });
  return set;
}

export const tileId = (t: Tile): string => `${t.a}${t.b}`;
export const isDouble = (t: Tile): boolean => t.a === t.b;
export const pipCount = (t: Tile): number => t.a + t.b;
export const handPips = (hand: readonly Tile[]): number => hand.reduce((sum, t) => sum + pipCount(t), 0);
export const fits = (t: Tile, n: number): boolean => t.a === n || t.b === n;

/** True if `x` ranks above `y` for who starts: any double beats a non-double, then more pips, then the higher number. */
function startsBefore(x: Tile, y: Tile): boolean {
  if (isDouble(x) !== isDouble(y)) return isDouble(x);
  if (pipCount(x) !== pipCount(y)) return pipCount(x) > pipCount(y);
  return x.b > y.b;
}

/** Who plays first and which tile: the highest double, or with no doubles out, the highest tile by pips. */
export function opening(hands: readonly Tile[][]): { seat: number; index: number } {
  let best: { seat: number; index: number } | null = null;
  hands.forEach((hand, seat) =>
    hand.forEach((t, index) => {
      if (!best || startsBefore(t, hands[best.seat][best.index])) best = { seat, index };
    }),
  );
  if (!best) throw new Error('no tiles dealt');
  return best;
}

// --- a round ---

/** Deals a new round, keeping the tally (and in All Fives, the game's scores). With two opponents everyone draws 5, with one, 7. */
export function newRound(
  opponents: Opponents,
  tally: readonly number[] = EMPTY_TALLY,
  random: () => number = Math.random,
  mode: Mode = 'draw',
  scores?: readonly number[],
): DominoesState {
  let pile = shuffle(createSet(), random);
  const hands: Tile[][] = [];
  for (let seat = 0; seat <= opponents; seat++) {
    hands.push(pile.slice(-HAND_SIZE[opponents]));
    pile = pile.slice(0, -HAND_SIZE[opponents]);
  }
  return {
    hands,
    boneyard: pile,
    line: [],
    turn: opening(hands).seat,
    drawn: 0,
    last: null,
    phase: 'play',
    result: null,
    tally: [...tally],
    mode,
    scores: scores && scores.length === opponents + 1 ? [...scores] : Array(opponents + 1).fill(0),
  };
}

export const newGame = (opponents: Opponents, random: () => number = Math.random, mode: Mode = 'draw'): DominoesState =>
  newRound(opponents, EMPTY_TALLY, random, mode);

/**
 * The round after `prev`: the tally carries on, and in All Fives so do the scores, unless the game was won, the way of
 * playing changed or the number of players did (then a new game starts from 0).
 */
export function nextRound(prev: DominoesState, opponents: Opponents, mode: Mode, random: () => number = Math.random): DominoesState {
  const carry = mode === 'fives' && prev.mode === 'fives' && !prev.result?.gameOver && prev.hands.length === opponents + 1;
  return newRound(opponents, prev.tally, random, mode, carry ? prev.scores : undefined);
}

// --- All Fives scoring ---

/**
 * What the open ends add up to. A double at an end counts both its halves; a lone first tile counts all its pips.
 */
export function endsTotal(line: readonly Placed[]): number {
  if (line.length === 0) return 0;
  if (line.length === 1) return line[0].left + line[0].right;
  const first = line[0];
  const last = line[line.length - 1];
  const left = first.left === first.right ? first.left * 2 : first.left;
  const right = last.left === last.right ? last.right * 2 : last.right;
  return left + right;
}

/** Points for a line in All Fives: its ends' total when that's a multiple of 5, else 0. */
export const fivesScore = (line: readonly Placed[]): number => {
  const total = endsTotal(line);
  return total > 0 && total % 5 === 0 ? total : 0;
};

/** Rounded to the nearest 5 (halves round up), for the pips a winner collects. */
export const nearestFive = (n: number): number => Math.round(n / 5) * 5;

/** The points a play would score in All Fives (0 in Draw). */
export function scoreOf(state: DominoesState, index: number, end: End): number {
  if (state.mode !== 'fives') return 0;
  return fivesScore(place(state.line, state.hands[state.turn][index], end));
}

/** The two open numbers of the line, or null before the first tile. */
export function openEnds(state: DominoesState): { left: number; right: number } | null {
  if (state.line.length === 0) return null;
  return { left: state.line[0].left, right: state.line[state.line.length - 1].right };
}

function playsFor(state: DominoesState, seat: number): Play[] {
  const hand = state.hands[seat];
  const ends = openEnds(state);
  // The first tile of a round can only be the opening tile
  if (!ends) {
    const first = opening(state.hands);
    return first.seat === seat ? [{ index: first.index, end: 'right' }] : [];
  }
  const plays: Play[] = [];
  hand.forEach((t, index) => {
    if (fits(t, ends.left)) plays.push({ index, end: 'left' });
    if (fits(t, ends.right)) plays.push({ index, end: 'right' });
  });
  return plays;
}

/** Every play open to the seat whose turn it is. A tile that fits both ends is listed twice. */
export const legalPlays = (state: DominoesState): Play[] => (state.phase === 'play' ? playsFor(state, state.turn) : []);

/** Nothing fits and the boneyard has tiles: the seat must draw. */
export const mustDraw = (state: DominoesState): boolean =>
  state.phase === 'play' && state.boneyard.length > 0 && legalPlays(state).length === 0;

/** Nothing fits and the boneyard is empty: the seat must pass. */
export const mustPass = (state: DominoesState): boolean =>
  state.phase === 'play' && state.boneyard.length === 0 && legalPlays(state).length === 0;

/** Lays a tile on an end, turned so its matching number touches the line. */
function place(line: readonly Placed[], tile: Tile, end: End): Placed[] {
  if (line.length === 0) return [{ left: tile.a, right: tile.b }];
  if (end === 'right') {
    const open = line[line.length - 1].right;
    return [...line, { left: open, right: tile.a === open ? tile.b : tile.a }];
  }
  const open = line[0].left;
  return [{ left: tile.a === open ? tile.b : tile.a, right: open }, ...line];
}

const nextSeat = (state: DominoesState): number => (state.turn + 1) % state.hands.length;

/** Ends the turn and moves to the next seat, or ends a blocked round. */
function endTurn(state: DominoesState, played: Tile | null, scored = 0): DominoesState {
  const after: DominoesState = {
    ...state,
    turn: nextSeat(state),
    drawn: 0,
    last: { seat: state.turn, drew: state.drawn, played, scored },
  };
  const blocked = after.boneyard.length === 0 && after.hands.every((_, seat) => playsFor(after, seat).length === 0);
  return blocked ? settle(after, null) : after;
}

/** Plays the tile at `index` on `end` for the seat whose turn it is. Null if that play isn't allowed. */
export function play(state: DominoesState, index: number, end: End): DominoesState | null {
  const plays = legalPlays(state);
  // On an empty line either end is the same spot
  const allowed = plays.some((p) => p.index === index && (p.end === end || state.line.length === 0));
  if (!allowed) return null;
  const tile = state.hands[state.turn][index];
  const hands = state.hands.map((h, seat) => (seat === state.turn ? h.filter((_, i) => i !== index) : h));
  const line = place(state.line, tile, end);
  const scored = state.mode === 'fives' ? fivesScore(line) : 0;
  const scores = scored ? state.scores.map((n, seat) => (seat === state.turn ? n + scored : n)) : state.scores;
  const next = { ...state, hands, line, scores };
  const last = { seat: state.turn, drew: state.drawn, played: tile, scored };
  // Reaching the target ends the game at once; playing out ends the round
  if (state.mode === 'fives' && scores[state.turn] >= FIVES_TARGET) return settle({ ...next, drawn: 0, last }, state.turn, true);
  if (hands[state.turn].length === 0) return settle({ ...next, drawn: 0, last }, state.turn);
  return endTurn(next, tile, scored);
}

/** Draws one tile from the boneyard. Only allowed when nothing fits. */
export function draw(state: DominoesState): DominoesState | null {
  if (!mustDraw(state)) return null;
  const tile = state.boneyard[state.boneyard.length - 1];
  return {
    ...state,
    boneyard: state.boneyard.slice(0, -1),
    hands: state.hands.map((h, seat) => (seat === state.turn ? [...h, tile] : h)),
    drawn: state.drawn + 1,
  };
}

/** Passes the turn. Only allowed when nothing fits and the boneyard is empty. */
export function pass(state: DominoesState): DominoesState | null {
  return mustPass(state) ? endTurn(state, null) : null;
}

// --- the end of a round ---

/**
 * Ends the round. `wentOut` is the seat that played its last tile (or in All Fives, reached the target: `reached`);
 * for a blocked round (null) the lowest pips win, then fewer tiles, and a tie after that is shared. In All Fives the
 * winner scores the others' pips, rounded to the nearest 5, and a winner on the target wins the game.
 */
function settle(state: DominoesState, wentOut: number | null, reached = false): DominoesState {
  const pips = state.hands.map(handPips);
  let winner = wentOut;
  if (wentOut === null) {
    const low = Math.min(...pips);
    let best = state.hands.map((_, seat) => seat).filter((seat) => pips[seat] === low);
    const fewest = Math.min(...best.map((seat) => state.hands[seat].length));
    best = best.filter((seat) => state.hands[seat].length === fewest);
    winner = best.length === 1 ? best[0] : null;
  }
  const fives = state.mode === 'fives';
  const others = pips.reduce((sum, n, seat) => (seat === winner ? sum : sum + n), 0);
  const bonus = fives && winner !== null && !reached ? nearestFive(others) : 0;
  const scores = bonus ? state.scores.map((n, seat) => (seat === winner ? n + bonus : n)) : state.scores;
  const gameOver = fives && winner !== null && scores[winner] >= FIVES_TARGET;
  // Draw counts rounds won; All Fives counts games won
  const won = winner !== null && (!fives || gameOver);
  const tally = won ? state.tally.map((n, seat) => (seat === winner ? n + 1 : n)) : state.tally;
  return { ...state, phase: 'done', result: { winner, blocked: wentOut === null, pips, bonus, gameOver }, tally, scores };
}

export const resetTally = (state: DominoesState): DominoesState => ({ ...state, tally: [...EMPTY_TALLY] });

// --- the opponents ---

/**
 * The play an opponent picks: in All Fives, a play that scores the most points first; then the fitting tile with the most pips (doubles first among equals, then
 * the higher number), on the end that leaves the most of its other tiles playable (the right end if even).
 */
export function choosePlay(state: DominoesState): Play | null {
  let plays = legalPlays(state);
  if (plays.length === 0) return null;
  // In All Fives the play that scores most comes first
  if (state.mode === 'fives') {
    const points = plays.map((p) => scoreOf(state, p.index, p.end));
    const best = Math.max(...points);
    if (best > 0) plays = plays.filter((_, i) => points[i] === best);
  }
  const hand = state.hands[state.turn];
  const tileIndex = plays
    .map((p) => p.index)
    .reduce((best, i) => {
      const x = hand[i];
      const y = hand[best];
      if (pipCount(x) !== pipCount(y)) return pipCount(x) > pipCount(y) ? i : best;
      if (isDouble(x) !== isDouble(y)) return isDouble(x) ? i : best;
      return x.b > y.b ? i : best;
    });
  const options = plays.filter((p) => p.index === tileIndex);
  if (options.length === 1) return options[0];
  const rest = hand.filter((_, i) => i !== tileIndex);
  const keeps = (end: End) => {
    const line = place(state.line, hand[tileIndex], end);
    const left = line[0].left;
    const right = line[line.length - 1].right;
    return rest.filter((t) => fits(t, left) || fits(t, right)).length;
  };
  return keeps('left') > keeps('right') ? { index: tileIndex, end: 'left' } : { index: tileIndex, end: 'right' };
}

/** A whole opponent turn: draw until a tile fits, then play the chosen tile, or pass. */
export function takeTurn(state: DominoesState): DominoesState {
  if (state.phase !== 'play') return state;
  let current = state;
  while (mustDraw(current)) current = draw(current)!;
  const choice = choosePlay(current);
  if (choice) return play(current, choice.index, choice.end)!;
  return pass(current) ?? current;
}
