import { describe, expect, it } from 'vitest';
import {
  blocksLeft,
  COLS,
  drop,
  emptyBoard,
  fall,
  fullRows,
  HIDDEN,
  landing,
  level,
  levelsFallMs,
  MAX_SAND_ROWS,
  move,
  newTank,
  pieceAt,
  pieceCells,
  preview,
  resolve,
  ROWS,
  sandLeft,
  sandRows,
  sandStack,
  sink,
  soloFallMs,
  SPAWN_COL,
  SPAWN_ROW,
  SHAPES,
  turn,
  UNLOCKS,
  unlocked,
  wavePoints,
  type Board,
  type Cell,
  type Piece,
  type Shape,
  type Tank,
  type Turn,
} from './rules';
import { deserialize, serialize, DEFAULTS } from './storage';

const LETTERS: Record<string, Cell> = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', n: 'sand', '.': null };

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

  it('deals the same pieces for the same seed, for a fair replay', () => {
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

describe('more shapes and colors as the level goes up', () => {
  it('level 1 has straight and bent in the three drawn colors; each level to 8 brings a shape or a color', () => {
    expect(unlocked(1)).toEqual({ shapes: ['straight', 'bent'], colors: ['a', 'b', 'c'] });
    expect(UNLOCKS[2]).toEqual({ shape: 'branch' });
    expect(unlocked(2).shapes).toContain('branch');
    expect(unlocked(3).colors).toEqual(['a', 'b', 'c', 'd']);
    expect(unlocked(8)).toEqual({ shapes: [...SHAPES], colors: ['a', 'b', 'c', 'd', 'e', 'f'] });
    expect(unlocked(20)).toEqual(unlocked(8));
    for (let l = 2; l <= 8; l++) expect(UNLOCKS[l]).toBeDefined();
  });

  it('deals only what the level has open, and everything it has open', () => {
    for (const lvl of [1, 2, 4, 5, 8]) {
      const all = Array.from({ length: 600 }, (_, i) => pieceAt(11, i, lvl));
      const { shapes, colors } = unlocked(lvl);
      expect(new Set(all.map((p) => p.shape))).toEqual(new Set(shapes));
      expect(new Set(all.map((p) => p.color))).toEqual(new Set(colors));
    }
  });

  it('level 1 deals the same pieces it always did', () => {
    // Before the unlocks: 40% straight, then any of the three colors, from the same random numbers
    const all = Array.from({ length: 200 }, (_, i) => pieceAt(5, i, 1));
    expect(all).toEqual(Array.from({ length: 200 }, (_, i) => pieceAt(5, i)));
  });

  it('the shapes: branch has its bump on top of the middle, square is two by two, long is four, hook bumps up at the end', () => {
    const at = (shape: Shape, t: Turn = 0) => shapeOf({ shape, color: 'a', row: 5, col: 4, turn: t });
    expect(at('branch')).toEqual([[0, 0], [0, -1], [0, 1], [-1, 0]]);
    expect(at('square')).toEqual([[0, 0], [0, 1], [-1, 0], [-1, 1]]);
    expect(at('long')).toEqual([[0, 0], [0, -1], [0, 1], [0, 2]]);
    expect(at('hook')).toEqual([[0, 0], [0, -1], [0, 1], [-1, 1]]);
    // A branch turned a quarter points its bump right; the square never changes
    expect(at('branch', 1)).toEqual([[0, 0], [-1, 0], [1, 0], [0, 1]]);
    for (const t of [1, 2, 3] as Turn[]) expect(at('square', t)).toEqual(at('square'));
  });

  it('every shape comes out on the top row you see, and fits at every turn', () => {
    for (const shape of SHAPES) {
      const p: Piece = { shape, color: 'a', row: SPAWN_ROW, col: SPAWN_COL, turn: 0 };
      expect(Math.max(...pieceCells(p).map((c) => c.row))).toBe(HIDDEN);
      for (const t of [0, 1, 2, 3] as Turn[]) {
        const cells = pieceCells({ ...p, row: 6, turn: t });
        expect(new Set(cells.map((c) => `${c.row},${c.col}`)).size).toBe(cells.length);
      }
    }
  });

  it('a long piece standing against either wall steps two columns to lie flat', () => {
    // Standing (turn 1) in column 7, it can't lie flat with the pivot there (it reaches column 9)
    const right = turn(pieceTank([], 'long', { col: 7, row: 8, turn: 1 }));
    expect(right.piece).toMatchObject({ turn: 2 });
    expect(pieceCells(right.piece!).every((c) => c.col >= 0 && c.col < COLS)).toBe(true);
    const left = turn(pieceTank([], 'long', { col: 0, row: 8, turn: 1 }));
    expect(left.piece).toMatchObject({ turn: 2 });
    expect(pieceCells(left.piece!).every((c) => c.col >= 0 && c.col < COLS)).toBe(true);
  });

  it('the preview never changes when a wave takes you up a level', () => {
    // Nine rows washed so far: this bent piece fills the bottom row, the tenth, and level 2 begins
    for (let seed = 1; seed < 40; seed++) {
      const t = pieceTank(['.....a..', 'aaa..aaa'], 'bent', { col: 3, turn: 0 }, { seed, rows: 9, next: pieceAt(seed, 1, 1), dealt: 1 });
      const shown = preview(t);
      const after = settle(drop(t));
      expect(level(after)).toBe(2);
      expect(after.piece).toMatchObject(shown);
      expect(preview(after)).toEqual(pieceAt(seed, 2, 2));
    }
  });

  it('in Levels the four-block shapes come less often than in Continuous', () => {
    const fours = (mode: 'solo' | 'levels') =>
      Array.from({ length: 2000 }, (_, i) => pieceAt(3, i, 8, mode)).filter((p) => !['straight', 'bent'].includes(p.shape)).length;
    expect(fours('solo') / 2000).toBeGreaterThan(0.5); // 15 in 25
    expect(fours('levels') / 2000).toBeGreaterThan(0.2); // 4 in 14
    expect(fours('levels') / 2000).toBeLessThan(0.36);
  });

  it('Levels deals from its own level from the first piece', () => {
    const all = Array.from({ length: 40 }, (_, s) => newTank({ seed: s, stage: 8 })).flatMap((t) => [t.piece!, preview(t)]);
    expect(all.some((p) => !['straight', 'bent'].includes(p.shape))).toBe(true);
    const first = Array.from({ length: 40 }, (_, s) => newTank({ seed: s, stage: 1 })).flatMap((t) => [t.piece!, preview(t)]);
    expect(first.every((p) => ['straight', 'bent'].includes(p.shape) && ['a', 'b', 'c'].includes(p.color))).toBe(true);
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
    expect(t.last).toEqual({ kind: 'settled' });
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

describe('sand', () => {
  it("fill a gap in a row of sand and it washes away like any row", () => {
    const t = pieceTank(['nnnn.nnn'], 'straight', { col: 4, turn: 1 });
    const { waves: ws } = waves(drop(t));
    expect(ws).toHaveLength(1);
    expect(ws[0].sand).toBe(7);
  });

  it('sinks like everything else after a wave', () => {
    // Coral rests over a gap in the sand; a wave above lets it sink in and fill the sand row too
    const t = drop(pieceTank(['aa......', 'aaaaaaa.', 'n.nnnnnn'], 'straight', { col: 7, turn: 1, row: 6 }));
    const { waves: ws } = waves(t);
    expect(ws.map((w) => w.chain)).toEqual([1, 2]);
  });
});

describe('Levels', () => {
  it('the sand starts 3 rows high and grows a row every two levels, up to 9', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(sandRows)).toEqual([3, 3, 4, 4, 5, 5, 6]);
    expect(sandRows(13)).toBe(MAX_SAND_ROWS);
    expect(sandRows(40)).toBe(MAX_SAND_ROWS);
  });

  it('starts on uneven sand as high as the level says, with no full row, the same for the same seed', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const stage of [1, 4, 9, 20]) {
        const b = sandStack(seed, stage);
        const heights = Array.from({ length: COLS }, (_, c) => {
          let r = 0;
          while (r < ROWS && b[r][c] === null) r++;
          return ROWS - r;
        });
        expect(Math.max(...heights)).toBe(sandRows(stage));
        expect(new Set(heights).size).toBeGreaterThan(1);
        expect(fullRows(b)).toEqual([]);
        expect(b.flat().every((c) => c === null || c === 'sand')).toBe(true);
      }
    }
    expect(sandStack(7, 3)).toEqual(sandStack(7, 3));
    expect(sandStack(7, 3)).not.toEqual(sandStack(8, 3));
  });

  it('hides a few holes in the sand, for the sinking to fill', () => {
    let holes = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const b = sandStack(seed, 9);
      for (let c = 0; c < COLS; c++) {
        let roof = false;
        for (let r = 0; r < ROWS; r++) {
          if (b[r][c] !== null) roof = true;
          else if (roof) holes++;
        }
      }
    }
    expect(holes).toBeGreaterThan(30);
  });

  it('a new level tank knows its level and has its piece out', () => {
    const t = newTank({ seed: 3, stage: 5 });
    expect(level(t)).toBe(5);
    expect(t.phase).toBe('falling');
    expect(sandLeft(t.board)).toBeGreaterThan(0);
    expect(level(newTank({ seed: 3 }))).toBe(1);
  });

  it('goes on after the last sand washes away, while any coral is left', () => {
    const t = settle(drop(pieceTank(['aa......', 'nnnnn...'], 'straight', { col: 6 }, { stage: 2 })));
    expect(sandLeft(t.board)).toBe(0);
    expect(blocksLeft(t.board)).toBe(2);
    expect(t.phase).toBe('falling');
  });

  it('is won once the tank is empty, sand and coral', () => {
    const t = settle(drop(pieceTank(['nnnnn...'], 'straight', { col: 6 }, { stage: 1 })));
    expect(t.phase).toBe('cleared');
    expect(t.piece).toBeNull();
    expect(t.last).toEqual({ kind: 'cleared' });
  });

  it('goes on while any sand is left', () => {
    const t = settle(drop(pieceTank(['n.......', 'nnnnn...'], 'straight', { col: 6 }, { stage: 1 })));
    expect(t.phase).toBe('falling');
    expect(sandLeft(t.board)).toBe(1);
  });

  it("Continuous is never won, however empty the tank", () => {
    const t = settle(drop(pieceTank(['aaaaa...'], 'straight', { col: 6 })));
    expect(blocksLeft(t.board)).toBe(0);
    expect(t.phase).toBe('falling');
  });
});

describe('the end', () => {
  it('ends when a new piece has no room to come out', () => {
    const tall = Array.from({ length: 15 }, () => '...a....');
    const t = settle(drop(pieceTank(tall, 'bent', { col: 0, turn: 1 })));
    expect(t.phase).toBe('over');
    expect(t.piece).toBeNull();
  });
});

describe('speed', () => {
  it('Continuous starts at 800ms a row and quickens each level, never under 150ms', () => {
    expect(soloFallMs(1)).toBe(800);
    expect(soloFallMs(2)).toBe(720);
    expect(soloFallMs(40)).toBe(150);
  });

  it('Levels starts at the same 800ms as Continuous and quickens a little each level, never under 150ms', () => {
    expect(levelsFallMs(1)).toBe(800);
    expect(levelsFallMs(2)).toBe(736);
    expect(levelsFallMs(10)).toBeGreaterThan(soloFallMs(10));
    expect(levelsFallMs(60)).toBe(150);
  });
});

describe('storage', () => {
  it('round-trips the mode, best score and best level, and falls back to defaults', () => {
    const saved = { mode: 'levels' as const, best: 12_400, bestLevel: 7 };
    expect(deserialize(serialize(saved))).toEqual(saved);
    expect(deserialize(null)).toEqual(DEFAULTS);
    expect(deserialize('{"v":1,"b":-5,"l":0}')).toEqual(DEFAULTS);
    expect(deserialize('not json')).toEqual(DEFAULTS);
  });

  it('a save from when Coral Stack had Versus opens on Continuous and keeps its best score', () => {
    expect(deserialize('{"v":1,"m":"versus","b":2400,"t":[3,2],"p":"quick","sh":false}')).toEqual({ ...DEFAULTS, best: 2400 });
  });
});
