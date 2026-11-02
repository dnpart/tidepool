import { describe, expect, it } from 'vitest';
import { seededRandom } from '../../util/random';
import { choosePlacement, nextPress, placements } from './ai';
import {
  barsForWave,
  COLS,
  drop,
  emptyBoard,
  exchange,
  fall,
  fullRows,
  HIDDEN,
  landing,
  level,
  MAX_SANDBARS_AT_ONCE,
  move,
  newTank,
  pieceAt,
  pieceCells,
  preview,
  resolve,
  ROWS,
  simulate,
  sink,
  soloFallMs,
  SPAWN_COL,
  SPAWN_ROW,
  turn,
  versusFallMs,
  wavePoints,
  type Board,
  type Cell,
  type Pace,
  type Piece,
  type Shape,
  type Tank,
  type Turn,
} from './rules';
import { deserialize, serialize, DEFAULTS } from './storage';

const LETTERS: Record<string, Cell> = { a: 'a', b: 'b', c: 'c', n: 'sand', '.': null };

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
const pieceTank = (rows: string[], shape: Shape, at: Partial<Piece> = {}, extra: Partial<Tank> = {}): Tank =>
  withBoard(rows, { piece: { shape, color: 'b', row: SPAWN_ROW, col: SPAWN_COL, turn: 0, ...at }, ...extra });
/** A piece's cells as [row, col] offsets from its pivot. */
const shapeOf = (p: Piece) => pieceCells(p).map(({ row, col }) => [row - p.row, col - p.col]);
/** A stack where a straight piece standing in column 6 sets off a chain of two waves. */
const CHAIN = ['a.......', '.aaaaa.a', 'aaaaaa.a'];
const settle = (t: Tank): Tank => {
  let s = t;
  while (s.phase === 'resolving') s = resolve(s);
  return s;
};
/** Resolves a landed piece, collecting the waves. */
function waves(t: Tank) {
  const out = [];
  let s = t;
  while (s.phase === 'resolving') {
    s = resolve(s);
    if (s.last?.kind === 'wave') out.push(s.last.wave);
  }
  return { t: s, waves: out };
}

describe('a new tank', () => {
  it('is 8 wide and 15 tall, with hidden rows above where pieces start', () => {
    expect(COLS).toBe(8);
    expect(ROWS - HIDDEN).toBe(15);
    const t = newTank({ seed: 7 });
    expect(t.phase).toBe('falling');
    expect(t.piece).toMatchObject({ row: SPAWN_ROW, col: SPAWN_COL, turn: 0 });
    expect(Math.max(...pieceCells(t.piece!).map((c) => c.row))).toBe(HIDDEN); // its lowest block on the top row you see
    expect(t.dealt).toBe(1);
  });

  it('deals the same pieces for the same seed, so both sides of Versus get the same pieces', () => {
    const a = newTank({ seed: 42 }), b = newTank({ seed: 42 });
    expect(a.piece).toEqual(b.piece);
    expect(preview(a)).toEqual(preview(b));
    const seq = (s: number) => Array.from({ length: 30 }, (_, i) => pieceAt(s, i));
    expect(seq(42)).toEqual(seq(42));
    expect(seq(42)).not.toEqual(seq(43));
  });

  it('deals both shapes in all three colors', () => {
    const all = Array.from({ length: 300 }, (_, i) => pieceAt(9, i));
    const straight = all.filter((p) => p.shape === 'straight').length;
    expect(straight).toBeGreaterThan(80);
    expect(straight).toBeLessThan(160);
    expect(new Set(all.map((p) => p.color))).toEqual(new Set(['a', 'b', 'c']));
  });

  it('the preview is the piece that comes out next', () => {
    const t = newTank({ seed: 3 });
    const next = preview(t);
    expect(settle(drop(t)).piece).toMatchObject(next);
  });
});

describe('pieces', () => {
  it('are three blocks: straight lies flat, bent is a corner', () => {
    const p = (shape: Shape, turn: Turn): Piece => ({ shape, color: 'a', row: 8, col: 4, turn });
    expect(shapeOf(p('straight', 0))).toEqual([[0, 0], [0, -1], [0, 1]]);
    expect(shapeOf(p('straight', 1))).toEqual([[0, 0], [-1, 0], [1, 0]]);
    // The bent piece turns clockwise round its corner: up and right, right and down, down and left, left and up
    expect([0, 1, 2, 3].map((t) => shapeOf(p('bent', t as Turn)))).toEqual([
      [[0, 0], [-1, 0], [0, 1]],
      [[0, 0], [0, 1], [1, 0]],
      [[0, 0], [1, 0], [0, -1]],
      [[0, 0], [0, -1], [-1, 0]],
    ]);
  });

  it('slide left and right, not through walls or blocks', () => {
    let t = pieceTank([], 'straight');
    t = move(move(t, -1), -1);
    expect(t.piece!.col).toBe(1);
    expect(move(t, -1)).toBe(t);
    const blocked = pieceTank(['a.......'], 'bent', { row: ROWS - 1, col: 1 });
    expect(move(blocked, -1)).toBe(blocked);
  });

  it('turn either way', () => {
    const t = pieceTank([], 'bent', { row: 8 });
    expect(turn(t).piece!.turn).toBe(1);
    expect(turn(t, -1).piece!.turn).toBe(3);
    expect(turn(turn(turn(turn(t)))).piece).toEqual(t.piece);
  });

  it('step away from a wall to turn', () => {
    // A straight piece standing against the left wall steps right to lie flat
    const t = turn(pieceTank([], 'straight', { row: 8, col: 0, turn: 1 }));
    expect(t.piece).toMatchObject({ turn: 2, col: 1 });
    // The bent piece at the right wall turned to point right steps left
    const bent = turn(pieceTank([], 'bent', { row: 8, col: 7, turn: 3 }));
    expect(bent.piece).toMatchObject({ turn: 0, col: 6 });
  });

  it('step up off the floor to turn', () => {
    const t = turn(pieceTank([], 'straight', { row: ROWS - 1 }));
    expect(t.piece).toMatchObject({ turn: 1, row: ROWS - 2 });
  });

  it("don't turn when there's no room at all", () => {
    // Standing in a one-wide well, three deep
    const t = pieceTank(['aaa.aaaa', 'aaa.aaaa', 'aaa.aaaa'], 'straight', { row: ROWS - 2, col: 3, turn: 1 });
    expect(turn(t)).toBe(t);
  });
});

describe('falling and landing', () => {
  it('falls a row at a time and lands on the floor in one piece', () => {
    let t = pieceTank([], 'bent');
    t = fall(t);
    expect(t.piece!.row).toBe(SPAWN_ROW + 1);
    t = drop(t);
    expect(t.phase).toBe('resolving');
    expect(t.last).toEqual({ kind: 'lock' });
    expect(rowsOf(t.board, 2)).toEqual(['...b....', '...bb...']);
  });

  it("doesn't sink on landing: an overhang leaves a hole until a wave", () => {
    const t = settle(drop(pieceTank(['.....a..'], 'straight', { col: 5 })));
    expect(rowsOf(t.board, 2)).toEqual(['....bbb.', '.....a..']);
  });

  it('shows where the piece will land', () => {
    expect(landing(pieceTank(['...a....'], 'bent'))).toMatchObject({ row: ROWS - 2, col: SPAWN_COL });
  });
});

describe('waves and sinking sand', () => {
  it('a full row washes away; the sand sinks and the next piece comes out', () => {
    let t = drop(pieceTank(['.....a..', 'aaa..aaa'], 'bent', { col: 3, turn: 0 }));
    // Settles as a corner in columns 3 and 4: the bottom row is full
    t = resolve(t);
    expect(t.last).toMatchObject({ kind: 'wave', wave: { rows: [ROWS - 1], chain: 1, points: 100 } });
    expect(rowsOf(t.board, 2)).toEqual(['........', '...b.a..']);
    expect(t.score).toBe(100);
    expect(t.rows).toBe(1);
    t = resolve(t);
    expect(t.phase).toBe('falling');
    expect(t.last).toEqual({ kind: 'settled', sent: 0, cancelled: 0, sandbars: 0, gap: null });
  });

  it('shows the board after the wave and before the sinking', () => {
    const t = resolve(drop(pieceTank(['...a....', 'aaaa.aaa'], 'straight', { col: 4, turn: 1 })));
    const wave = t.last?.kind === 'wave' ? t.last.wave : null;
    expect(rowsOf(wave!.washed, 3)).toEqual(['....b...', '...ab...', '........']);
    expect(rowsOf(t.board, 2)).toEqual(['....b...', '...ab...']);
  });

  it('every loose block sinks into the holes below it, which can fill another row: a chain worth double', () => {
    // A block in column 0 sits over a hole. The straight piece fills the bottom row; once it washes away, that block
    // sinks into the hole and fills the next row too.
    const t = drop(pieceTank(CHAIN, 'straight', { col: 6, turn: 1 }));
    const { t: after, waves: ws } = waves(t);
    expect(ws.map((w) => [w.rows.length, w.chain])).toEqual([[1, 1], [1, 2]]);
    expect(ws[1].points).toBe(100 * 2);
    expect(after.score).toBe(100 + 200);
    expect(rowsOf(after.board, 2)).toEqual(['........', '......b.']);
  });

  it('points: 100, 300, 600, 1,000 by rows at once, doubled for each link of a chain', () => {
    expect([1, 2, 3, 4].map((n) => wavePoints(n, 1))).toEqual([100, 300, 600, 1000]);
    expect(wavePoints(5, 1)).toBe(1500);
    expect(wavePoints(2, 3)).toBe(1200);
    expect(wavePoints(1, 20)).toBe(100 * 32);
  });

  it('only rows filled from side to side count', () => {
    expect(fullRows(board(['aaaaaaa.', 'nnnnnnnn', 'aabbccaa']))).toEqual([ROWS - 2, ROWS - 1]);
  });

  it('sink keeps the order in a column', () => {
    const b = sink(board(['a.......', '........', 'n.......', '........']));
    expect(rowsOf(b, 2)).toEqual(['a.......', 'n.......']);
  });

  it('a level is ten rows', () => {
    const t = newTank({ seed: 1 });
    expect(level(t)).toBe(1);
    expect(level({ ...t, rows: 9 })).toBe(1);
    expect(level({ ...t, rows: 10 })).toBe(2);
    expect(level({ ...t, rows: 25 })).toBe(3);
  });
});

describe('sandbars in Versus', () => {
  it('a wave sends one for each row past the first, plus two for each link past the first', () => {
    expect([1, 2, 3, 4].map((n) => barsForWave(n, 1))).toEqual([0, 1, 2, 3]);
    expect(barsForWave(1, 2)).toBe(2);
    expect(barsForWave(2, 3)).toBe(3);
  });

  it('one row sends none; two rows at once send one', () => {
    const one = settle(drop(pieceTank(['aaa...aa'], 'straight', { col: 4 })));
    expect(one.last).toMatchObject({ kind: 'settled', sent: 0 });
    const two = settle(drop(pieceTank(['aaaa.aaa', 'aaaa.aaa'], 'straight', { col: 4, turn: 1 })));
    expect(two.last).toMatchObject({ kind: 'settled', sent: 1 });
    expect(two.outgoing).toBe(1);
  });

  it('a chain sends two for its second wave, even of one row', () => {
    const t = settle(drop(pieceTank(CHAIN, 'straight', { col: 6, turn: 1 })));
    expect(t.last).toMatchObject({ kind: 'settled', sent: 2 });
  });

  it('first cancel sandbars waiting for you, and send the rest', () => {
    const t = settle(drop(pieceTank(CHAIN, 'straight', { col: 6, turn: 1 }, { incoming: 1 })));
    expect(t.last).toMatchObject({ kind: 'settled', cancelled: 1, sent: 1, sandbars: 0 });
    expect([t.incoming, t.outgoing]).toEqual([0, 1]);
  });

  it('push up from the bottom after your piece, all with the gap in one column, at most four at once', () => {
    const t = settle(drop(pieceTank(['a.......'], 'bent', { col: 5 }, { incoming: 2 })));
    const last = t.last!;
    expect(last.kind === 'settled' && last.sandbars).toBe(2);
    const gap = last.kind === 'settled' ? last.gap! : -1;
    const bars = rowsOf(t.board, 2);
    for (const row of bars) {
      expect(row.replace(/n/g, '')).toBe('.');
      expect(row.indexOf('.')).toBe(gap);
    }
    // What was on the floor is now on top of them
    expect(rowsOf(t.board, 4).slice(0, 2)).toEqual(['.....b..', 'a....bb.']);
    const many = settle(drop(pieceTank([], 'bent', { col: 0, turn: 1 }, { incoming: 9 })));
    expect(many.incoming).toBe(9 - MAX_SANDBARS_AT_ONCE);
  });

  it("fill a sandbar's gap and it washes away like any row", () => {
    const t = pieceTank(['nnnn.nnn'], 'straight', { col: 4, turn: 1 });
    const { waves: ws } = waves(drop(t));
    expect(ws).toHaveLength(1);
  });

  it('sink like everything else after a wave', () => {
    // Coral rests over the gap of a sandbar; a wave above lets it sink in and fill the sandbar too
    const t = drop(pieceTank(['aa......', 'aaaaaaa.', 'n.nnnnnn'], 'straight', { col: 7, turn: 1, row: 6 }));
    const { waves: ws } = waves(t);
    expect(ws.map((w) => w.chain)).toEqual([1, 2]);
  });

  it('exchange hands each tank the sandbars the other sent', () => {
    const a = { ...newTank({ seed: 1 }), outgoing: 3, incoming: 1 };
    const b = { ...newTank({ seed: 1 }), outgoing: 0, incoming: 2 };
    const [a2, b2] = exchange(a, b);
    expect([a2.incoming, a2.outgoing, b2.incoming, b2.outgoing]).toEqual([1, 0, 5, 0]);
    expect(exchange(b2, b2)).toEqual([b2, b2]);
  });
});

describe('the end', () => {
  it('ends when a new piece has no room to come out', () => {
    const tall = Array.from({ length: 15 }, () => '...a....');
    const t = settle(drop(pieceTank(tall, 'bent', { col: 0, turn: 1 })));
    expect(t.phase).toBe('over');
    expect(t.piece).toBeNull();
  });

  it('ends when sandbars push a block out of the top of the tank', () => {
    const b = board(Array.from({ length: 15 }, () => 'a.......'));
    b[1][0] = 'a';
    const t = settle({ ...newTank({ seed: 2 }), board: b, piece: null, phase: 'resolving', incoming: 2 });
    expect(t.phase).toBe('over');
    // The same stack is fine without them
    expect(settle({ ...newTank({ seed: 2 }), board: b, piece: null, phase: 'resolving' }).phase).toBe('falling');
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
    expect(versusFallMs('steady', 45)).toBe(585);
  });
});

describe('simulate', () => {
  it('shows the result of a drop without changing the tank', () => {
    const t = pieceTank(['aaaa.aaa', 'aaaa.aaa'], 'straight', { col: 4, turn: 1 });
    const before = JSON.stringify(t);
    const result = simulate(t.board, t.piece!)!;
    expect(result.waves.map((w) => w.rows.length)).toEqual([2]);
    expect(rowsOf(result.board, 1)).toEqual(['....b...']);
    expect(JSON.stringify(t)).toBe(before);
  });
});

// --- the opponent ---

/** Plays a tank by the computer's own presses until it ends or `pieces` have landed. */
function autoplay(t0: Tank, pace: Pace, pieces: number, random: () => number, sandbarEvery = 0) {
  let t = t0;
  let landed = 0;
  let sent = 0;
  while (t.phase !== 'over' && landed < pieces) {
    const target = choosePlacement(t, pace, random);
    for (let i = 0; i < 12 && t.phase === 'falling'; i++) {
      const press = nextPress(t, target);
      if (press === 'drop') break;
      t = press === 'turn' ? turn(t) : move(t, press === 'left' ? -1 : 1);
    }
    t = drop(t);
    while (t.phase === 'resolving') t = resolve(t);
    if (t.last?.kind === 'settled') sent += t.last.sent;
    landed++;
    if (sandbarEvery && landed % sandbarEvery === 0) t = { ...t, incoming: t.incoming + 1 };
  }
  return { t, landed, sent };
}

describe('the opponent', () => {
  it('only lists places it can reach, one per shape', () => {
    // A straight piece: 6 lying flat and 8 standing up
    expect(placements(pieceTank([], 'straight'))).toHaveLength(14);
    // A bent piece: 7 places for each of its four turns
    expect(placements(pieceTank([], 'bent'))).toHaveLength(28);
    // Column 2 is full to the top, so columns 0 and 1 can't be reached
    const walled = pieceTank(Array(15).fill('..a.....'), 'bent');
    expect(placements(walled).every((p) => p.col >= 3)).toBe(true);
  });

  it('Gentle washes any row it can; every pace takes three rows at once', () => {
    const one = pieceTank(['aaaa...a'], 'straight');
    expect(simulate(one.board, { ...one.piece!, ...choosePlacement(one, 'gentle', () => 0) })!.waves).toHaveLength(1);
    const three = pieceTank(['aaaa.aaa', 'aaaa.aaa', 'aaaa.aaa'], 'straight');
    for (const pace of ['gentle', 'steady', 'quick'] as Pace[]) {
      const result = simulate(three.board, { ...three.piece!, ...choosePlacement(three, pace, () => 0) })!;
      expect(result.waves.map((w) => w.rows.length)).toEqual([3]);
    }
  });

  it('presses toward its target: turn, then slide, then drop', () => {
    let t = pieceTank([], 'bent');
    const presses = [];
    for (let i = 0; i < 10; i++) {
      const p = nextPress(t, { col: 6, turn: 2 });
      presses.push(p);
      if (p === 'drop') break;
      t = p === 'turn' ? turn(t) : move(t, p === 'left' ? -1 : 1);
    }
    expect(presses).toEqual(['turn', 'turn', 'right', 'right', 'right', 'drop']);
  });

  it('a Quick computer keeps going a long time, even with a sandbar pushing up every eight pieces', () => {
    for (const seed of [1, 2]) {
      const { landed } = autoplay(newTank({ seed }), 'quick', 250, seededRandom(seed), 8);
      expect(landed).toBe(250);
    }
  }, 60_000);

  it('a sharper computer washes several rows at once, so Quick sends more sandbars than Steady, and Steady than Gentle', () => {
    const sent = (pace: Pace) => [1, 2].reduce((n, seed) => n + autoplay(newTank({ seed }), pace, 150, seededRandom(seed)).sent, 0);
    expect(sent('steady')).toBeGreaterThan(sent('gentle') * 1.3);
    expect(sent('quick')).toBeGreaterThan(sent('steady') * 1.3);
  }, 60_000);
});

describe('storage', () => {
  it('round-trips the best score, tally and pace, and falls back to defaults', () => {
    const saved = { mode: 'versus' as const, best: 12_400, tally: [3, 2] as [number, number], pace: 'quick' as Pace, showTally: true };
    expect(deserialize(serialize(saved))).toEqual(saved);
    expect(deserialize(null)).toEqual(DEFAULTS);
    expect(deserialize('{"v":1,"b":-5,"t":[1],"p":"warp"}')).toEqual({ ...DEFAULTS, tally: [1, 0] });
    expect(deserialize('not json')).toEqual(DEFAULTS);
  });
});
