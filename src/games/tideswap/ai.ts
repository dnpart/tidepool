// The Tide Swap opponent: which order to swap its four stacks into for the drop that's falling, and the swaps that get
// there. It only looks at its own tank, as a person would. The pace sets how carefully it chooses; the screen sets how
// fast it taps.
import { COLS, HEIGHT, isPal, land, type Item, type Pace, type Tank } from './rules';

/** `order[c]` is the column whose stack should end up in column c. */
export type Order = number[];

const ALL_ORDERS: Order[] = (() => {
  const out: Order[] = [];
  const go = (rest: number[], acc: number[]) => {
    if (!rest.length) out.push(acc);
    rest.forEach((x, i) => go([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, x]));
  };
  go([0, 1, 2, 3], []);
  return out;
})();

/** The neighbor swaps that turn the columns into `order`, in the order to tap them (a bubble sort). */
export function swapsFor(order: Order): number[] {
  const a = [...order];
  const taps: number[] = [];
  for (let pass = 0; pass < COLS; pass++) {
    for (let i = 0; i < COLS - 1; i++) {
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        taps.push(i);
      }
    }
  }
  // The taps sort `order` back to 0..3; done in reverse, they take 0..3 to `order`
  return taps.reverse();
}

interface Weights {
  match: number;
  clam: number;
  inside: number;
  melt: number;
  /** For covering a friend with something else (it can't be matched until uncovered). */
  cover: number;
  /** Per tap needed: taps take time, and the drop may land first. */
  tap: number;
  height: number;
  /** Per different friend on top of the stacks: more kinds showing, more chances of a twin next time. */
  variety: number;
}

const WEIGHTS: Record<Pace, Weights> = {
  gentle: { match: 100, clam: 60, inside: 20, melt: -10, cover: 0, tap: -40, height: 1, variety: 0 },
  steady: { match: 100, clam: 160, inside: 90, melt: -30, cover: -10, tap: -12, height: 3, variety: 15 },
  quick: { match: 100, clam: 200, inside: 120, melt: -40, cover: -14, tap: -6, height: 3, variety: 25 },
};

/** How good it would be for this drop to land with the stacks in `order`. */
export function score(tank: Tank, order: Order, pace: Pace): number {
  const w = WEIGHTS[pace];
  const stacks = order.map((c) => [...tank.stacks[c]]);
  let value = swapsFor(order).length * w.tap;
  for (const f of tank.falling) {
    const stack = stacks[f.col];
    const top: Item | undefined = stack[stack.length - 1];
    const after = land(stack, f.item);
    if (after.result === 'over') return -1_000_000;
    if (after.result === 'match') value += f.item === 'pebble' ? w.match * 0.7 : w.match;
    else if (after.result === 'clam') value += w.clam + after.inside * w.inside;
    else if (after.result === 'melt') value += w.melt;
    else if (top !== undefined && isPal(top)) value += w.cover;
    stacks[f.col] = after.stack;
  }
  for (const s of stacks) {
    value -= s.length * s.length * w.height;
    if (s.length >= HEIGHT - 1) value -= 400;
  }
  const tops = new Set(stacks.map((s) => s[s.length - 1]).filter((x) => x !== undefined && isPal(x)));
  return value + tops.size * w.variety;
}

/**
 * The taps to make for the drop that's falling. Quick picks the best order; Steady usually does; Gentle often settles
 * for something nearby.
 */
export function chooseSwaps(tank: Tank, pace: Pace, random: () => number = Math.random): number[] {
  const ranked = ALL_ORDERS.map((order) => ({ order, v: score(tank, order, pace) })).sort((a, b) => b.v - a.v);
  const safe = ranked.filter((r) => r.v > -1_000_000);
  const pool = safe.length ? safe : ranked;
  const reach = pace === 'quick' ? 1 : pace === 'steady' ? (random() < 0.75 ? 1 : 2) : random() < 0.35 ? 1 : 6;
  return swapsFor(pool[Math.floor(random() * Math.min(reach, pool.length))].order);
}
