// Tide Swap rules as pure functions (PLAN.md "Game 10: Tide Swap"): our own column-swapping game in the family of
// Yoshi. Friends drift down into four columns; you don't steer them, you swap neighboring stacks underneath so each one
// lands on its twin. Nothing here mutates its input, and nothing here knows about time: the screen calls `fall` on its
// own timer (everything falling moves down a slot) and `resolve` once the whole drop has landed. One `Tank` is one
// player's side; Versus is two tanks passing pebbles with `exchange`, so either side could later be a person on
// another phone.
import { seededRandom } from '../../util/random';
import type { Pace } from '../falling/speed';

export const COLS = 4;
/** A column holds 8; something that would stack onto a full column ends the game. */
export const HEIGHT = 8;
/** Where a drop starts: the slot above the top of the tank (slot 0 is the floor). */
export const SPAWN_Y = HEIGHT;
/** Chance a drop brings two friends rather than one. */
export const TWO_CHANCE = 0.6;
/** Chance each falling thing is a clam shell half (split evenly between bottoms and tops). */
export const SHELL_CHANCE = 0.16;
/** Matches (friend pairs and clams closed) for each Solo level. */
export const MATCHES_PER_LEVEL = 20;
/** Points: a match, and a closed clam plus a bonus for each friend inside. */
export const MATCH_POINTS = 20;
export const CLAM_POINTS = 50;
export const CLAM_FRIEND_POINTS = 40;
/** Most pebbles one drop can send. */
export const MAX_SENT = 8;

export const KINDS = ['octo', 'manta', 'star', 'turtle'] as const;
export type Pal = (typeof KINDS)[number];
/** What can sit in a column: a friend, the bottom or top half of a clam shell, or a pebble (Versus). */
export type Item = Pal | 'bottom' | 'top' | 'pebble';
/** Each column's stack, bottom first. */
export type Stacks = Item[][];

export interface Falling {
  /** Stays the same for the whole fall, so the screen can follow it. */
  id: number;
  col: number;
  /** The slot it's in: 0 is the floor; it lands once it rests on its column's stack. */
  y: number;
  item: Item;
}

/** What one falling thing did when it landed. */
export type LandResult =
  /** Joined the stack. */
  | 'stack'
  /** Landed on its twin (or a pebble on a pebble): both left. */
  | 'match'
  /** A top half closed a clam: it, its bottom half and everything between left. */
  | 'clam'
  /** A top half with no bottom half below it melted away. */
  | 'melt'
  /** Would have stacked onto a full column: the game is over. */
  | 'over';

export interface Landing {
  id: number;
  col: number;
  item: Item;
  result: LandResult;
  /** How many things left the stack (the twin; for a clam, the bottom half and everything above it). */
  removed: number;
  /** Friends closed inside a clam. */
  inside: number;
  points: number;
}

export type TankEvent =
  | { kind: 'land'; landings: Landing[] }
  | { kind: 'swap'; at: number }
  /** The drop is over: pebbles sent and cancelled, pebbles in the new drop, and the next drop is coming. */
  | { kind: 'settled'; sent: number; cancelled: number; pebbles: number }
  | null;

export interface Tank {
  stacks: Stacks;
  falling: Falling[];
  /** 'falling': a drop is coming down. 'resolving': it has all landed; call `resolve` for the next. */
  phase: 'falling' | 'resolving' | 'over';
  /** The drop sequence: two tanks with the same seed get the same drops, which keeps Versus fair. */
  seed: number;
  /** Drops dealt so far. */
  dealt: number;
  nextId: number;
  score: number;
  /** Friend pairs matched and clams closed this game. */
  matches: number;
  /** In the drop now falling: friend matches, and pebbles earned by clams. */
  dropMatches: number;
  dropPebbles: number;
  /** Pebbles waiting to join this tank's drops. */
  incoming: number;
  /** Pebbles this tank has sent and the other tank hasn't taken yet (`exchange`). */
  outgoing: number;
  last: TankEvent;
}

export const isPal = (item: Item): item is Pal => (KINDS as readonly string[]).includes(item);

// --- what landing does ---

/** What `item` does landing on top of `stack`, and the stack after. Pure, so the opponent can look ahead with it. */
export function land(stack: readonly Item[], item: Item): { result: LandResult; stack: Item[]; removed: number; inside: number } {
  const top = stack[stack.length - 1];
  if (item === 'top') {
    const bottom = stack.lastIndexOf('bottom');
    if (bottom < 0) return { result: 'melt', stack: [...stack], removed: 0, inside: 0 };
    const closed = stack.slice(bottom + 1);
    return { result: 'clam', stack: stack.slice(0, bottom), removed: closed.length + 1, inside: closed.filter(isPal).length };
  }
  if (top !== undefined && top === item && item !== 'bottom') {
    return { result: 'match', stack: stack.slice(0, -1), removed: 1, inside: 0 };
  }
  if (stack.length >= HEIGHT) return { result: 'over', stack: [...stack], removed: 0, inside: 0 };
  return { result: 'stack', stack: [...stack, item], removed: 0, inside: 0 };
}

export function pointsFor(result: LandResult, item: Item, inside: number): number {
  if (result === 'match') return item === 'pebble' ? 0 : MATCH_POINTS;
  if (result === 'clam') return CLAM_POINTS + inside * CLAM_FRIEND_POINTS;
  return 0;
}

/** Pebbles a finished drop sends: one for each friend closed in a clam (at least one a clam), one for two matches. */
export const pebblesFor = (clamPebbles: number, friendMatches: number): number =>
  Math.min(MAX_SENT, clamPebbles + Math.floor(friendMatches / 2));

// --- drops ---

/** The friends (and shell halves) in drop `index` for this seed, each in its own column. */
export function dropAt(seed: number, index: number): { col: number; item: Item }[] {
  const random = seededRandom((seed + Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const count = random() < TWO_CHANCE ? 2 : 1;
  const cols = [0, 1, 2, 3];
  for (let i = cols.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cols[i], cols[j]] = [cols[j], cols[i]];
  }
  return cols.slice(0, count).sort((a, b) => a - b).map((col) => {
    const r = random();
    const item: Item = r < SHELL_CHANCE / 2 ? 'bottom' : r < SHELL_CHANCE ? 'top' : KINDS[Math.floor(random() * KINDS.length)];
    return { col, item };
  });
}

export const level = (tank: Tank): number => 1 + Math.floor(tank.matches / MATCHES_PER_LEVEL);

/** What the next drop will bring (pebbles aside), for the preview. */
export const preview = (tank: Tank): { col: number; item: Item }[] => dropAt(tank.seed, tank.dealt);

/** Brings the next drop in above the tank, with any waiting pebbles in the columns it leaves free. */
function spawn(tank: Tank): Tank {
  const drop = dropAt(tank.seed, tank.dealt);
  const free = [0, 1, 2, 3].filter((c) => !drop.some((d) => d.col === c));
  const pebbles = Math.min(tank.incoming, free.length);
  const random = seededRandom(((tank.seed ^ 0x5bd1e995) + Math.imul(tank.dealt, 7919)) >>> 0);
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [free[i], free[j]] = [free[j], free[i]];
  }
  const items = [...drop, ...free.slice(0, pebbles).map((col) => ({ col, item: 'pebble' as Item }))].sort((a, b) => a.col - b.col);
  let id = tank.nextId;
  return {
    ...tank,
    falling: items.map(({ col, item }) => ({ id: id++, col, y: SPAWN_Y, item })),
    phase: 'falling',
    dealt: tank.dealt + 1,
    nextId: id,
    incoming: tank.incoming - pebbles,
    dropMatches: 0,
    dropPebbles: 0,
  };
}

export function newTank(opts: { seed: number }): Tank {
  return spawn({
    stacks: [[], [], [], []],
    falling: [],
    phase: 'falling',
    seed: opts.seed >>> 0,
    dealt: 0,
    nextId: 1,
    score: 0,
    matches: 0,
    dropMatches: 0,
    dropPebbles: 0,
    incoming: 0,
    outgoing: 0,
    last: null,
  });
}

// --- playing ---

/**
 * Trades the stacks in columns `at` and `at + 1`. Falling things stay in their columns; one that the new stack now
 * reaches up to rests on top of it (and lands on the next beat).
 */
export function swap(tank: Tank, at: number): Tank {
  if (tank.phase === 'over' || at < 0 || at >= COLS - 1) return tank;
  const stacks = [...tank.stacks];
  [stacks[at], stacks[at + 1]] = [stacks[at + 1], stacks[at]];
  const falling = tank.falling.map((f) => (f.y < stacks[f.col].length ? { ...f, y: stacks[f.col].length } : f));
  return { ...tank, stacks, falling, last: { kind: 'swap', at } };
}

/**
 * One beat, on the screen's timer: everything falling moves down a slot, and whatever is already resting on its
 * stack lands (a match, a clam, a melt, or onto the stack). Once the whole drop is down the tank is 'resolving'.
 */
export function fall(tank: Tank): Tank {
  if (tank.phase !== 'falling') return tank;
  const stacks = [...tank.stacks];
  const falling: Falling[] = [];
  const landings: Landing[] = [];
  let { score, matches, dropMatches, dropPebbles } = tank;
  let over = false;
  for (const f of tank.falling) {
    if (f.y > stacks[f.col].length) {
      falling.push({ ...f, y: f.y - 1 });
      continue;
    }
    const after = land(stacks[f.col], f.item);
    const points = pointsFor(after.result, f.item, after.inside);
    landings.push({ id: f.id, col: f.col, item: f.item, result: after.result, removed: after.removed, inside: after.inside, points });
    stacks[f.col] = after.stack;
    score += points;
    if (after.result === 'over') over = true;
    if (after.result === 'match' && f.item !== 'pebble') { matches++; dropMatches++; }
    if (after.result === 'clam') { matches++; dropPebbles += Math.max(1, after.inside); }
  }
  const last: TankEvent = landings.length ? { kind: 'land', landings } : null;
  const phase = over ? 'over' : falling.length ? 'falling' : 'resolving';
  return { ...tank, stacks, falling: over ? [] : falling, phase, score, matches, dropMatches, dropPebbles, last };
}

/** Lets the whole drop fall and land at once (the opponent's look-ahead, and tests). */
export function settleDrop(tank: Tank): Tank {
  let t = tank;
  while (t.phase === 'falling') t = fall(t);
  return t;
}

/**
 * After a drop has landed: its pebbles go out (first cancelling pebbles waiting here) and the next drop comes, with
 * any pebbles still waiting in the columns it leaves free.
 */
export function resolve(tank: Tank): Tank {
  if (tank.phase !== 'resolving') return tank;
  const attack = pebblesFor(tank.dropPebbles, tank.dropMatches);
  const cancelled = Math.min(attack, tank.incoming);
  const settled = { ...tank, incoming: tank.incoming - cancelled, outgoing: tank.outgoing + attack - cancelled };
  const next = spawn(settled);
  const pebbles = next.falling.filter((f) => f.item === 'pebble').length;
  return { ...next, last: { kind: 'settled', sent: attack - cancelled, cancelled, pebbles } };
}

/** Versus: each tank's sent pebbles join the other's waiting pebbles. */
export function exchange(a: Tank, b: Tank): [Tank, Tank] {
  if (!a.outgoing && !b.outgoing) return [a, b];
  return [
    { ...a, outgoing: 0, incoming: a.incoming + b.outgoing },
    { ...b, outgoing: 0, incoming: b.incoming + a.outgoing },
  ];
}

// --- speed ---

export { PACES, type Pace } from '../falling/speed';

/** Milliseconds a slot in Solo: 520 at level 1, a little quicker each level, never under 120. */
export const soloFallMs = (lvl: number): number => Math.max(120, Math.round(520 * 0.9 ** (lvl - 1)));

const VERSUS_START: Record<Pace, number> = { gentle: 560, steady: 420, quick: 300 };
/** Milliseconds a slot in Versus: set by the pace, and a little quicker every 45 seconds so a game always ends. */
export const versusFallMs = (pace: Pace, seconds: number): number =>
  Math.max(110, Math.round(VERSUS_START[pace] * 0.9 ** Math.floor(seconds / 45)));
