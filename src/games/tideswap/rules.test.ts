import { describe, expect, it } from 'vitest';
import { seededRandom } from '../../util/random';
import { chooseSwaps, swapsFor } from './ai';
import {
  COLS,
  dropAt,
  exchange,
  fall,
  HEIGHT,
  land,
  level,
  MATCHES_PER_LEVEL,
  newTank,
  pebblesFor,
  preview,
  resolve,
  settleDrop,
  soloFallMs,
  SPAWN_Y,
  swap,
  versusFallMs,
  type Falling,
  type Item,
  type Pace,
  type Stacks,
  type Tank,
} from './rules';
import { deserialize, serialize, DEFAULTS } from './storage';

/** A tank with these stacks (bottom first) and these things falling. */
function tank(stacks: Item[][], falling: Omit<Falling, 'id'>[] = [], extra: Partial<Tank> = {}): Tank {
  return {
    ...newTank({ seed: 1 }),
    stacks: stacks as Stacks,
    falling: falling.map((f, i) => ({ id: 100 + i, ...f })),
    phase: 'falling',
    ...extra,
  };
}
const fill = (item: Item, n: number): Item[] => Array<Item>(n).fill(item);

describe('drops', () => {
  it('a new tank starts empty with its first drop above the columns', () => {
    const t = newTank({ seed: 3 });
    expect(t.stacks).toEqual([[], [], [], []]);
    expect(t.falling.length).toBeGreaterThanOrEqual(1);
    expect(t.falling.every((f) => f.y === SPAWN_Y)).toBe(true);
    expect(t.dealt).toBe(1);
  });

  it('brings one or two things, each in its own column, the same for the same seed', () => {
    const counts = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const d = dropAt(5, i);
      counts.add(d.length);
      expect(new Set(d.map((x) => x.col)).size).toBe(d.length);
    }
    expect([...counts].sort()).toEqual([1, 2]);
    expect(dropAt(42, 7)).toEqual(dropAt(42, 7));
    const seq = (s: number) => Array.from({ length: 20 }, (_, i) => dropAt(s, i));
    expect(seq(42)).not.toEqual(seq(43));
  });

  it('brings the four friends and, now and then, a clam shell half', () => {
    const items = new Map<string, number>();
    for (let i = 0; i < 1000; i++) for (const { item } of dropAt(9, i)) items.set(item, (items.get(item) ?? 0) + 1);
    expect([...items.keys()].sort()).toEqual(['bottom', 'manta', 'octo', 'star', 'top', 'turtle']);
    const shells = (items.get('bottom') ?? 0) + (items.get('top') ?? 0);
    const all = [...items.values()].reduce((a, b) => a + b, 0);
    expect(shells / all).toBeGreaterThan(0.1);
    expect(shells / all).toBeLessThan(0.22);
  });

  it('the preview is the next drop', () => {
    const t = newTank({ seed: 4 });
    const next = preview(t);
    const after = resolve(settleDrop(t));
    expect(after.falling.map(({ col, item }) => ({ col, item }))).toEqual(next);
  });
});

describe('falling and landing', () => {
  it('falls a slot each beat and lands once it rests on the stack', () => {
    let t = tank([['octo', 'star'], [], [], []], [{ col: 0, y: 4, item: 'manta' }]);
    t = fall(t);
    expect(t.falling[0].y).toBe(3);
    t = fall(t);
    expect(t.falling[0].y).toBe(2);
    expect(t.phase).toBe('falling');
    t = fall(t);
    expect(t.falling).toEqual([]);
    expect(t.stacks[0]).toEqual(['octo', 'star', 'manta']);
    expect(t.phase).toBe('resolving');
    expect(t.last).toMatchObject({ kind: 'land', landings: [{ col: 0, item: 'manta', result: 'stack' }] });
  });

  it('a friend landing on its twin: both swim away', () => {
    const t = settleDrop(tank([['octo', 'star'], [], [], []], [{ col: 0, y: 3, item: 'star' }]));
    expect(t.stacks[0]).toEqual(['octo']);
    expect(t.last).toMatchObject({ kind: 'land', landings: [{ result: 'match', points: 20 }] });
    expect(t.matches).toBe(1);
  });

  it('only the top friend counts', () => {
    expect(land(['star', 'octo'], 'star').result).toBe('stack');
  });

  it('two things in a drop land on their own beats', () => {
    let t = tank([fill('octo', 3), [], [], []], [{ col: 0, y: 4, item: 'star' }, { col: 2, y: 4, item: 'manta' }]);
    t = fall(fall(t));
    expect(t.last).toMatchObject({ kind: 'land', landings: [{ col: 0 }] });
    expect(t.falling.map((f) => f.col)).toEqual([2]);
  });
});

describe('swapping', () => {
  it('trades two neighboring stacks; falling things stay in their columns', () => {
    const t = swap(tank([['octo'], ['star', 'star'], [], []], [{ col: 0, y: 6, item: 'manta' }]), 0);
    expect(t.stacks).toEqual([['star', 'star'], ['octo'], [], []]);
    expect(t.falling[0]).toMatchObject({ col: 0, y: 6 });
    expect(t.last).toEqual({ kind: 'swap', at: 0 });
  });

  it('a stack swapped in higher than something falling lifts it onto its top', () => {
    let t = swap(tank([[], fill('turtle', 5), [], []], [{ col: 0, y: 2, item: 'turtle' }]), 0);
    expect(t.falling[0].y).toBe(5);
    t = fall(t);
    expect(t.last).toMatchObject({ kind: 'land', landings: [{ result: 'match' }] });
  });

  it('only the three gaps between columns swap', () => {
    const t = tank([['octo'], [], [], ['star']]);
    expect(swap(t, 3)).toBe(t);
    expect(swap(t, -1)).toBe(t);
    expect(swap(t, 2).stacks).toEqual([['octo'], [], ['star'], []]);
  });
});

describe('clam shells', () => {
  it('a bottom half lands like a friend', () => {
    expect(land(['octo'], 'bottom')).toMatchObject({ result: 'stack', stack: ['octo', 'bottom'] });
    expect(land(['bottom'], 'bottom').result).toBe('stack');
  });

  it('a top half closes everything down to the nearest bottom half into a pearl, with a bonus for each friend', () => {
    const t = settleDrop(tank([['star', 'bottom', 'octo', 'pebble', 'manta'], [], [], []], [{ col: 0, y: 6, item: 'top' }]));
    expect(t.stacks[0]).toEqual(['star']);
    expect(t.last).toMatchObject({ kind: 'land', landings: [{ result: 'clam', removed: 4, inside: 2, points: 50 + 2 * 40 }] });
    expect(land(['bottom', 'octo', 'bottom', 'star'], 'top')).toMatchObject({ stack: ['bottom', 'octo'], inside: 1 });
  });

  it('a top half straight onto a bottom half closes an empty clam', () => {
    expect(land(['octo', 'bottom'], 'top')).toMatchObject({ result: 'clam', stack: ['octo'], inside: 0 });
  });

  it('a top half with no bottom half below melts away', () => {
    expect(land(['octo', 'star'], 'top')).toMatchObject({ result: 'melt', stack: ['octo', 'star'] });
    expect(land([], 'top').result).toBe('melt');
  });
});

describe('the end', () => {
  it('ends when something would stack onto a full column', () => {
    const t = settleDrop(tank([fill('octo', HEIGHT), [], [], []], [{ col: 0, y: HEIGHT, item: 'star' }, { col: 2, y: HEIGHT, item: 'star' }]));
    expect(t.phase).toBe('over');
    expect(t.falling).toEqual([]);
    expect(t.last).toMatchObject({ landings: [{ result: 'over' }] });
  });

  it('a match, a clam or a melt on a full column is fine', () => {
    for (const item of ['octo', 'top'] as Item[]) {
      const full: Item[] = ['bottom', ...fill('star', HEIGHT - 2), 'octo'];
      const t = settleDrop(tank([full, [], [], []], [{ col: 0, y: HEIGHT, item }]));
      expect(t.phase).toBe('resolving');
    }
    expect(land(fill('star', HEIGHT), 'top').result).toBe('melt');
  });
});

describe('pebbles in Versus', () => {
  it('a clam sends one for each friend inside (at least one); two matches in a drop send one', () => {
    expect(pebblesFor(0, 1)).toBe(0);
    expect(pebblesFor(0, 2)).toBe(1);
    expect(pebblesFor(3, 2)).toBe(4);
    expect(pebblesFor(20, 0)).toBe(8);
    const clam = resolve(settleDrop(tank([['bottom', 'octo', 'star'], [], [], []], [{ col: 0, y: 5, item: 'top' }])));
    expect(clam.last).toMatchObject({ kind: 'settled', sent: 2 });
    const empty = resolve(settleDrop(tank([['bottom'], [], [], []], [{ col: 0, y: 5, item: 'top' }])));
    expect(empty.last).toMatchObject({ kind: 'settled', sent: 1 });
    const two = resolve(settleDrop(tank([['octo'], [], ['star'], []], [{ col: 0, y: 5, item: 'octo' }, { col: 2, y: 5, item: 'star' }])));
    expect(two.last).toMatchObject({ kind: 'settled', sent: 1 });
    const one = resolve(settleDrop(tank([['octo'], [], ['star'], []], [{ col: 0, y: 5, item: 'octo' }, { col: 2, y: 5, item: 'manta' }])));
    expect(one.last).toMatchObject({ kind: 'settled', sent: 0 });
  });

  it('first cancel pebbles waiting for you, and send the rest', () => {
    const t = resolve(settleDrop(tank([['bottom', 'octo', 'star', 'manta'], [], [], []], [{ col: 0, y: 6, item: 'top' }], { incoming: 1 })));
    expect(t.last).toMatchObject({ kind: 'settled', sent: 2, cancelled: 1 });
    expect([t.incoming, t.outgoing]).toEqual([0, 2]);
  });

  it('fall with your next drop, in the columns it leaves free; the rest wait', () => {
    const t = resolve(settleDrop(tank([[], [], [], []], [{ col: 0, y: 1, item: 'octo' }], { incoming: 5 })));
    const drop = dropAt(t.seed, t.dealt - 1);
    const pebbles = t.falling.filter((f) => f.item === 'pebble');
    expect(pebbles).toHaveLength(COLS - drop.length);
    expect(new Set(t.falling.map((f) => f.col)).size).toBe(t.falling.length);
    expect(t.incoming).toBe(5 - pebbles.length);
    expect(t.last).toMatchObject({ kind: 'settled', pebbles: pebbles.length });
  });

  it('two pebbles that meet leave like a match, but score and send nothing', () => {
    const t = settleDrop(tank([['octo', 'pebble'], ['star'], [], []], [{ col: 0, y: 4, item: 'pebble' }, { col: 1, y: 4, item: 'star' }]));
    expect(t.stacks[0]).toEqual(['octo']);
    expect(t.matches).toBe(1);
    expect(t.score).toBe(20);
    expect(resolve(t).last).toMatchObject({ sent: 0 });
  });

  it('exchange hands each tank the pebbles the other sent', () => {
    const a = { ...newTank({ seed: 1 }), outgoing: 3, incoming: 1 };
    const b = { ...newTank({ seed: 1 }), outgoing: 0, incoming: 2 };
    const [a2, b2] = exchange(a, b);
    expect([a2.incoming, a2.outgoing, b2.incoming, b2.outgoing]).toEqual([1, 0, 5, 0]);
  });
});

describe('levels and speed', () => {
  it('a Solo level is twenty matches', () => {
    const t = newTank({ seed: 1 });
    expect(level(t)).toBe(1);
    expect(level({ ...t, matches: MATCHES_PER_LEVEL })).toBe(2);
  });

  it('Solo starts at 520ms a slot and quickens each level; Versus follows the pace and quickens every 45 seconds', () => {
    expect(soloFallMs(1)).toBe(520);
    expect(soloFallMs(2)).toBe(468);
    expect(soloFallMs(50)).toBe(120);
    expect(['gentle', 'steady', 'quick'].map((p) => versusFallMs(p as Pace, 0))).toEqual([560, 420, 300]);
    expect(versusFallMs('steady', 45)).toBe(378);
  });
});

// --- the opponent ---

/** Taps the computer's swaps straight away, then lets the drop land. */
function autoplay(t0: Tank, pace: Pace, drops: number, random: () => number, pebbleEvery = 0) {
  let t = t0;
  let n = 0, sent = 0;
  while (t.phase !== 'over' && n < drops) {
    for (const at of chooseSwaps(t, pace, random)) t = swap(t, at);
    t = resolve(settleDrop(t));
    if (t.last?.kind === 'settled') sent += t.last.sent;
    n++;
    if (pebbleEvery && n % pebbleEvery === 0) t = { ...t, incoming: t.incoming + 1 };
  }
  return { t, n, sent };
}

describe('the opponent', () => {
  it('taps the swaps that put the stacks in the order it wants', () => {
    const orders = [[1, 0, 2, 3], [3, 2, 1, 0], [2, 0, 3, 1], [0, 1, 2, 3]];
    for (const order of orders) {
      let cols = [0, 1, 2, 3];
      for (const at of swapsFor(order)) [cols[at], cols[at + 1]] = [cols[at + 1], cols[at]];
      expect(cols).toEqual(order);
    }
    expect(swapsFor([0, 1, 2, 3])).toEqual([]);
  });

  it('moves a twin under a falling friend', () => {
    const t = tank([['octo'], ['star'], ['manta'], ['turtle']], [{ col: 0, y: 6, item: 'turtle' }]);
    let after = t;
    for (const at of chooseSwaps(t, 'quick', () => 0)) after = swap(after, at);
    expect(after.stacks[0]).toEqual(['turtle']);
  });

  it('closes a clam with friends inside rather than make a plain match', () => {
    const t = tank([['octo'], ['bottom', 'star', 'manta'], [], []], [{ col: 0, y: 6, item: 'top' }, { col: 2, y: 6, item: 'octo' }]);
    let after = t;
    for (const at of chooseSwaps(t, 'quick', () => 0)) after = swap(after, at);
    expect(after.stacks[0]).toEqual(['bottom', 'star', 'manta']);
  });

  it('a Quick computer keeps going a long time on its own, and much longer than a Gentle one', () => {
    const seeds = [1, 2, 3, 4, 5, 6];
    const lasted = (pace: Pace) => seeds.map((seed) => autoplay(newTank({ seed }), pace, 1000, seededRandom(seed)).n);
    const quick = lasted('quick'), gentle = lasted('gentle');
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    expect(avg(quick)).toBeGreaterThan(600);
    expect(avg(quick)).toBeGreaterThan(avg(gentle) * 2);
  });

  it('a Quick computer sends more pebbles in a game than a Gentle one', () => {
    const sent = (pace: Pace) => [1, 2, 3].reduce((n, seed) => n + autoplay(newTank({ seed }), pace, 400, seededRandom(seed)).sent, 0);
    expect(sent('quick')).toBeGreaterThan(sent('gentle') * 1.3);
  });
});

describe('storage', () => {
  it('round-trips the best score, tally and pace, and falls back to defaults', () => {
    const saved = { mode: 'versus' as const, best: 3120, tally: [2, 5] as [number, number], pace: 'gentle' as Pace, showTally: false };
    expect(deserialize(serialize(saved))).toEqual(saved);
    expect(deserialize(null)).toEqual(DEFAULTS);
  });
});
