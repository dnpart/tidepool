// Pond Hop rules as pure functions (PLAN.md "Game 6: Pond Hop"). Nothing here mutates its input.
// Our own marble race: a 40-hole track round a pond, lily pads that hop across it, and a home lane per player.
// Seats are numbered like Dominoes: 0 is you, 1 the first opponent, 2 the second. The rules never ask who is a computer.

export type Opponents = 1 | 2;

/** Holes on the track, numbered clockwise from the top. */
export const TRACK = 40;
/** Where each seat comes out: you on the left (30), the first opponent across from you (10), the second at the top (0). */
export const STARTS = [30, 10, 0] as const;
/** Lily pads, and the pad straight across the pond from each. */
export const PADS = [5, 15, 25, 35] as const;
export const HOP = 20;

/** A marble's progress: in its corner, on the track (0 is its start, 39 the hole before it), or in its lane (40–43). */
export const CORNER = -1;
export const LAST_TRACK = TRACK - 1;
export const LANE_FIRST = TRACK;
export const LANE_LAST = TRACK + 3;
export const MARBLES = 4;

export interface Capture {
  seat: number;
  marble: number;
}

export interface Move {
  /** Which of the seat's four marbles moves. */
  marble: number;
  from: number;
  to: number;
  /** Brought out of the corner onto the start. */
  out: boolean;
  /** Landed on a lily pad and hopped across the pond. */
  hop: boolean;
  /** Marbles sent back to their corners. */
  captures: Capture[];
}

/** What the last finished turn did, for the status line. `move` is null when the seat had no move. */
export interface LastTurn {
  seat: number;
  roll: number;
  move: Move | null;
}

export interface PondHopState {
  /** Four progress numbers per seat: two seats with one opponent, three with two. */
  marbles: number[][];
  /** The seat whose turn it is. */
  turn: number;
  /** The roll waiting to be used, or null before rolling. */
  rolled: number | null;
  last: LastTurn | null;
  phase: 'play' | 'done';
  winner: number | null;
  /** Games won by seat 0, 1 and 2. Kept when the number of opponents changes. */
  tally: number[];
}

export const EMPTY_TALLY: readonly number[] = [0, 0, 0];

// --- the board ---

/** The track hole a marble sits in, or null in its corner or lane. */
export function holeOf(seat: number, progress: number): number | null {
  if (progress < 0 || progress > LAST_TRACK) return null;
  return (STARTS[seat] + progress) % TRACK;
}

export const isPad = (hole: number): boolean => (PADS as readonly number[]).includes(hole);

export const isHome = (progress: number): boolean => progress >= LANE_FIRST;

/** Marbles in the lane, for the opponent cards. */
export const homeCount = (marbles: readonly number[]): number => marbles.filter(isHome).length;

/** A die roll, 1 to 6. */
export const rollDie = (random: () => number = Math.random): number => 1 + Math.floor(random() * 6);

// --- a game ---

export function newGame(
  opponents: Opponents,
  tally: readonly number[] = EMPTY_TALLY,
): PondHopState {
  return {
    marbles: Array.from({ length: opponents + 1 }, () => Array<number>(MARBLES).fill(CORNER)),
    turn: 0,
    rolled: null,
    last: null,
    phase: 'play',
    winner: null,
    tally: [...tally],
  };
}

/** Rolls for the seat whose turn it is. Null if it already rolled or the game is over. */
export function roll(state: PondHopState, value: number): PondHopState | null {
  if (state.phase !== 'play' || state.rolled !== null || value < 1 || value > 6) return null;
  return { ...state, rolled: value };
}

/** Other players' marbles in a track hole (at most one, since landing on a marble sends it home). */
function capturesAt(state: PondHopState, seat: number, hole: number): Capture[] {
  const found: Capture[] = [];
  state.marbles.forEach((own, other) => {
    if (other === seat) return;
    own.forEach((p, marble) => {
      if (holeOf(other, p) === hole) found.push({ seat: other, marble });
    });
  });
  return found;
}

/** Every move the seat whose turn it is can make with its roll. */
export function legalMoves(state: PondHopState): Move[] {
  const r = state.rolled;
  if (state.phase !== 'play' || r === null) return [];
  const seat = state.turn;
  const own = state.marbles[seat];
  const taken = (progress: number) => own.includes(progress);
  const moves: Move[] = [];

  // Bring one marble out on a 1 or a 6 (the corner marbles are all alike, so one move covers them)
  const waiting = own.indexOf(CORNER);
  if ((r === 1 || r === 6) && waiting >= 0 && !taken(0)) {
    moves.push({ marble: waiting, from: CORNER, to: 0, out: true, hop: false, captures: capturesAt(state, seat, STARTS[seat]) });
  }

  own.forEach((from, marble) => {
    if (from === CORNER) return;
    const to = from + r;
    // Exact rolls into the lane: no overshooting, and never onto your own marble
    if (to > LANE_LAST || taken(to)) return;
    if (isHome(to)) {
      moves.push({ marble, from, to, out: false, hop: false, captures: [] });
      return;
    }
    const hole = holeOf(seat, to)!;
    const landed = capturesAt(state, seat, hole);
    moves.push({ marble, from, to, out: false, hop: false, captures: landed });
    // A lily pad may hop across the pond, as long as it stays short of the lane entry
    const across = to + HOP;
    if (isPad(hole) && across <= LAST_TRACK && !taken(across)) {
      const far = capturesAt(state, seat, holeOf(seat, across)!);
      moves.push({ marble, from, to: across, out: false, hop: true, captures: [...landed, ...far] });
    }
  });
  return moves;
}

const sameMove = (a: Move, b: Move) => a.marble === b.marble && a.to === b.to && a.hop === b.hop;

/** Ends the turn: a 6 rolls again, otherwise the next seat goes. */
function endTurn(state: PondHopState, move: Move | null): PondHopState {
  const roll = state.rolled!;
  return {
    ...state,
    turn: roll === 6 ? state.turn : (state.turn + 1) % state.marbles.length,
    rolled: null,
    last: { seat: state.turn, roll, move },
  };
}

/** Makes one of the legal moves for the seat whose turn it is. Null if it isn't one. */
export function move(state: PondHopState, chosen: Move): PondHopState | null {
  const found = legalMoves(state).find((m) => sameMove(m, chosen));
  if (!found) return null;
  const seat = state.turn;
  const marbles = state.marbles.map((own, s) =>
    own.map((p, i) => {
      if (s === seat && i === found.marble) return found.to;
      return found.captures.some((c) => c.seat === s && c.marble === i) ? CORNER : p;
    }),
  );
  const next = endTurn({ ...state, marbles }, found);
  if (marbles[seat].every(isHome)) {
    return {
      ...next,
      turn: seat,
      phase: 'done',
      winner: seat,
      tally: state.tally.map((n, s) => (s === seat ? n + 1 : n)),
    };
  }
  return next;
}

/** Passes when the roll has no move. A 6 still rolls again. */
export function pass(state: PondHopState): PondHopState | null {
  if (state.phase !== 'play' || state.rolled === null || legalMoves(state).length > 0) return null;
  return endTurn(state, null);
}

export const resetTally = (state: PondHopState): PondHopState => ({ ...state, tally: [...EMPTY_TALLY] });

// --- the opponents ---

/**
 * The move an opponent picks, in order: one that sends someone home (the most marbles, then the furthest along), bringing
 * a marble out, a lily pad hop, a move into the lane, otherwise the marble furthest behind.
 */
export function chooseMove(state: PondHopState): Move | null {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;
  const behindFirst = [...moves].sort((a, b) => a.from - b.from);
  const capture = [...moves]
    .filter((m) => m.captures.length > 0)
    .sort((a, b) => b.captures.length - a.captures.length || b.to - a.to)[0];
  return (
    capture ??
    moves.find((m) => m.out) ??
    behindFirst.find((m) => m.hop) ??
    behindFirst.find((m) => !isHome(m.from) && isHome(m.to)) ??
    behindFirst[0]
  );
}

/** A whole opponent turn with a given roll: roll, then move or pass. A 6 leaves the turn with them to roll again. */
export function takeTurn(state: PondHopState, value: number): PondHopState {
  const rolled = roll(state, value);
  if (!rolled) return state;
  const choice = chooseMove(rolled);
  return choice ? move(rolled, choice)! : pass(rolled)!;
}
