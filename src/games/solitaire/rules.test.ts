import { describe, expect, it } from 'vitest';
import { cardId, type Card, type Rank, type Suit } from '../../cards/deck';
import { seededRandom } from '../../util/random';
import {
  analyze,
  autoFinish,
  autoMoveTarget,
  canAutoFinish,
  deal,
  draw,
  foundationIndex,
  foundationTarget,
  hint,
  isWon,
  legalTargets,
  moveCards,
  restart,
  tapOnCard,
  tapToPlayTarget,
  tapOnPile,
  undo,
  type Board,
  type Column,
  type Solitaire,
} from './rules';

// --- helpers ---

const SUIT_CODES: Record<string, Suit> = { h: 'hearts', d: 'diamonds', s: 'spades', c: 'clubs' };
const RANK_CODES: Record<string, Rank> = { A: 1, J: 11, Q: 12, K: 13 };

/** "10h" → 10 of hearts, "Qs" → Queen of spades. */
function c(code: string): Card {
  const rank = RANK_CODES[code.slice(0, -1)] ?? (Number(code.slice(0, -1)) as Rank);
  return { rank, suit: SUIT_CODES[code.slice(-1)] };
}
const cards = (codes: string) => (codes ? codes.split(' ').map(c) : []);
const col = (down: string, up: string): Column => ({ down: cards(down), up: cards(up) });
const emptyCol = (): Column => col('', '');

/** A foundation pile holding Ace..rank of a suit. */
const pile = (suit: Suit, rank: number): Card[] =>
  Array.from({ length: rank }, (_, i) => ({ suit, rank: (i + 1) as Rank }));

function board(parts: Partial<Board>): Board {
  return {
    stock: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: Array.from({ length: 7 }, emptyCol),
    ...parts,
  };
}

const game = (b: Board, drawCount: 1 | 3 = 1): Solitaire => ({ board: b, drawCount, moves: 0, history: [] });

function tableau(...columns: Column[]): Column[] {
  return [...columns, ...Array.from({ length: 7 - columns.length }, emptyCol)];
}

function allCards(b: Board): Card[] {
  return [...b.stock, ...b.waste, ...b.foundations.flat(), ...b.tableau.flatMap((t) => [...t.down, ...t.up])];
}

// --- tests ---

describe('deal', () => {
  const g = deal(seededRandom(1));

  it('deals 7 columns of 1 to 7 cards with only the top card face up', () => {
    g.board.tableau.forEach((column, i) => {
      expect(column.down).toHaveLength(i);
      expect(column.up).toHaveLength(1);
    });
  });

  it('leaves 24 cards in the stock and nothing else', () => {
    expect(g.board.stock).toHaveLength(24);
    expect(g.board.waste).toHaveLength(0);
    expect(g.board.foundations.every((f) => f.length === 0)).toBe(true);
    expect(g.moves).toBe(0);
    expect(g.history).toHaveLength(0);
  });

  it('uses every card exactly once', () => {
    const ids = allCards(g.board).map(cardId);
    expect(new Set(ids).size).toBe(52);
  });

  it('is repeatable with the same seed and different with another', () => {
    expect(deal(seededRandom(1))).toEqual(g);
    expect(deal(seededRandom(2))).not.toEqual(g);
  });
});

describe('drawing and the stock', () => {
  it('draws one card face up to the waste by default', () => {
    const g = game(board({ stock: cards('2h 3h 4h') }));
    const next = draw(g)!;
    expect(next.board.stock).toEqual(cards('2h 3h'));
    expect(next.board.waste).toEqual(cards('4h'));
    expect(next.moves).toBe(1);
  });

  it('draws three with Draw 3, leaving the third card on top', () => {
    const g = game(board({ stock: cards('2h 3h 4h 5h') }), 3);
    const next = draw(g)!;
    expect(next.board.stock).toEqual(cards('2h'));
    expect(next.board.waste).toEqual(cards('5h 4h 3h'));
  });

  it('draws whatever is left when fewer than three remain', () => {
    const next = draw(game(board({ stock: cards('2h 3h') }), 3))!;
    expect(next.board.stock).toHaveLength(0);
    expect(next.board.waste).toEqual(cards('3h 2h'));
  });

  it('recycles the waste into the stock in the original order', () => {
    let g = game(board({ stock: cards('2h 3h 4h') }));
    g = draw(draw(draw(g)!)!)!;
    expect(g.board.stock).toHaveLength(0);
    const recycled = draw(g)!;
    expect(recycled.board.stock).toEqual(cards('2h 3h 4h'));
    expect(recycled.board.waste).toHaveLength(0);
  });

  it('allows unlimited passes', () => {
    let g = game(board({ stock: cards('2h 3h') }));
    for (let i = 0; i < 30; i++) g = draw(g)!;
    expect(g).not.toBeNull();
    expect(allCards(g.board)).toHaveLength(2);
  });

  it('does nothing when stock and waste are both empty', () => {
    expect(draw(game(board({})))).toBeNull();
  });
});

describe('tableau moves', () => {
  it('builds down in alternating team (octopus on manta, manta on octopus)', () => {
    const b = board({ waste: cards('9h'), tableau: tableau(col('', '10s'), col('', '10d'), col('', '9c')) });
    const targets = legalTargets(b, { pile: 'waste' });
    expect(targets).toEqual([{ pile: 'tableau', index: 0 }]);
  });

  it('rejects the same team and the wrong rank', () => {
    const g = game(board({ waste: cards('9h'), tableau: tableau(col('', '10d'), col('', 'Js')) }));
    expect(moveCards(g, { pile: 'waste' }, { pile: 'tableau', index: 0 })).toBeNull();
    expect(moveCards(g, { pile: 'waste' }, { pile: 'tableau', index: 1 })).toBeNull();
  });

  it('only lets a King into an empty column', () => {
    const queen = game(board({ waste: cards('Qh'), tableau: tableau(emptyCol()) }));
    expect(moveCards(queen, { pile: 'waste' }, { pile: 'tableau', index: 0 })).toBeNull();
    const king = game(board({ waste: cards('Kh'), tableau: tableau(emptyCol()) }));
    expect(moveCards(king, { pile: 'waste' }, { pile: 'tableau', index: 0 })!.board.tableau[0].up).toEqual(cards('Kh'));
  });

  it('moves a face-up run together', () => {
    const g = game(board({ tableau: tableau(col('', 'Kc Qh Js'), col('', 'Kd')) }));
    // Q♥ J♠ onto K♦ is illegal (both octopus), so try a legal run instead
    expect(moveCards(g, { pile: 'tableau', index: 0, cardIndex: 1 }, { pile: 'tableau', index: 1 })).toBeNull();
    const g2 = game(board({ tableau: tableau(col('', 'Kd Qs Jh'), col('', 'Kh')) }));
    const next = moveCards(g2, { pile: 'tableau', index: 0, cardIndex: 1 }, { pile: 'tableau', index: 1 })!;
    expect(next.board.tableau[1].up).toEqual(cards('Kh Qs Jh'));
    expect(next.board.tableau[0].up).toEqual(cards('Kd'));
  });

  it('cannot pick up face-down cards', () => {
    const g = game(board({ tableau: tableau(col('5h', '9c'), col('', '6s')) }));
    expect(moveCards(g, { pile: 'tableau', index: 0, cardIndex: -1 }, { pile: 'tableau', index: 1 })).toBeNull();
  });

  it('flips the next face-down card when one is uncovered', () => {
    const g = game(board({ tableau: tableau(col('3c 7d', '9h'), col('', '10s')) }));
    const next = moveCards(g, { pile: 'tableau', index: 0, cardIndex: 0 }, { pile: 'tableau', index: 1 })!;
    expect(next.board.tableau[0]).toEqual(col('3c', '7d'));
  });

  it('leaves an emptied column empty', () => {
    const g = game(board({ tableau: tableau(col('', '9h'), col('', '10s')) }));
    const next = moveCards(g, { pile: 'tableau', index: 0, cardIndex: 0 }, { pile: 'tableau', index: 1 })!;
    expect(next.board.tableau[0]).toEqual(emptyCol());
  });

  it('does not allow moving a column onto itself', () => {
    const g = game(board({ tableau: tableau(col('', 'Kh')) }));
    expect(moveCards(g, { pile: 'tableau', index: 0, cardIndex: 0 }, { pile: 'tableau', index: 0 })).toBeNull();
  });
});

describe('foundations', () => {
  const hearts = foundationIndex('hearts');
  const spades = foundationIndex('spades');

  it('takes an Ace on its empty suit slot only', () => {
    const g = game(board({ waste: cards('Ah') }));
    expect(moveCards(g, { pile: 'waste' }, { pile: 'foundation', index: spades })).toBeNull();
    const next = moveCards(g, { pile: 'waste' }, { pile: 'foundation', index: hearts })!;
    expect(next.board.foundations[hearts]).toEqual(cards('Ah'));
  });

  it('builds up by suit without skipping', () => {
    const foundations = [pile('hearts', 2), [], [], []];
    expect(moveCards(game(board({ foundations, waste: cards('3h') })), { pile: 'waste' }, { pile: 'foundation', index: hearts })).not.toBeNull();
    expect(moveCards(game(board({ foundations, waste: cards('4h') })), { pile: 'waste' }, { pile: 'foundation', index: hearts })).toBeNull();
    expect(moveCards(game(board({ foundations, waste: cards('3d') })), { pile: 'waste' }, { pile: 'foundation', index: hearts })).toBeNull();
  });

  it('accepts only single cards, not runs', () => {
    const g = game(board({ foundations: [pile('hearts', 1), [], [], []], tableau: tableau(col('', '3s 2h')) }));
    expect(moveCards(g, { pile: 'tableau', index: 0, cardIndex: 0 }, { pile: 'foundation', index: hearts })).toBeNull();
    expect(moveCards(g, { pile: 'tableau', index: 0, cardIndex: 1 }, { pile: 'foundation', index: hearts })).not.toBeNull();
  });

  it('lets a foundation card come back down to the tableau', () => {
    const g = game(board({ foundations: [pile('hearts', 5), [], [], []], tableau: tableau(col('', '6c')) }));
    const next = moveCards(g, { pile: 'foundation', index: hearts }, { pile: 'tableau', index: 0 })!;
    expect(next.board.foundations[hearts]).toHaveLength(4);
    expect(next.board.tableau[0].up).toEqual(cards('6c 5h'));
  });
});

describe('undo', () => {
  it('steps back one move at a time, all the way to the deal', () => {
    const start = deal(seededRandom(3));
    const a = draw(start)!;
    const b = draw(a)!;
    expect(undo(b)).toEqual(a);
    expect(undo(undo(b)!)).toEqual(start);
    expect(undo(start)).toBeNull();
  });

  it('restores flipped cards and the move count', () => {
    const g = game(board({ tableau: tableau(col('3c 7d', '9h'), col('', '10s')) }));
    const moved = moveCards(g, { pile: 'tableau', index: 0, cardIndex: 0 }, { pile: 'tableau', index: 1 })!;
    expect(moved.moves).toBe(1);
    expect(undo(moved)).toEqual(g);
  });

  it('never changes the game it was given', () => {
    const g = deal(seededRandom(4));
    const snapshot = JSON.stringify(g);
    draw(g);
    moveCards(g, { pile: 'tableau', index: 6, cardIndex: 0 }, { pile: 'tableau', index: 0 });
    undo(g);
    expect(JSON.stringify(g)).toBe(snapshot);
  });
});

describe('tap targets and hints', () => {
  it('sends a tapped card to a foundation before the tableau', () => {
    const b = board({ waste: cards('Ah'), tableau: tableau(col('', '2s')) });
    expect(autoMoveTarget(b, { pile: 'waste' })).toEqual({ pile: 'foundation', index: foundationIndex('hearts') });
  });

  it('prefers a column with cards over an empty one', () => {
    const b = board({ waste: cards('Qh'), tableau: tableau(emptyCol(), col('', 'Ks')) });
    expect(autoMoveTarget(b, { pile: 'waste' })).toEqual({ pile: 'tableau', index: 1 });
  });

  it('double-tap only looks at foundations', () => {
    const b = board({ waste: cards('9h'), tableau: tableau(col('', '10s')) });
    expect(foundationTarget(b, { pile: 'waste' })).toBeNull();
  });

  it('hints a foundation move first, then uncovering cards, then drawing', () => {
    const toFoundation = board({ waste: cards('Ad'), tableau: tableau(col('4c', '9h'), col('', '10s')) });
    expect(hint(toFoundation)).toMatchObject({ type: 'move', from: { pile: 'waste' }, to: { pile: 'foundation' } });

    const uncover = board({ waste: cards('5d'), tableau: tableau(col('4c', '9h'), col('', '10s')) });
    expect(hint(uncover)).toEqual({ type: 'move', from: { pile: 'tableau', index: 0, cardIndex: 0 }, to: { pile: 'tableau', index: 1 } });

    const drawOnly = board({ stock: cards('Ad'), tableau: tableau(col('', '9h')) });
    expect(hint(drawOnly)).toEqual({ type: 'draw' });

    expect(hint(board({ tableau: tableau(col('', '9h')) }))).toBeNull();
  });
});

describe('when nothing can help', () => {
  it("doesn't hint drawing when no card in the pile can be played anywhere", () => {
    const b = board({ stock: cards('5d 3c'), tableau: tableau(col('Kc', '9h')) });
    expect(analyze(game(b))).toEqual({ hint: null, lost: true });
  });

  it('follows a line of moves the rules of thumb miss: draw, place the card, then free a face-down card', () => {
    // The 7 can't move until the 8 from the pile is on the 9
    const b = board({ stock: cards('8s'), tableau: tableau(col('Kc', '7d'), col('', '9h')) });
    expect(analyze(game(b))).toEqual({ hint: { type: 'draw' }, lost: false });
  });

  it('knows a card that never reaches the top of the waste with Draw 3', () => {
    // Six cards in the pile: with Draw 3 the Ace is always in the middle of a three, so it never shows
    const b = board({ stock: cards('5c 6c Ah 9c 10c 9d'), tableau: tableau(col('Kc', 'Qd')) });
    expect(analyze(game(b, 1)).lost).toBe(false);
    expect(analyze(game(b, 3))).toEqual({ hint: null, lost: true });
  });

  it('takes a card back down off a foundation when that is the only way on', () => {
    // The 5 of spades needs a red 6 to free the King under it: the 6 of hearts has to come down onto the 7 of clubs
    const b = board({ foundations: [pile('hearts', 6), [], [], []], tableau: tableau(col('Kc', '5s'), col('', '7c')) });
    expect(analyze(game(b))).toEqual({
      hint: { type: 'move', from: { pile: 'foundation', index: foundationIndex('hearts') }, to: { pile: 'tableau', index: 1 } },
      lost: false,
    });
  });

  it("doesn't count putting a card back up as progress, so hints can't go round in circles", () => {
    // After taking the 6 of hearts down, the next hint is the 5 of spades onto it, not the 6 straight back up
    const before = board({ foundations: [pile('hearts', 6), [], [], []], tableau: tableau(col('Kc', '5s'), col('', '7c')) });
    const down = moveCards(game(before), { pile: 'foundation', index: foundationIndex('hearts') }, { pile: 'tableau', index: 1 })!;
    expect(analyze(down).hint).toEqual({ type: 'move', from: { pile: 'tableau', index: 0, cardIndex: 0 }, to: { pile: 'tableau', index: 1 } });
  });

  it('a won game is never lost, and a lost one gets no hint', () => {
    const done = board({ foundations: [pile('hearts', 13), pile('diamonds', 13), pile('spades', 13), pile('clubs', 13)] });
    expect(analyze(game(done))).toEqual({ hint: null, lost: false });
  });

  it('restart deals the same game again from the start', () => {
    let g = deal(seededRandom(9));
    const start = g.board;
    g = draw(g)!;
    g = draw(g)!;
    const again = restart(g);
    expect(again.board).toEqual(start);
    expect(again.moves).toBe(0);
    expect(again.history).toEqual([]);
  });

  it('following the hints ends every game won or lost, never going round in circles', () => {
    // 16 deals, Draw 1 and Draw 3. With the search before this, hints circled in about a third of these games
    let lost = 0, won = 0;
    for (let seed = 1; seed <= 8; seed++) {
      for (const drawCount of [1, 3] as const) {
        let g = deal(seededRandom(seed), drawCount);
        const seen = new Set<string>();
        for (let step = 0; step < 400; step++) {
          if (canAutoFinish(g.board)) { g = autoFinish(g).game; break; }
          const a = analyze(g);
          if (!a.hint) { if (a.lost) lost++; break; }
          const key = JSON.stringify(g.board);
          expect(seen.has(key)).toBe(false);
          seen.add(key);
          g = (a.hint.type === 'draw' ? draw(g) : moveCards(g, a.hint.from, a.hint.to))!;
          expect(allCards(g.board)).toHaveLength(52);
        }
        if (isWon(g.board)) won++;
      }
    }
    expect(won).toBeGreaterThan(3);
    expect(lost).toBeGreaterThan(3);
  }, 120000);
});

describe('tap to play', () => {
  it('sends a card to its foundation first, then onto a column with cards, then an empty column', () => {
    expect(tapToPlayTarget(board({ waste: cards('Ah'), tableau: tableau(col('', '2s')) }), { pile: 'waste' }))
      .toEqual({ pile: 'foundation', index: foundationIndex('hearts') });
    expect(tapToPlayTarget(board({ waste: cards('Qh'), tableau: tableau(emptyCol(), col('', 'Ks')) }), { pile: 'waste' }))
      .toEqual({ pile: 'tableau', index: 1 });
    expect(tapToPlayTarget(board({ waste: cards('Kh'), tableau: tableau(col('', '5s')) }), { pile: 'waste' }))
      .toEqual({ pile: 'tableau', index: 1 });
  });

  it("moves a run from where it's tapped, and has nowhere to send a card that fits nowhere", () => {
    const b = board({ tableau: tableau(col('4c', '9h 8s'), col('', '10c'), col('', '9s')) });
    expect(tapToPlayTarget(b, { pile: 'tableau', index: 0, cardIndex: 0 })).toEqual({ pile: 'tableau', index: 1 });
    expect(tapToPlayTarget(b, { pile: 'tableau', index: 2, cardIndex: 0 })).toBeNull();
  });

  it("doesn't shuffle a King with nothing under it between empty columns, or pull a card off a foundation", () => {
    const b = board({ foundations: [pile('hearts', 3), [], [], []], tableau: tableau(col('', 'Kc'), emptyCol()) });
    expect(tapToPlayTarget(b, { pile: 'tableau', index: 0, cardIndex: 0 })).toBeNull();
    expect(tapToPlayTarget(b, { pile: 'foundation', index: foundationIndex('hearts') })).toBeNull();
  });
});

describe('pick up, then tap where it goes', () => {
  const waste = { pile: 'waste' } as const;
  const tab = (index: number, cardIndex = 0) => ({ pile: 'tableau', index, cardIndex }) as const;

  it('picks a card up on the first tap, and never moves it by itself', () => {
    const b = board({ waste: cards('Ah'), tableau: tableau(col('', '2s')) });
    expect(tapOnCard(b, null, waste)).toEqual({ type: 'select', source: waste });
  });

  it('moves the picked-up cards to the pile tapped next', () => {
    const b = board({ waste: cards('9h'), tableau: tableau(col('', '10s'), col('', '10c')) });
    expect(tapOnCard(b, waste, tab(1))).toEqual({ type: 'move', from: waste, to: { pile: 'tableau', index: 1 } });
    // Any card in the column counts as tapping the column
    const deep = board({ waste: cards('9h'), tableau: tableau(col('', '3d 10s')) });
    expect(tapOnCard(deep, waste, tab(0, 0))).toEqual({ type: 'move', from: waste, to: { pile: 'tableau', index: 0 } });
  });

  it('puts the cards back down when the same card is tapped again', () => {
    const b = board({ tableau: tableau(col('4c', '9h 8s')) });
    expect(tapOnCard(b, tab(0, 0), tab(0, 0))).toEqual({ type: 'deselect' });
  });

  it('picks up the tapped card instead when the picked-up cards cannot go there', () => {
    const b = board({ waste: cards('9h'), tableau: tableau(col('', '10h'), col('', 'Qs Jd')) });
    expect(tapOnCard(b, waste, tab(0))).toEqual({ type: 'select', source: tab(0) });
    expect(tapOnCard(b, tab(1, 1), tab(1, 0))).toEqual({ type: 'select', source: tab(1, 0) });
  });

  it('moves onto a foundation card, but never picks one up with a tap', () => {
    const b = board({ waste: cards('2h'), foundations: [pile('hearts', 1), [], [], []] });
    const f = { pile: 'foundation', index: foundationIndex('hearts') } as const;
    expect(tapOnCard(b, waste, f)).toEqual({ type: 'move', from: waste, to: f });
    expect(tapOnCard(b, null, f)).toEqual({ type: 'none' });
    const wrong = board({ waste: cards('5h'), foundations: [pile('hearts', 1), [], [], []] });
    expect(tapOnCard(wrong, waste, f)).toEqual({ type: 'invalid' });
  });

  it('moves to an empty column or foundation slot when that is allowed', () => {
    const king = board({ waste: cards('Ks') });
    expect(tapOnPile(king, waste, { pile: 'tableau', index: 3 })).toEqual({ type: 'move', from: waste, to: { pile: 'tableau', index: 3 } });
    expect(tapOnPile(king, waste, { pile: 'foundation', index: 0 })).toEqual({ type: 'invalid' });
    expect(tapOnPile(king, null, { pile: 'tableau', index: 3 })).toEqual({ type: 'none' });
  });
});

describe('winning', () => {
  it('is won when all 52 cards are on the foundations', () => {
    const full = board({ foundations: [pile('hearts', 13), pile('diamonds', 13), pile('spades', 13), pile('clubs', 13)] });
    expect(isWon(full)).toBe(true);
    expect(isWon(board({ foundations: [pile('hearts', 13), pile('diamonds', 13), pile('spades', 13), pile('clubs', 12)] }))).toBe(false);
  });

  it('offers auto finish only once every card is face up and the stock is empty', () => {
    expect(canAutoFinish(board({ tableau: tableau(col('', 'Kh')) }))).toBe(true);
    expect(canAutoFinish(board({ tableau: tableau(col('2c', 'Kh')) }))).toBe(false);
    expect(canAutoFinish(board({ stock: cards('3d'), tableau: tableau(col('', 'Kh')) }))).toBe(false);
  });

  it('auto finish plays out to a win, even with Draw 3 and cards left in the waste', () => {
    // Everything on foundations except the top few of each suit, spread across tableau runs and the waste
    const b = board({
      foundations: [pile('hearts', 9), pile('diamonds', 10), pile('spades', 9), pile('clubs', 8)],
      waste: cards('9c Jd 10s Qd Kd'),
      tableau: tableau(col('', 'Kc Qh Js 10h'), col('', 'Ks Jh'), col('', 'Kh Qs'), col('', 'Qc Jc 10c')),
    });
    const before = allCards(b).map(cardId).sort();
    const { game: done, moves } = autoFinish(game(b, 3));
    expect(isWon(done.board)).toBe(true);
    expect(moves.length).toBeGreaterThan(0);
    expect(done.drawCount).toBe(3);
    expect(allCards(done.board).map(cardId).sort()).toEqual(before);
  });
});
