import { describe, expect, it } from 'vitest';
import { seededRandom } from '../../util/random';
import { chooseMove, type Level } from './ai';
import {
  applyMove,
  legalMoves,
  movablePieces,
  newGame,
  nextGame,
  nextLandings,
  piecesLeft,
  play,
  QUIET_LIMIT,
  resign,
  type Board,
  type CheckersState,
  type Move,
} from './rules';
import { deserialize, serialize } from './storage';

// --- helpers ---

/** A board from 8 rows of 8: '.' empty, m / k your man / king, M / K the other side's. */
function board(rows: string): Board {
  const cells = rows.replace(/\s+/g, '');
  if (cells.length !== 64) throw new Error(`need 64 squares, got ${cells.length}`);
  return [...cells].map((c) => (c === '.' ? null : { seat: c === 'm' || c === 'k' ? 0 : 1, king: c === 'k' || c === 'K' }));
}
const sq = (name: string) => (8 - Number(name[1])) * 8 + (name.charCodeAt(0) - 97);
const state = (rows: string, extra: Partial<CheckersState> = {}): CheckersState => ({ ...newGame(), board: board(rows), ...extra });
const shown = (moves: Move[]) => moves.map((m) => [m.from, ...m.path].map((s) => `${String.fromCharCode(97 + (s % 8))}${8 - Math.floor(s / 8)}`).join('-')).sort();

describe('the start', () => {
  it('sets 12 men each on the dark squares of their first three rows, and you move first', () => {
    const g = newGame();
    expect(piecesLeft(g.board)).toEqual([12, 12]);
    g.board.forEach((p, s) => {
      if (!p) return;
      expect((Math.floor(s / 8) + (s % 8)) % 2).toBe(1);
      expect(p.seat === 0 ? Math.floor(s / 8) >= 5 : Math.floor(s / 8) <= 2).toBe(true);
    });
    expect(g.turn).toBe(0);
    expect(legalMoves(g)).toHaveLength(7);
  });

  it('lets the other side start the next game, keeping the tally and the jump rule', () => {
    const g = nextGame({ ...newGame({ mustJump: false }), tally: [2, 1, 0] });
    expect(g).toMatchObject({ turn: 1, starter: 1, mustJump: false, tally: [2, 1, 0] });
    expect(nextGame(g).starter).toBe(0);
  });
});

describe('moves', () => {
  it('steps men forward only, and kings both ways', () => {
    const g = state(`
      ........
      ........
      ........
      ........
      ...m....
      ........
      .....k..
      ........`);
    expect(shown(legalMoves(g))).toEqual(['d4-c5', 'd4-e5', 'f2-e1', 'f2-e3', 'f2-g1', 'f2-g3']);
  });

  it('requires a jump when one is open', () => {
    const g = state(`
      ........
      ........
      ........
      ..M.....
      ...m....
      ........
      .m......
      ........`);
    expect(shown(legalMoves(g))).toEqual(['d4-b6']);
    // With jumps optional, the steps are open too
    expect(shown(legalMoves({ ...g, mustJump: false }))).toEqual(['b2-a3', 'b2-c3', 'd4-b6', 'd4-e5']);
  });

  it('keeps jumping while it can, and a run of jumps is one move', () => {
    const g = state(`
      ........
      ........
      ...M.M..
      ........
      .M......
      m.......
      ........
      ........`);
    // a3 over b4 to c5, then over d6 to e7 (and not over f6: a man only jumps forward)
    expect(shown(legalMoves(g))).toEqual(['a3-c5-e7']);
    const after = play(g, legalMoves(g)[0])!;
    expect(piecesLeft(after.board)).toEqual([1, 1]);
    expect(after.last?.captures).toHaveLength(2);
  });

  it('branches where a run can go two ways', () => {
    const g = state(`
      ........
      ........
      .M...M..
      ........
      ...M....
      ....m...
      ........
      ........`);
    // e3 over d4 to c5, then over b6 to a7 or over d6 to e7
    expect(shown(legalMoves(g))).toEqual(['e3-c5-a7']);
    const g2 = state(`
      ........
      ........
      .M.M....
      ........
      ...M....
      ....m...
      ........
      ........`);
    expect(shown(legalMoves(g2))).toEqual(['e3-c5-a7', 'e3-c5-e7']);
    expect(nextLandings(g2, sq('e3'), [])).toEqual([sq('c5')]);
    expect(nextLandings(g2, sq('e3'), [sq('c5')]).sort()).toEqual([sq('a7'), sq('e7')].sort());
    expect(movablePieces(g2)).toEqual([sq('e3')]);
  });

  it('crowns a man on the far row, and that ends the move', () => {
    const g = state(`
      ........
      ..M.M...
      ...m....
      ........
      ........
      ........
      ........
      ........`);
    // d6 jumps c7 to b8 and is crowned; as a king it could jump on, but the move ends there
    const moves = legalMoves(g);
    expect(shown(moves)).toEqual(['d6-b8', 'd6-f8']);
    const after = play(g, moves[0])!;
    expect(after.board[sq('b8')]).toEqual({ seat: 0, king: true });
    expect(after.last?.crowned).toBe(true);
    expect(after.turn).toBe(1);
  });

  it('lets kings jump backward, and never over the same piece twice', () => {
    const g = state(`
      ........
      ..M.M...
      ........
      ..M.M...
      ...k....
      ........
      ........
      ........`, { mustJump: true });
    // Round the square: d4 over c5 to b6, over c7 to d8, over e7 to f6, over e5 back home to d4
    const moves = legalMoves(g);
    const longest = Math.max(...moves.map((m) => m.captures.length));
    expect(longest).toBe(4);
    for (const m of moves) expect(new Set(m.captures).size).toBe(m.captures.length);
    const loop = moves.find((m) => m.captures.length === 4)!;
    expect(loop.path[loop.path.length - 1]).toBe(sq('d4'));
    expect(piecesLeft(applyMove(g.board, loop).board)).toEqual([1, 0]);
  });

  it('refuses moves that aren’t legal', () => {
    const g = newGame();
    expect(play(g, { from: sq('b6'), path: [sq('a5')], captures: [] })).toBeNull();
    expect(play(g, { from: sq('c3'), path: [sq('c4')], captures: [] })).toBeNull();
    expect(play(g, { from: sq('c3'), path: [sq('d4')], captures: [] })).not.toBeNull();
  });
});

describe('the end', () => {
  it('is a win when the other side has no move: no pieces, or all blocked', () => {
    const taken = state(`
      ........
      ........
      ........
      ..M.....
      ...m....
      ........
      ........
      ........`);
    const after = play(taken, legalMoves(taken)[0])!;
    expect(after.result).toEqual({ winner: 0, reason: 'stuck' });
    expect(after.tally).toEqual([1, 0, 0]);

    const blocked = state(`
      M.......
      .m......
      ..m.....
      ........
      ........
      ........
      ........
      ......m.`);
    // The other side's man on a8 is stuck behind b7, which c6 guards; any move of yours keeps it stuck
    const done = play(blocked, legalMoves(blocked).find((m) => m.from === sq('g1'))!)!;
    expect(done.result).toEqual({ winner: 0, reason: 'stuck' });
  });

  it('is a draw after forty moves each with no capture and no man moving', () => {
    let g = state(`
      .......K
      ........
      ........
      ........
      ........
      ........
      ........
      k.......`);
    // Each king steps back and forth in its own corner
    const home = [[sq('a1'), sq('b2')], [sq('h8'), sq('g7')]];
    while (g.phase === 'play') {
      g = play(g, legalMoves(g).find((m) => home[g.turn].includes(m.path[0]))!)!;
    }
    expect(g.moves).toBe(QUIET_LIMIT);
    expect(g.result).toEqual({ winner: null, reason: 'quiet' });
    expect(g.tally).toEqual([0, 0, 1]);
  });

  it('can be resigned', () => {
    expect(resign(newGame()).result).toEqual({ winner: 1, reason: 'stuck' });
  });
});

describe('the computer', () => {
  it('takes the bigger capture when jumps are optional', () => {
    const g = state(`
      ........
      ........
      .M...M..
      ........
      .M.M....
      m...m...
      ........
      ........`, { mustJump: false });
    // a3 takes one; e3 takes two (over d4 to c5, over b6 to a7)
    for (const level of ['medium', 'hard'] as const) expect(chooseMove(g, level)!.captures).toHaveLength(2);
  });

  it('plays whole games to an end at every level', () => {
    for (const level of ['easy', 'medium', 'hard'] as Level[]) {
      const random = seededRandom(level.length);
      let g = newGame();
      // Against the easy level, so the games stay short
      while (g.phase === 'play') g = play(g, chooseMove(g, g.turn === 0 ? level : 'easy', random)!)!;
      expect(g.result).not.toBeNull();
    }
  }, 120000);

  it('gets stronger with each level', () => {
    const score = (a: Level, b: Level, games: number) => {
      let wins = 0;
      for (let i = 0; i < games; i++) {
        const random = seededRandom(100 + i);
        let g = newGame({ starter: (i % 2) as 0 | 1 });
        while (g.phase === 'play') g = play(g, chooseMove(g, g.turn === 0 ? a : b, random)!)!;
        if (g.result!.winner === 0) wins++;
        if (g.result!.winner === null) wins += 0.5;
      }
      return wins / games;
    };
    expect(score('hard', 'easy', 4)).toBeGreaterThanOrEqual(3.5 / 4);
    expect(score('medium', 'easy', 8)).toBeGreaterThan(0.5);
  }, 60000);

  it('thinks quickly enough for a phone at the hardest level', () => {
    let g = newGame();
    const random = seededRandom(3);
    let slowest = 0;
    for (let i = 0; i < 16 && g.phase === 'play'; i++) {
      const t = performance.now();
      const move = chooseMove(g, 'hard', random)!;
      slowest = Math.max(slowest, performance.now() - t);
      g = play(g, move)!;
    }
    expect(slowest).toBeLessThan(1500);
  }, 60000);
});

describe('saving', () => {
  it('restores a game in progress exactly', () => {
    let g = newGame({ mustJump: false });
    const random = seededRandom(5);
    for (let i = 0; i < 12; i++) g = play(g, chooseMove(g, 'easy', random)!)!;
    const saved = { game: { ...g, tally: [3, 2, 1] as [number, number, number] }, level: 'hard' as const, opponent: 'friend' as const, showTally: true };
    expect(deserialize(serialize(saved))).toEqual(saved);
  });

  it('restores a finished game with its result', () => {
    let g = newGame();
    const random = seededRandom(6);
    while (g.phase === 'play') g = play(g, chooseMove(g, 'easy', random)!)!;
    const saved = { game: g, level: 'easy' as const, opponent: 'computer' as const, showTally: false };
    expect(deserialize(serialize(saved))).toEqual(saved);
  });

  it('refuses damaged saves', () => {
    const good = JSON.parse(serialize({ game: newGame(), level: 'medium', opponent: 'computer', showTally: false }));
    expect(deserialize(null)).toBeNull();
    expect(deserialize('not json')).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, v: 2 }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, b: good.b.slice(1) }))).toBeNull();
    // A piece on a light square
    expect(deserialize(JSON.stringify({ ...good, b: `m${good.b.slice(1)}` }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, t: 2 }))).toBeNull();
  });
});
