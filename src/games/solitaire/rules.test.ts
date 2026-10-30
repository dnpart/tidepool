import { describe, expect, it } from 'vitest';
import { cardId, type Card, type Rank, type Suit } from '../../cards/deck';
import { seededRandom } from '../../util/random';
import {
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

    const drawOnly = board({ stock: cards('5d'), tableau: tableau(col('', '9h')) });
    expect(hint(drawOnly)).toEqual({ type: 'draw' });

    expect(hint(board({ tableau: tableau(col('', '9h')) }))).toBeNull();
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

  it('wins a full game played by hints alone often enough to trust the rules', () => {
    // Plays 40 random deals using only hints; Klondike is often unwinnable, but some should finish,
    // and no game should ever lose or duplicate a card.
    let wins = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let g = deal(seededRandom(seed));
      const seen = new Set<string>();
      for (let step = 0; step < 600; step++) {
        if (canAutoFinish(g.board)) { g = autoFinish(g).game; break; }
        const move = hint(g.board);
        const key = JSON.stringify(g.board);
        if (!move || (move.type === 'draw' && seen.has(key))) break;
        seen.add(key);
        const next = move.type === 'draw' ? draw(g) : moveCards(g, move.from, move.to);
        expect(next).not.toBeNull();
        g = next!;
        expect(allCards(g.board)).toHaveLength(52);
      }
      if (isWon(g.board)) wins++;
    }
    expect(wins).toBeGreaterThan(0);
  });
});
