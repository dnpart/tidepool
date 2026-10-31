import { describe, expect, it } from 'vitest';
import { seededRandom } from '../../util/random';
import {
  choosePlay,
  createSet,
  draw,
  EMPTY_TALLY,
  handPips,
  legalPlays,
  mustDraw,
  mustPass,
  newGame,
  newRound,
  opening,
  openEnds,
  pass,
  play,
  resetTally,
  takeTurn,
  tileId,
  type DominoesState,
  type Placed,
  type Tile,
} from './rules';
import { deserialize, serialize } from './storage';

// --- helpers ---

/** "36" is the tile 3 | 6. */
const t = (id: string): Tile => {
  const [x, y] = [Number(id[0]), Number(id[1])];
  return { a: Math.min(x, y), b: Math.max(x, y) };
};
const tiles = (ids: string): Tile[] => (ids ? ids.split(' ').map(t) : []);
/** "63 34" is a line 6|3 then 3|4, left to right. */
const line = (ids: string): Placed[] => (ids ? ids.split(' ').map((id) => ({ left: Number(id[0]), right: Number(id[1]) })) : []);
const shown = (s: DominoesState) => s.line.map((p) => `${p.left}${p.right}`).join(' ');

function state(opts: { hands: string[]; boneyard?: string; line?: string; turn?: number }): DominoesState {
  return {
    hands: opts.hands.map(tiles),
    boneyard: tiles(opts.boneyard ?? ''),
    line: line(opts.line ?? ''),
    turn: opts.turn ?? 0,
    drawn: 0,
    last: null,
    phase: 'play',
    result: null,
    tally: [...EMPTY_TALLY],
  };
}

const allTiles = (s: DominoesState) => [
  ...s.hands.flat().map(tileId),
  ...s.boneyard.map(tileId),
  ...s.line.map((p) => tileId({ a: Math.min(p.left, p.right), b: Math.max(p.left, p.right) })),
];

// --- tests ---

describe('the set', () => {
  it('has 28 tiles, every pair of numbers 0 to 6 once', () => {
    const set = createSet();
    expect(set).toHaveLength(28);
    expect(new Set(set.map(tileId)).size).toBe(28);
    expect(set.every((x) => x.a <= x.b && x.a >= 0 && x.b <= 6)).toBe(true);
    expect(set.filter((x) => x.a === x.b)).toHaveLength(7);
  });
});

describe('dealing', () => {
  it('deals 5 each with two opponents, leaving 13 in the boneyard', () => {
    const s = newGame(2, seededRandom(1));
    expect(s.hands.map((h) => h.length)).toEqual([5, 5, 5]);
    expect(s.boneyard).toHaveLength(13);
    expect(s.line).toEqual([]);
    expect(new Set(allTiles(s)).size).toBe(28);
  });

  it('deals 7 each with one opponent, leaving 14 in the boneyard', () => {
    const s = newGame(1, seededRandom(2));
    expect(s.hands.map((h) => h.length)).toEqual([7, 7]);
    expect(s.boneyard).toHaveLength(14);
    expect(new Set(allTiles(s)).size).toBe(28);
  });

  it('keeps the tally for a new round, and starts with an empty one for a new game', () => {
    const s = newRound(1, [3, 1, 2], seededRandom(3));
    expect(s.tally).toEqual([3, 1, 2]);
    expect(newGame(2, seededRandom(3)).tally).toEqual([0, 0, 0]);
    expect(resetTally(s).tally).toEqual([0, 0, 0]);
  });

  it('gives different deals for different seeds', () => {
    expect(newGame(2, seededRandom(4)).hands).not.toEqual(newGame(2, seededRandom(5)).hands);
  });
});

describe('who starts', () => {
  it('is whoever holds the highest double', () => {
    const hands = [tiles('12 33 46'), tiles('55 06'), tiles('00 56')];
    expect(opening(hands)).toEqual({ seat: 1, index: 0 });
  });

  it('is the highest tile by pips when nobody has a double', () => {
    expect(opening([tiles('12 45'), tiles('36 01'), tiles('02 14')])).toEqual({ seat: 1, index: 0 });
    expect(opening([tiles('12 56'), tiles('36 01')])).toEqual({ seat: 0, index: 1 });
  });

  it('a double beats a bigger non-double', () => {
    expect(opening([tiles('56'), tiles('11')])).toEqual({ seat: 1, index: 0 });
  });

  it('a new round gives the turn to that player, and only the opening tile can be played', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = newGame(2, seededRandom(seed));
      const first = opening(s.hands);
      expect(s.turn).toBe(first.seat);
      expect(legalPlays(s)).toEqual([{ index: first.index, end: 'right' }]);
    }
  });

  it('refuses any other tile as the first play', () => {
    const s = state({ hands: ['55 12', '34'] });
    expect(play(s, 1, 'right')).toBeNull();
    const after = play(s, 0, 'left')!;
    expect(shown(after)).toBe('55');
    expect(after.turn).toBe(1);
  });
});

describe('legal plays', () => {
  it('lists each tile that matches an open end, on that end', () => {
    const s = state({ hands: ['34 61 22', '00'], line: '36 65' });
    expect(openEnds(s)).toEqual({ left: 3, right: 5 });
    expect(legalPlays(s)).toEqual([{ index: 0, end: 'left' }]);
  });

  it('lists a tile that fits both ends twice', () => {
    const s = state({ hands: ['35 00', '11'], line: '36 65' });
    expect(legalPlays(s)).toEqual([
      { index: 0, end: 'left' },
      { index: 0, end: 'right' },
    ]);
  });

  it('refuses a tile that does not fit, or the wrong end', () => {
    const s = state({ hands: ['34 22', '00'], line: '36 65' });
    expect(play(s, 1, 'left')).toBeNull();
    expect(play(s, 0, 'right')).toBeNull();
  });
});

describe('playing a tile', () => {
  it('turns the tile so its matching number touches the line, on either end', () => {
    const s = state({ hands: ['34 15 00', '11'], line: '36 65' });
    expect(shown(play(s, 0, 'left')!)).toBe('43 36 65');
    expect(shown(play(s, 1, 'right')!)).toBe('36 65 51');
  });

  it('lays a double across the end, keeping the same number open', () => {
    const s = state({ hands: ['55 00', '11'], line: '36 65' });
    const after = play(s, 0, 'right')!;
    expect(shown(after)).toBe('36 65 55');
    expect(openEnds(after)).toEqual({ left: 3, right: 5 });
  });

  it('takes the tile out of the hand and passes the turn on round the table', () => {
    const s = state({ hands: ['34 00', '11', '22'], line: '36 65', boneyard: '44', turn: 0 });
    const after = play(s, 0, 'left')!;
    expect(after.hands[0]).toEqual(tiles('00'));
    expect(after.turn).toBe(1);
    expect(after.last).toEqual({ seat: 0, drew: 0, played: t('34') });
    const third = state({ hands: ['00', '11', '34 66'], line: '36 65', boneyard: '44', turn: 2 });
    expect(play(third, 0, 'left')!.turn).toBe(0);
  });

  it('with one opponent, the turn goes back and forth', () => {
    const s = state({ hands: ['34 00', '11 22'], line: '36 65', boneyard: '44' });
    expect(play(s, 0, 'left')!.turn).toBe(1);
  });

  it('does not change the state it was given', () => {
    const s = state({ hands: ['34 00', '11'], line: '36 65', boneyard: '44' });
    const copy = structuredClone(s);
    play(s, 0, 'left');
    draw(state({ hands: ['00', '11'], line: '36 65', boneyard: '44' }));
    expect(s).toEqual(copy);
  });
});

describe('drawing and passing', () => {
  it('draws only when nothing fits, one tile at a time', () => {
    const fitsNow = state({ hands: ['34', '11'], line: '36', boneyard: '22 44' });
    expect(mustDraw(fitsNow)).toBe(false);
    expect(draw(fitsNow)).toBeNull();

    const s = state({ hands: ['00', '11'], line: '36', boneyard: '22 44 15' });
    expect(mustDraw(s)).toBe(true);
    const once = draw(s)!;
    expect(once.hands[0]).toEqual(tiles('00 15'));
    expect(once.boneyard).toEqual(tiles('22 44'));
    expect(once.drawn).toBe(1);
    expect(once.turn).toBe(0);
  });

  it('keeps drawing until a tile fits, then that tile can be played', () => {
    const s = state({ hands: ['00', '11'], line: '36', boneyard: '22 46 15' });
    const a = draw(s)!;
    const b = draw(a)!;
    expect(mustDraw(b)).toBe(false);
    expect(legalPlays(b)).toEqual([{ index: 2, end: 'right' }]);
    const after = play(b, 2, 'right')!;
    expect(after.last).toEqual({ seat: 0, drew: 2, played: t('46') });
    expect(after.drawn).toBe(0);
  });

  it('passes only when nothing fits and the boneyard is empty', () => {
    expect(pass(state({ hands: ['00', '11'], line: '36', boneyard: '22' }))).toBeNull();
    expect(pass(state({ hands: ['34', '11'], line: '36' }))).toBeNull();

    const s = state({ hands: ['00', '13'], line: '36' });
    expect(mustPass(s)).toBe(true);
    const after = pass(s)!;
    expect(after.turn).toBe(1);
    expect(after.phase).toBe('play');
    expect(after.last).toEqual({ seat: 0, drew: 0, played: null });
  });
});

describe('the end of a round', () => {
  it('ends when someone plays their last tile, and they win', () => {
    const s = state({ hands: ['34', '11 22', '56'], line: '36' });
    const after = play(s, 0, 'left')!;
    expect(after.phase).toBe('done');
    expect(after.result).toEqual({ winner: 0, blocked: false, pips: [0, 6, 11] });
    expect(after.tally).toEqual([1, 0, 0]);
    expect(legalPlays(after)).toEqual([]);
  });

  it('an opponent can go out too', () => {
    const s = state({ hands: ['00 11', '34'], line: '36', turn: 1 });
    const after = play(s, 0, 'left')!;
    expect(after.result?.winner).toBe(1);
    expect(after.tally).toEqual([0, 1, 0]);
  });

  it('is blocked when nobody can play and the boneyard is empty: the lowest pips win', () => {
    // After 3|4 goes on, the ends are 4 and 6: nobody holds a 4 or a 6
    const s = state({ hands: ['34 00', '11 22', '55'], line: '36' });
    const after = play(s, 0, 'left')!;
    expect(after.phase).toBe('done');
    expect(after.result).toEqual({ winner: 0, blocked: true, pips: [0, 6, 10] });
    expect(after.tally).toEqual([1, 0, 0]);
  });

  it('is not blocked while someone else can still play', () => {
    const s = state({ hands: ['34 00', '11 22', '45'], line: '36' });
    const after = play(s, 0, 'left')!;
    expect(after.phase).toBe('play');
    expect(after.turn).toBe(1);
    expect(mustPass(after)).toBe(true);
    expect(pass(after)!.turn).toBe(2);
  });

  it('a blocked tie on pips goes to the player with fewer tiles', () => {
    // Ends 4 and 6 after the play; seat 1 and seat 2 both have 6 pips, seat 2 in one tile
    const s = state({ hands: ['34 15 02', '11 22', '33'], line: '36' });
    const after = play(s, 0, 'left')!;
    expect(after.result).toEqual({ winner: 2, blocked: true, pips: [8, 6, 6] });
    expect(after.tally).toEqual([0, 0, 1]);
  });

  it('a blocked tie on pips and tiles is shared and counts for nobody', () => {
    const s = state({ hands: ['34 15 00', '11 22', '01 23'], line: '36' });
    const after = play(s, 0, 'left')!;
    expect(after.result).toEqual({ winner: null, blocked: true, pips: [6, 6, 6] });
    expect(after.tally).toEqual([0, 0, 0]);
  });

  it('drawing the last tile and passing can block the round', () => {
    const s = state({ hands: ['00', '11', '33'], line: '46', boneyard: '22' });
    const after = pass(draw(s)!)!;
    expect(after.phase).toBe('done');
    expect(after.result).toEqual({ winner: 1, blocked: true, pips: [4, 2, 6] });
  });

  it('counts pips in a hand', () => {
    expect(handPips(tiles('66 01 34'))).toBe(20);
    expect(handPips([])).toBe(0);
  });
});

describe('the opponents', () => {
  it('play the fitting tile with the most pips', () => {
    const s = state({ hands: ['00', '13 36 34'], line: '35', turn: 1 });
    expect(choosePlay(s)).toEqual({ index: 1, end: 'left' });
  });

  it('play a double first among tiles with the same pips', () => {
    const s = state({ hands: ['00', '26 44 35'], line: '42', turn: 1 });
    expect(choosePlay(s)).toEqual({ index: 1, end: 'left' });
  });

  it('pick the end that keeps the most of their own numbers playable', () => {
    // 2|5 fits the 5 on the left (leaving 2 and 2 open) or the 2 on the right (leaving 5 and 5 open)
    const s = state({ hands: ['00', '25 12 03'], line: '54 42', turn: 1 });
    expect(choosePlay(s)).toEqual({ index: 0, end: 'left' });
    const other = state({ hands: ['00', '25 15 03'], line: '54 42', turn: 1 });
    expect(choosePlay(other)).toEqual({ index: 0, end: 'right' });
  });

  it('play the opening tile when they start', () => {
    const s = state({ hands: ['12', '34 66 05'], turn: 1 });
    expect(choosePlay(s)).toEqual({ index: 1, end: 'right' });
  });

  it('have no choice when nothing fits', () => {
    expect(choosePlay(state({ hands: ['00', '11'], line: '36', turn: 1 }))).toBeNull();
  });

  it('take a whole turn: draw until a tile fits, then play it', () => {
    const s = state({ hands: ['00', '11 22', '44'], line: '36', boneyard: '55 06 34 12', turn: 1 });
    const after = takeTurn(s);
    expect(after.last).toEqual({ seat: 1, drew: 2, played: t('34') });
    expect(after.boneyard).toEqual(tiles('55 06'));
    expect(after.hands[1]).toEqual(tiles('11 22 12'));
    expect(after.turn).toBe(2);
    expect(shown(after)).toBe('43 36');
  });

  it('pass a whole turn when the boneyard runs out first', () => {
    const s = state({ hands: ['00', '11', '34 33'], line: '36', boneyard: '22', turn: 1 });
    const after = takeTurn(s);
    expect(after.last).toEqual({ seat: 1, drew: 1, played: null });
    expect(after.boneyard).toEqual([]);
    expect(after.turn).toBe(2);
  });

  it('always finish a round when every seat is played by the computer', () => {
    for (let seed = 1; seed <= 200; seed++) {
      let s = newGame(seed % 2 === 0 ? 2 : 1, seededRandom(seed));
      for (let guard = 0; guard < 200 && s.phase === 'play'; guard++) s = takeTurn(s);
      expect(s.phase).toBe('done');
      expect(new Set(allTiles(s)).size).toBe(28);
      expect(allTiles(s)).toHaveLength(28);
      for (let i = 1; i < s.line.length; i++) expect(s.line[i - 1].right).toBe(s.line[i].left);
      const { winner, pips } = s.result!;
      expect(pips).toEqual(s.hands.map(handPips));
      if (!s.result!.blocked) expect(s.hands[winner!]).toEqual([]);
    }
  });
});

describe('saving', () => {
  const round = (seed: number, opponents: 1 | 2, turns: number) => {
    let s = newGame(opponents, seededRandom(seed));
    for (let i = 0; i < turns && s.phase === 'play'; i++) s = takeTurn(s);
    return s;
  };

  it('restores a round in progress exactly', () => {
    const game = { ...round(7, 2, 5), tally: [2, 1, 4] };
    const saved = { game, opponents: 2 as const, showTally: true };
    expect(deserialize(serialize(saved))).toEqual(saved);
  });

  it('restores a finished round with its result', () => {
    const game = round(8, 1, 200);
    expect(game.phase).toBe('done');
    const saved = { game, opponents: 1 as const, showTally: false };
    expect(deserialize(serialize(saved))).toEqual(saved);
  });

  it('refuses damaged saves', () => {
    const good = JSON.parse(serialize({ game: round(9, 2, 3), opponents: 2, showTally: false }));
    expect(deserialize(null)).toBeNull();
    expect(deserialize('not json')).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, v: 2 }))).toBeNull();
    // A tile missing, a tile twice, a tile that doesn't exist, a broken line, a turn for nobody
    expect(deserialize(JSON.stringify({ ...good, b: good.b.slice(1) }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, b: [...good.b.slice(1), good.h[0][0]] }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, b: [...good.b.slice(1), '78'] }))).toBeNull();
    const flip = good.l.findIndex((id: string, i: number) => i > 0 && id[0] !== id[1]);
    expect(flip).toBeGreaterThan(0);
    const broken = good.l.map((id: string, i: number) => (i === flip ? id[1] + id[0] : id));
    expect(deserialize(JSON.stringify({ ...good, l: broken }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...good, t: 3 }))).toBeNull();
  });
});
