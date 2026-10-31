import { describe, expect, it } from 'vitest';
import { cardId, type Card, type Rank, type Suit } from '../../cards/deck';
import { seededRandom } from '../../util/random';
import {
  actingSeat,
  call,
  callChance,
  choosePlay,
  claimText,
  computerMove,
  letGo,
  newGame,
  nextGame,
  nextRank,
  pileSize,
  play,
  rankPlural,
  sortHand,
  viewFor,
  type FishyState,
  type Opponents,
  type Play,
} from './rules';
import { deserialize, serialize } from './storage';

// --- helpers ---

const SUIT: Record<string, Suit> = { h: 'hearts', d: 'diamonds', s: 'spades', c: 'clubs' };
/** "7h", "13s", "1c" (the same as cardId). */
const c = (id: string): Card => ({ rank: Number(id.slice(0, -1)) as Rank, suit: SUIT[id.slice(-1)] });
const cs = (list: string) => list.split(' ').filter(Boolean).map(c);
const idsOf = (cards: readonly Card[]) => cards.map(cardId);

/** A game in the play phase with these hands (other cards simply aren't in play), the given rank due and turn. */
function state(hands: string[], opts: { due?: Rank; turn?: number; pile?: Play[] } = {}): FishyState {
  return {
    hands: hands.map((h) => sortHand(cs(h))),
    aside: [],
    pile: opts.pile ?? [],
    due: opts.due ?? 1,
    phase: 'play',
    turn: opts.turn ?? 0,
    asking: null,
    last: null,
    winner: null,
    starter: 0,
    plays: 0,
    tally: [0, 0, 0, 0],
  };
}

/** Plays and lets everyone else let it go. */
function playAndPass(s: FishyState, ids: string[]): FishyState {
  let next = play(s, ids)!;
  while (next.phase === 'call') next = letGo(next)!;
  return next;
}

// --- words ---

describe('words', () => {
  it('says claims the way a person would', () => {
    expect(claimText(1, 1)).toBe('One Ace');
    expect(claimText(2, 7)).toBe('Two 7s');
    expect(claimText(3, 12)).toBe('Three Queens');
    expect(claimText(4, 10)).toBe('Four 10s');
    expect(claimText(1, 11)).toBe('One Jack');
    expect(rankPlural(13)).toBe('Kings');
    expect(rankPlural(6)).toBe('6s');
  });

  it('goes up from Aces to Kings, then back to Aces', () => {
    expect(nextRank(1)).toBe(2);
    expect(nextRank(12)).toBe(13);
    expect(nextRank(13)).toBe(1);
  });
});

// --- dealing ---

describe('newGame', () => {
  it.each([
    [1, [17, 17], 18],
    [2, [18, 17, 17], 0],
    [3, [13, 13, 13, 13], 0],
  ] as const)('deals all 52 cards round %i opponent(s), starting with you', (opponents, sizes, aside) => {
    const g = newGame(opponents, { random: seededRandom(opponents) });
    expect(g.hands.map((h) => h.length)).toEqual(sizes);
    expect(g.aside).toHaveLength(aside);
    const all = [...g.hands.flat(), ...g.aside].map(cardId);
    expect(new Set(all).size).toBe(52);
    expect(g.hands.every((h) => h.every((card, i) => i === 0 || h[i - 1].rank <= card.rank))).toBe(true);
    expect(g).toMatchObject({ due: 1, phase: 'play', turn: 0, starter: 0, pile: [], winner: null, plays: 0 });
  });

  it('moves the starting seat round one each game and keeps the tally', () => {
    let g = { ...newGame(2, { random: seededRandom(1) }), tally: [2, 1, 0, 0] };
    g = nextGame(g, 2, seededRandom(2));
    expect([g.starter, g.turn]).toEqual([1, 1]);
    expect(g.tally).toEqual([2, 1, 0, 0]);
    g = nextGame(nextGame(g, 2), 2);
    expect(g.starter).toBe(0);
    // Fewer seats next game: the starter wraps into range
    expect(nextGame({ ...g, starter: 2 }, 1).starter).toBe(1);
  });
});

// --- playing ---

describe('play', () => {
  it('puts 1 to 4 cards from the hand down, claimed as the rank due, and asks the next seat', () => {
    const s = state(['1h 1s 5d 9c', '2h', '3h']);
    const next = play(s, ['1h', '5d'])!;
    expect(idsOf(next.hands[0])).toEqual(['1s', '9c']);
    expect(next.pile).toEqual([{ seat: 0, cards: cs('1h 5d'), rank: 1 }]);
    expect(next).toMatchObject({ due: 2, phase: 'call', asking: 1, plays: 1 });
    expect(next.last).toEqual({ kind: 'play', seat: 0, count: 2, rank: 1 });
    expect(s.hands[0]).toHaveLength(4); // unchanged
  });

  it('refuses no cards, more than four, the same card twice, or cards not in that hand', () => {
    const s = state(['1h 1s 1d 1c 2h', '3h']);
    expect(play(s, [])).toBeNull();
    expect(play(s, ['1h', '1s', '1d', '1c', '2h'])).toBeNull();
    expect(play(s, ['1h', '1h'])).toBeNull();
    expect(play(s, ['3h'])).toBeNull();
    expect(play(s, ['1h', '1s', '1d', '1c'])).not.toBeNull();
  });

  it('only lets the seat whose turn it is play, and only in the play phase', () => {
    const s = play(state(['1h 2h', '3h 4h']), ['1h'])!;
    expect(play(s, ['2h'])).toBeNull(); // waiting for calls
    expect(play(state(['1h', '3h'], { turn: 1 }), ['1h'])).toBeNull();
  });

  it('wraps from Kings back to Aces', () => {
    expect(play(state(['13h 2h', '3h'], { due: 13 }), ['13h'])!.due).toBe(1);
  });
});

// --- calls ---

describe('calls', () => {
  it('asks each other seat in turn, starting after the player; if nobody calls, the play stands', () => {
    let s = play(state(['5h', '1h 1s', '3h 3s'], { turn: 1 }), ['1h'])!;
    expect(s.asking).toBe(2);
    s = letGo(s)!;
    expect(s.asking).toBe(0);
    expect(s.last).toEqual({ kind: 'letGo', seat: 2 });
    s = letGo(s)!;
    expect(s).toMatchObject({ phase: 'play', turn: 2, asking: null, due: 2 });
    expect(pileSize(s)).toBe(1);
  });

  it('a caught lie: the player picks up the whole pile, and play goes on after them', () => {
    const earlier: Play = { seat: 2, cards: cs('12h 12s'), rank: 13 };
    let s = play(state(['5h 9d', '3h', '4h 4s'], { pile: [earlier] }), ['9d'])!;
    s = call(s)!;
    expect(idsOf(s.hands[0])).toEqual(['5h', '9d', '12h', '12s']);
    expect(s.pile).toEqual([]);
    expect(s.last).toEqual({ kind: 'call', caller: 1, player: 0, rank: 1, lie: true, cards: cs('9d'), pickedUp: 0, size: 3 });
    expect(s).toMatchObject({ phase: 'play', turn: 1, due: 2 });
  });

  it('an honest play: the caller picks up the whole pile', () => {
    let s = play(state(['1h 1s 7c', '3h', '4h']), ['1h', '1s'])!;
    s = letGo(s)!; // seat 1 lets it go
    s = call(s)!; // seat 2 calls
    expect(idsOf(s.hands[2])).toEqual(['1h', '1s', '4h']);
    expect(s.last).toMatchObject({ kind: 'call', caller: 2, player: 0, lie: false, pickedUp: 2, size: 2 });
    expect(s).toMatchObject({ phase: 'play', turn: 1 });
  });

  it('one wrong card in a play makes it a lie', () => {
    const s = call(play(state(['1h 2h', '3h']), ['1h', '2h'])!)!;
    expect(s.last).toMatchObject({ lie: true, pickedUp: 0 });
  });

  it('only works while a play is waiting', () => {
    expect(call(state(['1h', '2h']))).toBeNull();
    expect(letGo(state(['1h', '2h']))).toBeNull();
  });
});

// --- winning ---

describe('winning', () => {
  it('your last card wins when everyone lets it go', () => {
    const s = playAndPass(state(['1h', '3h', '4h']), ['1h']);
    expect(s).toMatchObject({ phase: 'done', winner: 0, tally: [1, 0, 0, 0] });
    expect(actingSeat(s)).toBeNull();
  });

  it('an honest last card wins even when called, and the caller still picks up', () => {
    const s = call(play(state(['1h', '3h', '4h']), ['1h'])!)!;
    expect(s).toMatchObject({ phase: 'done', winner: 0 });
    expect(idsOf(s.hands[1])).toEqual(['1h', '3h']);
  });

  it("a caught lie on the last card doesn't win: the player picks up and plays on", () => {
    const s = call(play(state(['5h', '3h', '4h']), ['5h'])!)!;
    expect(s).toMatchObject({ phase: 'play', winner: null, turn: 1 });
    expect(idsOf(s.hands[0])).toEqual(['5h']);
  });

  it("doesn't win before the calls are answered", () => {
    const s = play(state(['1h', '3h']), ['1h'])!;
    expect(s).toMatchObject({ phase: 'call', winner: null });
  });
});

// --- the opponents ---

describe('opponents', () => {
  it('play every card of the rank due', () => {
    const view = viewFor(state(['2h', '7h 7s 7d 9c 13h'], { due: 7, turn: 1 }), 1);
    expect(choosePlay(view, 'careful', () => 0.99).sort()).toEqual(['7d', '7h', '7s']);
  });

  it('a bold one sometimes slips in one more card', () => {
    const view = viewFor(state(['2h', '7h 9c 13h'], { due: 7, turn: 1 }), 1);
    expect(choosePlay(view, 'bold', () => 0)).toHaveLength(2);
    expect(choosePlay(view, 'careful', () => 0)).toEqual(['7h']);
  });

  it('without the rank due, bluff with the card they will need furthest in the future', () => {
    // Two seats, 5s due: seat 1 will next need 7s, then 9s, Js, Ks, 2s, 4s, 6s, 8s, 10s, Qs, Aces, 3s
    const view = viewFor(state(['2h', '7h 3c 10d'], { due: 5, turn: 1 }), 1);
    expect(choosePlay(view, 'steady', () => 0.99)).toEqual(['3c']);
    expect(choosePlay(view, 'bold', () => 0).sort()).toEqual(['10d', '3c']);
  });

  it('always call a claim that cannot be true', () => {
    // Seat 0 claims two 9s; seat 1 holds three 9s
    const s = play(state(['9h 2c', '9s 9d 9c 4h'], { due: 9 }), ['9h', '2c'])!;
    expect(callChance(viewFor(s, 1), 'bold')).toBe(1);
  });

  it("count their own cards in the pile toward what can't be true", () => {
    // Seat 1 put two 9s down earlier and holds the third; seat 0 claims two 9s
    const earlier: Play = { seat: 1, cards: cs('9s 9d'), rank: 4 };
    const s = play(state(['9h 2c 5d', '9c 4h'], { due: 9, pile: [earlier] }), ['9h', '2c'])!;
    expect(callChance(viewFor(s, 1), 'bold')).toBe(1);
    // Without the card in the pile it could be true
    const fresh = play(state(['9h 2c 5d', '9c 4h'], { due: 9 }), ['9h', '2c'])!;
    expect(callChance(viewFor(fresh, 1), 'bold')).toBeLessThan(1);
  });

  it('usually call a claim that would let someone go out', () => {
    const s = play(state(['1h', '3h 4h']), ['1h'])!;
    expect(callChance(viewFor(s, 1), 'careful')).toBeGreaterThanOrEqual(0.9);
    // With two players a seat's chance is the whole table's
    expect(callChance(viewFor(s, 1), 'bold')).toBeGreaterThanOrEqual(0.7);
  });

  it('the careful one calls more readily than the bold one', () => {
    const s = play(state(['1h 2c 5d', '3h 4h']), ['1h', '2c'])!;
    expect(callChance(viewFor(s, 1), 'careful')).toBeGreaterThan(callChance(viewFor(s, 1), 'steady'));
    expect(callChance(viewFor(s, 1), 'steady')).toBeGreaterThan(callChance(viewFor(s, 1), 'bold'));
  });

  it("never see anyone else's cards: swapping other hands changes nothing they decide", () => {
    for (let seed = 1; seed <= 60; seed++) {
      let g = newGame(2, { random: seededRandom(seed) });
      const random = seededRandom(seed * 7);
      // Play a few moves in to get a mixed table
      for (let i = 0; i < seed % 15; i++) if (g.phase !== 'done') g = computerMove(g, random);
      if (g.phase === 'done') continue;
      const seat = actingSeat(g)!;
      const others = [0, 1, 2].filter((s) => s !== seat);
      // Swap the cards between the two other hands, keeping each hand's size
      const pool = [...g.hands[others[0]], ...g.hands[others[1]]].reverse();
      const swapped = g.hands.map((h, s) =>
        s === seat ? h : s === others[0] ? sortHand(pool.slice(0, h.length)) : sortHand(pool.slice(g.hands[others[0]].length)),
      );
      const v1 = viewFor(g, seat);
      const v2 = viewFor({ ...g, hands: swapped }, seat);
      expect(v2).toEqual(v1);
      const a = computerMove(g, seededRandom(seed));
      const b = computerMove({ ...g, hands: swapped }, seededRandom(seed));
      expect(a.last).toEqual(b.last);
    }
  });
});

// --- whole games ---

describe('whole games between computers', () => {
  it.each([1, 2, 3] as const)('always finish, with %i opponent(s)', (opponents: Opponents) => {
    const lengths: number[] = [];
    const wins = [0, 0, 0, 0];
    for (let seed = 1; seed <= 150; seed++) {
      let g = newGame(opponents, { random: seededRandom(seed) });
      const random = seededRandom(seed + 1000);
      let plays = 0;
      while (g.phase !== 'done' && plays < 3000) {
        if (g.phase === 'play') plays++;
        g = computerMove(g, random);
        // Never loses or makes a card
        expect(g.hands.flat().length + pileSize(g) + g.aside.length).toBe(52);
      }
      expect(g.phase).toBe('done');
      lengths.push(plays);
      wins[g.winner!]++;
    }
    const average = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    // Long enough to be a game, short enough not to drag (computers alone average about 35–90 plays)
    expect(average).toBeGreaterThan(15);
    expect(average).toBeLessThan(110);
    // Every seat wins sometimes
    expect(wins.slice(0, opponents + 1).every((w) => w > 0)).toBe(true);
  });
});

// --- saving ---

describe('storage', () => {
  it('round-trips a game, including a claim waiting for your call', () => {
    let g = newGame(3, { random: seededRandom(5) });
    const random = seededRandom(6);
    while (!(g.phase === 'call' && g.asking === 0)) g = computerMove(g, random);
    const saved = { game: g, opponents: 3 as const, showTally: true };
    const back = deserialize(serialize(saved))!;
    expect(back).toEqual({ ...saved, game: { ...g, last: null } });
  });

  it('round-trips a finished game', () => {
    const done = playAndPass(state(['1h', '3h']), ['1h']);
    // Pad to a full deck so the save is complete
    const full = { ...newGame(1, { random: seededRandom(1) }) };
    const winner: FishyState = { ...full, hands: [[], [...full.hands[0], ...full.hands[1]]], phase: 'done', winner: 0, tally: done.tally };
    expect(winner.aside).toHaveLength(18);
    expect(deserialize(serialize({ game: winner, opponents: 1, showTally: false }))?.game.winner).toBe(0);
  });

  it('throws away damaged saves', () => {
    const g = newGame(2, { random: seededRandom(3) });
    const good = JSON.parse(serialize({ game: g, opponents: 2, showTally: false }));
    const bad = (patch: object) => deserialize(JSON.stringify({ ...good, ...patch }));
    expect(deserialize(null)).toBeNull();
    expect(deserialize('nope')).toBeNull();
    expect(bad({ v: 2 })).toBeNull();
    expect(bad({ h: [good.h[0], good.h[1], [...good.h[2].slice(1), good.h[0][0]]] })).toBeNull(); // a card twice
    expect(bad({ h: [good.h[0], good.h[1], good.h[2].slice(1)] })).toBeNull(); // a card missing
    expect(bad({ h: [good.h[0], good.h[1], ['99x', ...good.h[2].slice(1)]] })).toBeNull();
    expect(bad({ x: [good.h[0][0]] })).toBeNull(); // set aside and in a hand
    expect(bad({ d: 14 })).toBeNull();
    expect(bad({ ph: 'call', a: 1 })).toBeNull(); // nothing on the pile to call
    expect(bad({ ph: 'done', w: 0 })).toBeNull(); // the winner still holds cards
    expect(bad({ t: 5 })).toBeNull();
    expect(bad({})).not.toBeNull();
  });
});
