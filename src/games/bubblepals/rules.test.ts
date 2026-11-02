import { describe, expect, it } from 'vitest';
import { seededRandom } from '../../util/random';
import { choosePlacement, nextPress, placements } from './ai';
import {
  clamsFor,
  COLS,
  drop,
  emptyBoard,
  exchange,
  fall,
  findGroups,
  gravity,
  landing,
  move,
  newTank,
  pairAt,
  PEARL_EVERY,
  pieceCells,
  preview,
  resolve,
  ROWS,
  simulate,
  soloFallMs,
  SPAWN_COL,
  turn,
  versusFallMs,
  type Board,
  type Cell,
  type Pace,
  type Tank,
} from './rules';
import { deserialize, serialize, DEFAULTS } from './storage';

const LETTERS: Record<string, Cell> = { o: 'octo', m: 'manta', s: 'star', t: 'turtle', j: 'jelly', c: 'clam', p: 'pearl', '.': null };

/** A board from rows of letters, the last row at the bottom of the tank. */
function board(rows: string[]): Board {
  const b = emptyBoard();
  rows.forEach((row, i) => [...row].forEach((ch, c) => { b[ROWS - rows.length + i][c] = LETTERS[ch]; }));
  return b;
}
/** The bottom rows of a board, as letters. */
function rowsOf(b: Board, n: number): string[] {
  const back = Object.fromEntries(Object.entries(LETTERS).map(([k, v]) => [v, k]));
  return b.slice(ROWS - n).map((row) => row.map((cell) => back[String(cell)] ?? '.').join(''));
}
const withBoard = (rows: string[], extra: Partial<Tank> = {}): Tank => ({ ...newTank({ seed: 1 }), board: board(rows), ...extra });
const pairTank = (rows: string[], pivot: Cell, other: Cell, at: Partial<{ row: number; col: number; turn: 0 | 1 | 2 | 3 }> = {}): Tank =>
  withBoard(rows, { piece: { type: 'pair', pivot: pivot as never, other: other as never, row: 1, col: SPAWN_COL, turn: 0, ...at } });
const settle = (t: Tank): Tank => {
  let s = t;
  while (s.phase === 'resolving') s = resolve(s);
  return s;
};

describe('a new tank', () => {
  it('starts with a pair in the third column, the second friend above in the hidden row', () => {
    const t = newTank({ seed: 7 });
    expect(t.phase).toBe('falling');
    expect(t.piece).toMatchObject({ type: 'pair', row: 1, col: SPAWN_COL, turn: 0 });
    expect(pieceCells(t.piece!).map(({ row, col }) => [row, col])).toEqual([[1, 2], [0, 2]]);
    expect(t.dealt).toBe(1);
  });

  it('deals the same pairs for the same seed, so both sides of Versus get the same pieces', () => {
    const a = newTank({ seed: 42 }), b = newTank({ seed: 42 });
    expect(a.piece).toEqual(b.piece);
    expect(preview(a)).toEqual(preview(b));
    const seq = (s: number) => Array.from({ length: 20 }, (_, i) => pairAt(s, i, 4));
    expect(seq(42)).toEqual(seq(42));
    expect(seq(42)).not.toEqual(seq(43));
  });

  it('uses four kinds of friend, and the jellyfish joins at the set level', () => {
    const kinds = new Set(Array.from({ length: 200 }, (_, i) => Object.values(pairAt(3, i, 4))).flat());
    expect([...kinds].sort()).toEqual(['manta', 'octo', 'star', 'turtle']);
    const later = { ...newTank({ seed: 3, fifthAt: 5 }), popped: 4 * 30 };
    const seen = new Set<string>();
    let t = later;
    for (let i = 0; i < 60; i++) {
      const p = preview(t);
      if (p.type === 'pair') { seen.add(p.pivot); seen.add(p.other); }
      t = { ...t, dealt: t.dealt + 1 };
    }
    expect(seen.has('jelly')).toBe(true);
  });
});

describe('moving and turning', () => {
  it('slides left and right, not through walls or friends', () => {
    let t = pairTank([], 'octo', 'star');
    t = move(move(move(t, -1), -1), -1);
    expect(t.piece!.col).toBe(0);
    expect(move(t, -1)).toBe(t);
    const blocked = pairTank(['.o....'], 'octo', 'star', { row: 12, col: 2 });
    expect(move(blocked, -1)).toBe(blocked);
  });

  it('turns round the first friend: above, right, below, left', () => {
    let t = pairTank([], 'octo', 'star', { row: 5 });
    const offsets = [];
    for (let i = 0; i < 4; i++) {
      t = turn(t);
      const [a, b] = pieceCells(t.piece!);
      offsets.push([b.row - a.row, b.col - a.col]);
    }
    expect(offsets).toEqual([[0, 1], [1, 0], [0, -1], [-1, 0]]);
    expect(turn(pairTank([], 'octo', 'star', { row: 5 }), -1).piece).toMatchObject({ turn: 3 });
  });

  it('steps away from a wall to turn', () => {
    const t = turn(pairTank([], 'octo', 'star', { row: 5, col: 5 }));
    expect(t.piece).toMatchObject({ turn: 1, col: 4 });
  });

  it('steps up off the floor to turn downward', () => {
    const t = turn(pairTank([], 'octo', 'star', { row: 12, turn: 1 }));
    expect(t.piece).toMatchObject({ turn: 2, row: 11 });
  });

  it('flips over in a one-wide gap', () => {
    const t = turn(pairTank(['o.o', 'o.o'], 'octo', 'star', { row: 12, col: 1 }));
    expect(t.piece).toMatchObject({ turn: 2, col: 1, row: 11 });
  });

  it('does nothing to a pearl', () => {
    const t = withBoard([], { piece: { type: 'pearl', row: 3, col: 2 } });
    expect(turn(t)).toBe(t);
  });
});

describe('falling and landing', () => {
  it('falls a row at a time and lands on the floor', () => {
    let t = pairTank([], 'octo', 'star');
    t = fall(t);
    expect(t.piece!.row).toBe(2);
    t = drop(t);
    expect(t.phase).toBe('resolving');
    expect(rowsOf(t.board, 2)).toEqual(['..s...', '..o...']);
    expect(t.last).toEqual({ kind: 'lock' });
  });

  it('splits a sideways pair over uneven ground', () => {
    const t = drop(pairTank(['......', '...m..', '...m..'], 'octo', 'star', { turn: 1 }));
    expect(rowsOf(t.board, 3)).toEqual(['...s..', '...m..', '..om..']);
  });

  it('shows where the piece will land', () => {
    expect(landing(pairTank(['..t...'], 'octo', 'star'))).toMatchObject({ row: 11, col: 2 });
  });

  it('gravity closes gaps without changing the order in a column', () => {
    const b = gravity(board(['o.....', '......', 's.....', '......']));
    expect(rowsOf(b, 2)).toEqual(['o.....', 's.....']);
  });
});

describe('popping', () => {
  it('pops four of a kind touching, side by side or stacked, but not three or diagonals', () => {
    expect(findGroups(board(['ooo...']))).toHaveLength(0);
    expect(findGroups(board(['o.....', 'ooo...']))).toHaveLength(1);
    expect(findGroups(board(['.o....', 'o.o...', '.o....']))).toHaveLength(0);
  });

  it('a landing that makes four pops them, scores, and brings the next piece', () => {
    let t = drop(pairTank(['......', 'oo....'], 'octo', 'octo', { turn: 1 }));
    t = resolve(t);
    expect(t.last).toMatchObject({ kind: 'pop', link: { pals: 4, chain: 1, points: 40, groups: [4] } });
    expect(rowsOf(t.board, 1)).toEqual(['......']);
    expect(t.score).toBe(40);
    t = resolve(t);
    expect(t.phase).toBe('falling');
    expect(t.last).toEqual({ kind: 'settled', sent: 0, cancelled: 0, clams: [] });
  });

  it('a chain: what drops after a pop makes another group, worth double', () => {
    // Two octopuses land beside two more and pop; the stars above them drop onto two more stars
    let t = drop(pairTank(['s.....', 's.....', 'o.....', 'oss...'], 'octo', 'octo', { col: 1 }));
    const links = [];
    while (t.phase === 'resolving') {
      t = resolve(t);
      if (t.last?.kind === 'pop') links.push(t.last.link);
    }
    expect(links.map((l) => l.chain)).toEqual([1, 2]);
    expect(links[1].points).toBe(links[1].pals * 10 * 2);
  });

  it('clams beside a pop leave with it; clams never match each other', () => {
    expect(findGroups(board(['cccc..']))).toHaveLength(0);
    const t = resolve(drop(pairTank(['c.....', 'oo....', 'ocm...'], 'octo', 'star', { col: 2 })));
    expect(t.last).toMatchObject({ kind: 'pop' });
    const link = t.last?.kind === 'pop' ? t.last.link : null;
    expect(link!.cells.filter(([r, c]) => r === ROWS - 3 && c === 0)).toHaveLength(1); // the clam above
    expect(link!.cells.filter(([r, c]) => r === ROWS - 1 && c === 1)).toHaveLength(1); // the clam beside
  });
});

describe('pearls', () => {
  it('come after enough pops, in place of the next pair, without changing the pair sequence', () => {
    const t = { ...newTank({ seed: 5 }), toPearl: 0 };
    expect(preview(t)).toEqual({ type: 'pearl' });
    const next = settle(drop(t));
    expect(next.piece).toMatchObject({ type: 'pearl' });
    expect(next.toPearl).toBe(PEARL_EVERY);
    expect(preview(next)).toEqual({ type: 'pair', ...pairAt(5, next.dealt, 4) });
  });

  it('pop every friend of the kind they land on, and wake clams beside those', () => {
    // The pearl lands on the star in column 1: all four stars go, and the clam on the star in column 4
    let t = withBoard(['s...c.', 'ms..s.', 'omoso.'], { piece: { type: 'pearl', row: 1, col: 1 } });
    t = resolve(drop(t));
    expect(t.last).toMatchObject({ kind: 'pop', link: { pearl: true, pals: 4, groups: [4], chain: 1 } });
    expect(rowsOf(t.board, 3)).toEqual(['......', 'm.....', 'omo.o.']);
  });

  it('send nothing extra in Versus for a big pop on their own', () => {
    // Five starfish pop at once: a group that big would send one clam, but not from a pearl
    let t = drop(withBoard(['s.....', 'sm.s.m', 'otsmso'], { piece: { type: 'pearl', row: 1, col: 0 } }));
    t = resolve(t);
    expect(t.last).toMatchObject({ kind: 'pop', link: { pearl: true, pals: 5 } });
    expect(settle(t).last).toMatchObject({ kind: 'settled', sent: 0 });
  });

  it('melt away when they land on the floor or a clam', () => {
    const t = drop(withBoard(['c.....'], { piece: { type: 'pearl', row: 1, col: 0 } }));
    expect(t.last).toEqual({ kind: 'lock', wastedPearl: true });
    expect(rowsOf(t.board, 2)).toEqual(['......', 'c.....']);
  });
});

describe('clams in Versus', () => {
  it('chains send more the longer they are, plus big and extra groups', () => {
    expect([1, 2, 3, 4, 5, 6, 9].map((n) => clamsFor(n, 0))).toEqual([0, 3, 6, 12, 18, 24, 24]);
    expect(clamsFor(1, 2)).toBe(2);
    expect(clamsFor(6, 40)).toBe(30);
  });

  it('a chain first cancels clams waiting for you, and sends the rest', () => {
    let t = drop(pairTank(['s.....', 's.....', 'o.....', 'oss...'], 'octo', 'octo', { col: 1 }));
    t = { ...t, incoming: 1 };
    t = settle(t);
    expect(t.last).toMatchObject({ kind: 'settled', cancelled: 1, sent: 2 });
    expect(t.incoming).toBe(0);
    expect(t.outgoing).toBe(2);
  });

  it('waiting clams drop in after your piece: whole rows first, then different columns, at most 30', () => {
    const t = settle(drop({ ...pairTank([], 'octo', 'star', { col: 0 }), incoming: 8 }));
    const last = t.last!;
    expect(last.kind === 'settled' && last.clams).toHaveLength(8);
    const perCol = Array(COLS).fill(0);
    for (const row of t.board) row.forEach((cell, c) => { if (cell === 'clam') perCol[c]++; });
    expect(perCol.sort()).toEqual([1, 1, 1, 1, 2, 2]);
    const many = settle(drop({ ...pairTank([], 'octo', 'star', { col: 0 }), incoming: 40 }));
    expect(many.incoming).toBe(10);
  });

  it('exchange hands each tank the clams the other sent', () => {
    const a = { ...newTank({ seed: 1 }), outgoing: 6, incoming: 1 };
    const b = { ...newTank({ seed: 1 }), outgoing: 0, incoming: 2 };
    const [a2, b2] = exchange(a, b);
    expect([a2.incoming, a2.outgoing, b2.incoming, b2.outgoing]).toEqual([1, 0, 8, 0]);
  });
});

describe('the end', () => {
  it('ends when the spot a new piece starts on is filled', () => {
    const tall = Array.from({ length: 12 }, (_, i) => (i % 2 ? '..ms..' : '..sm..'));
    const t = settle(drop(pairTank(tall, 'octo', 'turtle', { col: 0 })));
    expect(t.phase).toBe('over');
    expect(t.piece).toBeNull();
  });

  it('clears the hidden row before the next piece', () => {
    const b = board(Array.from({ length: 12 }, (_, i) => (i % 2 ? 'ms....' : 'sm....')));
    b[0][0] = 'octo';
    const t = settle({ ...newTank({ seed: 2 }), board: b, piece: null, phase: 'resolving' });
    expect(t.board[0].every((c) => c === null)).toBe(true);
  });
});

describe('speed', () => {
  it('Solo starts at 800ms a row and quickens each level, never under 150ms', () => {
    expect(soloFallMs(1)).toBe(800);
    expect(soloFallMs(2)).toBe(720);
    expect(soloFallMs(40)).toBe(150);
  });

  it('Versus follows the pace and quickens every 45 seconds', () => {
    expect(['gentle', 'steady', 'quick'].map((p) => versusFallMs(p as Pace, 0))).toEqual([900, 650, 420]);
    expect(versusFallMs('steady', 44)).toBe(650);
    expect(versusFallMs('steady', 45)).toBe(585);
    expect(versusFallMs('quick', 3600)).toBe(140);
  });
});

describe('simulate', () => {
  it('shows the result of a drop without changing the tank', () => {
    const t = pairTank(['......', 'oo....'], 'octo', 'octo', { turn: 1 });
    const before = JSON.stringify(t);
    const result = simulate(t.board, t.piece!)!;
    expect(result.links).toHaveLength(1);
    expect(JSON.stringify(t)).toBe(before);
  });
});

// --- the opponent ---

/** Plays a tank by the computer's own presses until it ends or `pieces` have landed. */
function autoplay(t0: Tank, pace: Pace, pieces: number, random: () => number) {
  let t = t0;
  let landed = 0;
  while (t.phase !== 'over' && landed < pieces) {
    const target = choosePlacement(t, pace, random);
    for (let i = 0; i < 12 && t.phase === 'falling'; i++) {
      const press = nextPress(t, target);
      if (press === 'drop') break;
      t = press === 'turn' ? turn(t) : move(t, press === 'left' ? -1 : 1);
    }
    t = drop(t);
    while (t.phase === 'resolving') t = resolve(t);
    landed++;
  }
  return { t, landed };
}

describe('the opponent', () => {
  it('only lists places it can reach, one per shape', () => {
    const t = pairTank([], 'octo', 'octo');
    // A pair of two of a kind: 6 standing up and 5 lying down
    expect(placements(t)).toHaveLength(11);
    // Column 1 is full to the top, so column 0 can't be reached
    const walled = pairTank(Array(12).fill('.m....'), 'octo', 'star');
    expect(placements(walled).every((p) => p.col >= 2)).toBe(true);
  });

  it('takes a pop that is right there', () => {
    const t = pairTank(['......', 'oo....'], 'octo', 'octo');
    const target = choosePlacement(t, 'gentle', () => 0);
    expect(simulate(t.board, { ...t.piece!, ...target, row: 1 } as never)!.links.length).toBeGreaterThan(0);
  });

  it('presses toward its target: turn, then slide, then drop', () => {
    let t = pairTank([], 'octo', 'star');
    const presses = [];
    for (let i = 0; i < 10; i++) {
      const p = nextPress(t, { col: 4, turn: 1 });
      presses.push(p);
      if (p === 'drop') break;
      t = p === 'turn' ? turn(t) : move(t, p === 'left' ? -1 : 1);
    }
    expect(presses).toEqual(['turn', 'right', 'right', 'drop']);
  });

  it('a Quick computer keeps going a long time on its own', () => {
    for (const seed of [1, 2, 3]) {
      const { landed } = autoplay(newTank({ seed }), 'quick', 300, seededRandom(seed));
      expect(landed).toBe(300);
    }
  }, 60_000);

  it('a Quick computer builds chains, so it sends more clams than a Gentle one', () => {
    const sent = (pace: Pace) =>
      [1, 2].reduce((n, seed) => n + autoplay(newTank({ seed }), pace, 150, seededRandom(seed)).t.outgoing, 0);
    expect(sent('quick')).toBeGreaterThan(sent('gentle') * 1.3);
  }, 60_000);
});

describe('storage', () => {
  it('round-trips the best score, tally and pace, and falls back to defaults', () => {
    const saved = { mode: 'versus' as const, best: 4210, tally: [3, 2] as [number, number], pace: 'quick' as Pace, showTally: true };
    expect(deserialize(serialize(saved))).toEqual(saved);
    expect(deserialize(null)).toEqual(DEFAULTS);
    expect(deserialize('{"v":1,"b":-5,"t":[1],"p":"warp"}')).toEqual({ ...DEFAULTS, tally: [1, 0] });
    expect(deserialize('not json')).toEqual(DEFAULTS);
  });
});
