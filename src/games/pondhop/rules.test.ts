import { describe, expect, it } from 'vitest';
import { seededRandom } from '../../util/random';
import {
  chooseMove,
  CORNER,
  holeOf,
  homeCount,
  isPad,
  legalMoves,
  move,
  newGame,
  pass,
  resetTally,
  roll,
  rollDie,
  STARTS,
  takeTurn,
  type Move,
  type PondHopState,
} from './rules';
import { deserialize, serialize } from './storage';

// --- helpers ---

const C = CORNER;

/** A game with the given marbles (progress per seat), whose turn it is, and the roll waiting to be used. */
function state(marbles: number[][], opts: { turn?: number; rolled?: number | null } = {}): PondHopState {
  return {
    marbles,
    turn: opts.turn ?? 0,
    rolled: opts.rolled === undefined ? null : opts.rolled,
    last: null,
    phase: 'play',
    winner: null,
    tally: [0, 0, 0],
  };
}

/** The moves as "marble:from>to", with "+hop", "+out" and "xN" for marbles sent home. */
const show = (moves: Move[]) =>
  moves.map((m) => `${m.marble}:${m.from}>${m.to}${m.out ? '+out' : ''}${m.hop ? '+hop' : ''}${m.captures.length ? `x${m.captures.length}` : ''}`);

const find = (s: PondHopState, to: number, hop = false) => legalMoves(s).find((m) => m.to === to && m.hop === hop)!;

// --- tests ---

describe('the board', () => {
  it('starts you at 30, the first opponent across at 10 and the second at 0', () => {
    expect(STARTS).toEqual([30, 10, 0]);
    expect(holeOf(0, 0)).toBe(30);
    expect(holeOf(1, 0)).toBe(10);
    expect(holeOf(2, 0)).toBe(0);
  });

  it('goes clockwise round the 40 holes, ending on the hole just before the start', () => {
    expect(holeOf(0, 9)).toBe(39);
    expect(holeOf(0, 10)).toBe(0);
    expect(holeOf(0, 39)).toBe(29);
    expect(holeOf(1, 39)).toBe(9);
  });

  it('has no track hole for a marble in its corner or its lane', () => {
    expect(holeOf(0, C)).toBeNull();
    expect(holeOf(0, 40)).toBeNull();
    expect(holeOf(0, 43)).toBeNull();
  });

  it('has lily pads at 5, 15, 25 and 35', () => {
    expect([0, 5, 15, 20, 25, 35].map(isPad)).toEqual([false, true, true, false, true, true]);
  });

  it('rolls 1 to 6', () => {
    const random = seededRandom(1);
    const rolls = new Set(Array.from({ length: 300 }, () => rollDie(random)));
    expect([...rolls].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('a new game', () => {
  it('has every marble in its corner, two seats with one opponent and three with two', () => {
    expect(newGame(1).marbles).toEqual([[C, C, C, C], [C, C, C, C]]);
    expect(newGame(2).marbles).toHaveLength(3);
    expect(newGame(2).turn).toBe(0);
  });

  it('keeps the tally given to it', () => {
    expect(newGame(2, [2, 1, 3]).tally).toEqual([2, 1, 3]);
    expect(resetTally(newGame(2, [2, 1, 3])).tally).toEqual([0, 0, 0]);
  });

  it('rolls once per move, and not after the game is over', () => {
    const s = roll(newGame(1), 4)!;
    expect(s.rolled).toBe(4);
    expect(roll(s, 2)).toBeNull();
    expect(roll(newGame(1), 7)).toBeNull();
    expect(roll({ ...newGame(1), phase: 'done' }, 3)).toBeNull();
  });
});

describe('bringing marbles out', () => {
  it('brings one marble out onto the start with a 1 or a 6', () => {
    expect(show(legalMoves(state([[C, C, C, C], [C, C, C, C]], { rolled: 1 })))).toEqual(['0:-1>0+out']);
    expect(show(legalMoves(state([[C, C, C, C], [C, C, C, C]], { rolled: 6 })))).toEqual(['0:-1>0+out']);
  });

  it('cannot bring one out on any other roll, so the turn passes', () => {
    for (const r of [2, 3, 4, 5]) {
      const s = state([[C, C, C, C], [C, C, C, C]], { rolled: r });
      expect(legalMoves(s)).toEqual([]);
      const after = pass(s)!;
      expect(after.turn).toBe(1);
      expect(after.last).toEqual({ seat: 0, roll: r, move: null });
    }
  });

  it('cannot bring one out while your own marble sits on the start', () => {
    const s = state([[0, C, C, C], [C, C, C, C]], { rolled: 1 });
    expect(show(legalMoves(s))).toEqual(['0:0>1']);
  });

  it('can also move a marble on the track with a 1 or a 6 instead', () => {
    const s = state([[4, C, C, C], [C, C, C, C]], { rolled: 6 });
    expect(show(legalMoves(s))).toEqual(['1:-1>0+out', '0:4>10']);
  });

  it('sends home another marble sitting on your start', () => {
    // Hole 30 is the first opponent's progress 20
    const s = state([[C, C, C, C], [20, C, C, C]], { rolled: 6 });
    const after = move(s, find(s, 0))!;
    expect(after.marbles).toEqual([[0, C, C, C], [C, C, C, C]]);
  });
});

describe('rolling a 6', () => {
  it('gives another roll after moving', () => {
    const s = state([[C, C, C, C], [C, C, C, C]], { rolled: 6 });
    const after = move(s, find(s, 0))!;
    expect(after.turn).toBe(0);
    expect(after.rolled).toBeNull();
    expect(after.last?.roll).toBe(6);
  });

  it('gives another roll even with no move', () => {
    const s = state([[38, 40, 41, 43], [C, C, C, C]], { rolled: 6 });
    expect(legalMoves(s)).toEqual([]);
    expect(pass(s)!.turn).toBe(0);
  });

  it('any other roll passes the turn round the table', () => {
    const s = state([[3, C, C, C], [C, C, C, C], [C, C, C, C]], { rolled: 2 });
    expect(move(s, find(s, 5))!.turn).toBe(1);
    const last = state([[C, C, C, C], [C, C, C, C], [3, C, C, C]], { rolled: 2, turn: 2 });
    expect(move(last, find(last, 5))!.turn).toBe(0);
  });
});

describe('moving', () => {
  it('moves a marble that many holes clockwise', () => {
    const s = state([[10, C, C, C], [C, C, C, C]], { rolled: 3 });
    expect(show(legalMoves(s))).toEqual(['0:10>13']);
    expect(move(s, find(s, 13))!.marbles[0]).toEqual([13, C, C, C]);
  });

  it('refuses a move that is not legal', () => {
    const s = state([[10, C, C, C], [C, C, C, C]], { rolled: 3 });
    expect(move(s, { marble: 0, from: 10, to: 14, out: false, hop: false, captures: [] })).toBeNull();
    expect(move(state([[10, C, C, C], [C, C, C, C]]), find(s, 13))).toBeNull();
  });

  it('cannot land on your own marble, but can pass it', () => {
    const s = state([[10, 13, C, C], [C, C, C, C]], { rolled: 3 });
    expect(show(legalMoves(s))).toEqual(['1:13>16']);
    const past = state([[10, 11, C, C], [C, C, C, C]], { rolled: 3 });
    expect(show(legalMoves(past))).toEqual(['0:10>13', '1:11>14']);
  });

  it('sends home another player\'s marble it lands on exactly', () => {
    // Your progress 13 is hole 3, the second opponent's progress 3
    const s = state([[10, C, C, C], [C, C, C, C], [3, 8, C, C]], { rolled: 3 });
    const m = find(s, 13);
    expect(m.captures).toEqual([{ seat: 2, marble: 0 }]);
    expect(move(s, m)!.marbles).toEqual([[13, C, C, C], [C, C, C, C], [C, 8, C, C]]);
  });

  it('never touches a marble inside its own home lane', () => {
    // Hole 11 is your progress 21; the first opponent's marble at 41 is in its lane, not on the track
    const s = state([[18, C, C, C], [41, C, C, C]], { rolled: 3 });
    const m = find(s, 21);
    expect(m.captures).toEqual([]);
    expect(move(s, m)!.marbles[1]).toEqual([41, C, C, C]);
  });

  it('does not change the state it was given', () => {
    const s = state([[10, C, C, C], [C, C, C, C], [3, C, C, C]], { rolled: 3 });
    const copy = structuredClone(s);
    move(s, find(s, 13));
    expect(s).toEqual(copy);
  });
});

describe('the home lane', () => {
  it('turns into the lane after the hole before the start', () => {
    const s = state([[37, C, C, C], [C, C, C, C]], { rolled: 3 });
    expect(show(legalMoves(s))).toEqual(['0:37>40']);
    expect(homeCount(move(s, find(s, 40))!.marbles[0])).toBe(1);
  });

  it('needs an exact roll: no overshooting the end of the lane', () => {
    expect(show(legalMoves(state([[37, C, C, C], [C, C, C, C]], { rolled: 6 })))).toEqual(['1:-1>0+out', '0:37>43']);
    expect(legalMoves(state([[39, C, C, C], [C, C, C, C]], { rolled: 5 }))).toEqual([]);
  });

  it('cannot land on your own marble in the lane, and moves along it', () => {
    expect(legalMoves(state([[38, 41, C, C], [C, C, C, C]], { rolled: 3 }))).toEqual([]);
    expect(show(legalMoves(state([[40, 43, 30, 20], [C, C, C, C]], { rolled: 2 })))).toEqual(['0:40>42', '2:30>32', '3:20>22']);
  });
});

describe('lily pads', () => {
  // Your progress 5 is the pad at hole 35, across from the pad at 15 (your progress 25)
  it('may hop across the pond to the opposite pad, 20 holes forward', () => {
    const s = state([[2, C, C, C], [C, C, C, C]], { rolled: 3 });
    expect(show(legalMoves(s))).toEqual(['0:2>5', '0:2>25+hop']);
    const after = move(s, find(s, 25, true))!;
    expect(after.marbles[0]).toEqual([25, C, C, C]);
    expect(after.last?.move?.hop).toBe(true);
  });

  it('can also stay on the pad', () => {
    const s = state([[2, C, C, C], [C, C, C, C]], { rolled: 3 });
    expect(move(s, find(s, 5))!.marbles[0]).toEqual([5, C, C, C]);
  });

  it('never hops past its own lane entry', () => {
    // Progress 25 (hole 15) would hop to 45, past the lane
    expect(show(legalMoves(state([[22, C, C, C], [C, C, C, C]], { rolled: 3 })))).toEqual(['0:22>25']);
    // Progress 15 (hole 5) hops to 35, still short of it
    expect(show(legalMoves(state([[12, C, C, C], [C, C, C, C]], { rolled: 3 })))).toEqual(['0:12>15', '0:12>35+hop']);
  });

  it('cannot hop onto your own marble', () => {
    expect(show(legalMoves(state([[2, 25, C, C], [C, C, C, C]], { rolled: 3 })))).toEqual(['0:2>5', '1:25>28']);
  });

  it('sends home a marble on the far pad', () => {
    // Hole 15 is the first opponent's progress 5
    const s = state([[2, C, C, C], [5, C, C, C]], { rolled: 3 });
    const hop = find(s, 25, true);
    expect(hop.captures).toEqual([{ seat: 1, marble: 0 }]);
    expect(move(s, hop)!.marbles[1]).toEqual([C, C, C, C]);
  });

  it('sends home a marble on the pad it lands on, before hopping', () => {
    // Hole 35 is the first opponent's progress 25, hole 15 the second opponent's progress 15
    const s = state([[2, C, C, C], [25, C, C, C], [15, C, C, C]], { rolled: 3 });
    const hop = find(s, 25, true);
    expect(hop.captures).toHaveLength(2);
    expect(move(s, hop)!.marbles).toEqual([[25, C, C, C], [C, C, C, C], [C, C, C, C]]);
  });

  it('works the same for the opponents', () => {
    // The first opponent's progress 5 is hole 15, across from hole 35 (its progress 25)
    const s = state([[C, C, C, C], [1, C, C, C]], { rolled: 4, turn: 1 });
    expect(show(legalMoves(s))).toEqual(['0:1>5', '0:1>25+hop']);
  });
});

describe('winning', () => {
  it('ends the game when all four marbles are in the lane', () => {
    const s = state([[40, 41, 42, 38], [10, C, C, C]], { rolled: 5 });
    const after = move(s, find(s, 43))!;
    expect(after.phase).toBe('done');
    expect(after.winner).toBe(0);
    expect(after.tally).toEqual([1, 0, 0]);
    expect(after.turn).toBe(0);
    expect(roll(after, 3)).toBeNull();
    expect(legalMoves({ ...after, rolled: 3 })).toEqual([]);
  });

  it('an opponent can win too, even on a 6', () => {
    const s = state([[C, C, C, C], [40, 41, 42, 37]], { rolled: 6, turn: 1 });
    const after = move(s, find(s, 43))!;
    expect(after.winner).toBe(1);
    expect(after.tally).toEqual([0, 1, 0]);
  });
});

describe('passing', () => {
  it('is only allowed when the roll has no move', () => {
    expect(pass(state([[10, C, C, C], [C, C, C, C]], { rolled: 3 }))).toBeNull();
    expect(pass(state([[10, C, C, C], [C, C, C, C]]))).toBeNull();
  });
});

describe('the opponents', () => {
  const pick = (s: PondHopState) => show([chooseMove(s)!])[0];

  it('send someone home first', () => {
    // The first opponent at 20 could come out on a 6, hop, or land on your marble at hole 36 (its progress 26)
    const s = state([[6, C, C, C], [20, C, C, C]], { rolled: 6, turn: 1 });
    expect(pick(s)).toBe('0:20>26x1');
  });

  it('prefer sending home the most marbles', () => {
    const s = state([[2, C, C, C], [25, C, C, C], [15, 3, C, C]], { rolled: 3 });
    // Your options: 2>5 sends one home, 2>25 hop sends two home
    expect(pick(s)).toBe('0:2>25+hopx2');
  });

  it('then bring a marble out', () => {
    const s = state([[C, C, C, C], [2, C, C, C]], { rolled: 6, turn: 1 });
    expect(pick(s)).toBe('1:-1>0+out');
  });

  it('then hop', () => {
    const s = state([[C, C, C, C], [2, 36, 0, C]], { rolled: 3, turn: 1 });
    expect(pick(s)).toBe('0:2>25+hop');
  });

  it('then move into the lane', () => {
    const s = state([[C, C, C, C], [37, 10, C, C]], { rolled: 4, turn: 1 });
    expect(pick(s)).toBe('0:37>41');
  });

  it('otherwise move the marble furthest behind', () => {
    const s = state([[C, C, C, C], [20, 8, 30, C]], { rolled: 4, turn: 1 });
    expect(pick(s)).toBe('1:8>12');
  });

  it('have no choice when nothing can move', () => {
    expect(chooseMove(state([[C, C, C, C], [C, C, C, C]], { rolled: 3, turn: 1 }))).toBeNull();
  });

  it('take a whole turn: roll, then move or pass', () => {
    const s = state([[C, C, C, C], [C, C, C, C]], { turn: 1 });
    const out = takeTurn(s, 6);
    expect(out.marbles[1]).toEqual([0, C, C, C]);
    expect(out.turn).toBe(1);
    const stuck = takeTurn(s, 3);
    expect(stuck.turn).toBe(0);
    expect(stuck.last).toEqual({ seat: 1, roll: 3, move: null });
  });

  it('always finish a game when every seat is played by the computer', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const random = seededRandom(seed);
      let s = newGame(seed % 2 === 0 ? 2 : 1);
      let turns = 0;
      for (; turns < 5000 && s.phase === 'play'; turns++) {
        s = takeTurn(s, rollDie(random));
        // Nobody shares a track hole, and your own marbles never share a spot
        const holes = s.marbles.flatMap((own, seat) => own.map((p) => holeOf(seat, p)).filter((h) => h !== null));
        expect(new Set(holes).size).toBe(holes.length);
        for (const own of s.marbles) {
          const placed = own.filter((p) => p !== C);
          expect(new Set(placed).size).toBe(placed.length);
        }
      }
      expect(s.phase).toBe('done');
      expect(homeCount(s.marbles[s.winner!])).toBe(4);
    }
  });
});

describe('saving', () => {
  const game = (seed: number, opponents: 1 | 2, turns: number) => {
    const random = seededRandom(seed);
    let s = newGame(opponents);
    for (let i = 0; i < turns && s.phase === 'play'; i++) s = takeTurn(s, rollDie(random));
    return s;
  };

  it('restores a game in progress exactly, including a roll waiting to be used', () => {
    const g = { ...roll(game(3, 2, 80), 5)!, tally: [1, 4, 2] };
    const saved = { game: g, opponents: 2 as const, showTally: true };
    expect(deserialize(serialize(saved))).toEqual(saved);
  });

  it('restores a finished game with its winner', () => {
    const g = game(4, 1, 5000);
    expect(g.phase).toBe('done');
    const saved = { game: g, opponents: 1 as const, showTally: false };
    expect(deserialize(serialize(saved))).toEqual(saved);
  });

  it('refuses damaged saves', () => {
    const good = JSON.parse(serialize({ game: game(5, 2, 60), opponents: 2, showTally: false }));
    expect(deserialize(null)).toBeNull();
    expect(deserialize('not json')).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, v: 2 }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, m: [[0, 0, C, C], [C, C, C, C]] }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, m: [[0, C, C, C], [20, C, C, C]] }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, m: [[44, C, C, C], [C, C, C, C]] }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, m: [[C, C, C], [C, C, C, C]] }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, t: 3 }))).toBeNull();
  });
});
