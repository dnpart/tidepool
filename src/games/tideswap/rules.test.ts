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
  pearlsFor,
  SHELLS,
  startStacks,
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

  it('something that has come down inside its column, below the top of the stack swapped in, moves with its column', () => {
    // The octopus is falling in column 0 at slot 2, below the top of the five turtles next door: it goes with column 0
    let t = swap(tank([['star'], fill('turtle', 5), [], []], [{ col: 0, y: 2, item: 'octo' }]), 0);
    expect(t.stacks).toEqual([fill('turtle', 5), ['star'], [], []]);
    expect(t.falling[0]).toMatchObject({ col: 1, y: 2 });
    t = fall(fall(t));
    expect(t.stacks[1]).toEqual(['star', 'octo']);
  });

  it('something falling higher than both stacks stays in its lane, over the stack swapped in', () => {
    const t = swap(tank([['star'], fill('turtle', 5), [], []], [{ col: 0, y: 5, item: 'turtle' }]), 0);
    expect(t.falling[0]).toMatchObject({ col: 0, y: 5 });
    expect(fall(t).last).toMatchObject({ kind: 'land', landings: [{ col: 0, result: 'match' }] });
  });

  it('random swapping never puts two falling things in one lane', () => {
    const random = seededRandom(11);
    let t = newTank({ seed: 11 });
    for (let beat = 0; beat < 3000 && t.phase !== 'over'; beat++) {
      if (random() < 0.6) t = swap(t, Math.floor(random() * 3));
      const cols = t.falling.map((f) => f.col);
      expect(new Set(cols).size).toBe(cols.length);
      for (const f of t.falling) expect(f.y).toBeGreaterThanOrEqual(t.stacks[f.col].length);
      t = t.phase === 'resolving' ? resolve(t) : fall(t);
    }
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
    expect(land([], 'bottom')).toMatchObject({ result: 'stack', stack: ['bottom'] });
  });

  it('two bottom halves that meet both wash away, with no points, no pearl and no match', () => {
    expect(land(['octo', 'bottom'], 'bottom')).toMatchObject({ result: 'match', stack: ['octo'], removed: 1 });
    // Solo: it leaves the pearls (and score) where they were, and the level isn't won by it
    const t = settleDrop(tank([['bottom'], ['star'], [], []], [{ col: 0, y: 1, item: 'bottom' }], { stage: 1, pearls: 3 }));
    expect(t.stacks[0]).toEqual([]);
    expect(t.last).toMatchObject({ kind: 'land', landings: [{ result: 'match', item: 'bottom', points: 0 }] });
    expect(t).toMatchObject({ pearls: 3, score: 0, matches: 0, dropMatches: 0 });
    expect(resolve(t).phase).toBe('falling');
  });

  it('two bottom pairs in one drop send no pebbles in Versus', () => {
    const t = resolve(settleDrop(tank([['bottom'], ['bottom'], [], []], [{ col: 0, y: 1, item: 'bottom' }, { col: 1, y: 1, item: 'bottom' }])));
    expect(t.outgoing).toBe(0);
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

describe('Solo levels', () => {
  it('start with a bottom shell in each column, and one more shell (over a friend) for each pearl past four', () => {
    expect(startStacks(3, 1)).toEqual([['bottom'], ['bottom'], ['bottom'], ['bottom']]);
    const s3 = startStacks(3, 3);
    expect(s3.flat().filter((x) => x === 'bottom')).toHaveLength(pearlsFor(3));
    for (const stack of s3) {
      expect(stack[0]).toBe('bottom');
      stack.forEach((item, i) => expect(item === 'bottom').toBe(i % 2 === 0));
    }
    expect(Math.max(...startStacks(9, 20).map((s) => s.length))).toBeLessThanOrEqual(5);
    expect(startStacks(4, 6)).toEqual(startStacks(4, 6));
  });

  it('ask for four pearls on level 1, one more each level, up to twelve', () => {
    expect([1, 2, 3, 9, 10, 30].map(pearlsFor)).toEqual([4, 5, 6, 12, 12, 12]);
  });

  it('a new Solo tank knows its level, carries the run\'s score, and has nothing falling but its first drop', () => {
    const t = newTank({ seed: 2, stage: 4, score: 500 });
    expect(level(t)).toBe(4);
    expect(t.score).toBe(500);
    expect(t.pearls).toBe(0);
    expect(level(newTank({ seed: 2 }))).toBe(1);
  });

  it('bring more top shells and fewer bottoms than Versus', () => {
    const count = (mode: 'solo' | 'versus', item: Item) =>
      Array.from({ length: 3000 }, (_, i) => dropAt(7, i, mode)).flat().filter((d) => d.item === item).length;
    expect(count('solo', 'top')).toBeGreaterThan(count('versus', 'top') * 1.3);
    expect(count('solo', 'bottom')).toBeLessThan(count('versus', 'bottom') * 0.7);
    expect(SHELLS.solo.top).toBeGreaterThan(SHELLS.solo.bottom);
  });

  it('are won once the drop with the last pearl has landed', () => {
    let t = tank([['bottom', 'octo'], ['bottom'], [], []], [{ col: 0, y: 2, item: 'top' }, { col: 1, y: 2, item: 'top' }], { stage: 1, pearls: 2 });
    t = settleDrop(t);
    expect(t.pearls).toBe(4);
    t = resolve(t);
    expect(t.phase).toBe('cleared');
    expect(t.last).toEqual({ kind: 'cleared' });
    expect(swap(t, 0)).toBe(t);
  });

  it('go on until then, and Versus never ends that way', () => {
    const solo = resolve(settleDrop(tank([['bottom'], [], [], []], [{ col: 0, y: 1, item: 'top' }], { stage: 1, pearls: 0 })));
    expect(solo.phase).toBe('falling');
    const versus = resolve(settleDrop(tank([['bottom'], [], [], []], [{ col: 0, y: 1, item: 'top' }], { pearls: 10 })));
    expect(versus.phase).toBe('falling');
  });
});

describe('speed', () => {
  it('Solo starts at 520ms a slot and quickens gradually each level; Versus follows the pace and quickens every 45 seconds', () => {
    expect(soloFallMs(1)).toBe(520);
    expect(soloFallMs(2)).toBe(489);
    expect(soloFallMs(5)).toBe(406);
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

  it('keeps a falling bottom shell off another bottom shell when it can', () => {
    const t = tank([['bottom'], ['octo'], ['star'], ['manta']], [{ col: 0, y: 6, item: 'bottom' }]);
    let after = t;
    for (const at of chooseSwaps(t, 'quick', () => 0)) after = swap(after, at);
    expect(after.stacks[0]).not.toEqual(['bottom']);
  });

  it('closes a clam with friends inside rather than make a plain match', () => {
    const t = tank([['octo'], ['bottom', 'star', 'manta'], [], []], [{ col: 0, y: 6, item: 'top' }, { col: 2, y: 6, item: 'octo' }]);
    let after = t;
    for (const at of chooseSwaps(t, 'quick', () => 0)) after = swap(after, at);
    expect(after.stacks[0]).toEqual(['bottom', 'star', 'manta']);
  });

  // With a pebble coming every third drop: on its own, even Gentle now lasts nearly 1,000 drops, since two bottom
  // shells that meet wash away instead of clogging a column
  it('a Quick computer keeps going a long time under pebbles, and much longer than a Gentle one', () => {
    const seeds = [1, 2, 3, 4, 5, 6];
    const lasted = (pace: Pace) => seeds.map((seed) => autoplay(newTank({ seed }), pace, 1000, seededRandom(seed), 3).n);
    const quick = lasted('quick'), gentle = lasted('gentle');
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    expect(avg(quick)).toBeGreaterThan(600);
    expect(avg(quick)).toBeGreaterThan(avg(gentle) * 2);
  });

  it('a Quick computer sends more pebbles in a game than a Gentle one', () => {
    const sent = (pace: Pace) => [1, 2, 3].reduce((n, seed) => n + autoplay(newTank({ seed }), pace, 400, seededRandom(seed), 3).sent, 0);
    expect(sent('quick')).toBeGreaterThan(sent('gentle') * 1.3);
  });
});

describe('storage', () => {
  it('round-trips the best score, tally and pace, and falls back to defaults', () => {
    const saved = { mode: 'versus' as const, best: 3120, tally: [2, 5] as [number, number], pace: 'gentle' as Pace, showTally: false, bestLevel: 6 };
    expect(deserialize(serialize(saved))).toEqual(saved);
    expect(deserialize(null)).toEqual(DEFAULTS);
    expect(deserialize('{"v":1,"m":"solo","b":40}')).toEqual({ ...DEFAULTS, best: 40 });
  });
});
