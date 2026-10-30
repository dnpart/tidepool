import { describe, expect, it } from 'vitest';
import { cardId } from '../../cards/deck';
import { seededRandom } from '../../util/random';
import { columnSteps, dropTarget, layout, measure, columnX } from './layout';
import { deal, draw } from './rules';
import { deserialize, serialize } from './storage';

describe('measure', () => {
  it('fits seven columns: (width − 16 − 30) / 7', () => {
    const m = measure(390, 600);
    expect(m.cardW).toBe(49);
    expect(columnX(m, 6) + m.cardW).toBeLessThanOrEqual(390 - 8);
  });
});

describe('columnSteps', () => {
  it('uses 10px face-down and 24px face-up overlaps when there is room', () => {
    expect(columnSteps(measure(390, 700), 6, 3)).toEqual({ downStep: 10, upStep: 24 });
  });

  it('compresses a long column so it stays on screen', () => {
    const m = measure(390, 420);
    const { downStep, upStep } = columnSteps(m, 6, 13);
    expect(downStep).toBeLessThan(10);
    expect(upStep).toBeLessThan(24);
  });
});

describe('layout', () => {
  it('places all 52 cards, with only face-up cards pickable', () => {
    const g = draw(deal(seededRandom(5)))!;
    const placed = layout(g.board, measure(390, 600), 1);
    expect(placed.size).toBe(52);
    const pickable = [...placed.values()].filter((p) => p.source);
    expect(pickable.every((p) => p.faceUp)).toBe(true);
    // waste top + 7 column tops
    expect(pickable).toHaveLength(8);
  });

  it('fans the top three waste cards with Draw 3', () => {
    const g = draw({ ...deal(seededRandom(6)), drawCount: 3 })!;
    const placed = layout(g.board, measure(390, 600), 3);
    const xs = g.board.waste.map((c) => placed.get(cardId(c))!.x);
    expect(xs[1]).toBeGreaterThan(xs[0]);
    expect(xs[2]).toBeGreaterThan(xs[1]);
  });
});

describe('dropTarget', () => {
  it('picks the legal pile the card covers most', () => {
    const g = deal(seededRandom(7));
    const m = measure(390, 600);
    const legal = [{ pile: 'tableau', index: 2 }, { pile: 'tableau', index: 3 }] as const;
    const overCol3 = { x: columnX(m, 3) - 10, y: m.row2 + 30, w: m.cardW, h: m.cardH };
    expect(dropTarget(m, g.board, overCol3, [...legal])).toEqual({ pile: 'tableau', index: 3 });
    const farAway = { x: columnX(m, 6), y: m.row2 + 400, w: m.cardW, h: m.cardH };
    expect(dropTarget(m, g.board, farAway, [...legal])).toBeNull();
  });
});

describe('storage', () => {
  it('round-trips a game with its undo history', () => {
    const g = draw(draw(deal(seededRandom(8)))!)!;
    const saved = { game: g, elapsedMs: 61000, showStats: true };
    expect(deserialize(serialize(saved))).toEqual(saved);
  });

  it('rejects damaged saves', () => {
    expect(deserialize(null)).toBeNull();
    expect(deserialize('nope')).toBeNull();
    const saved = JSON.parse(serialize({ game: deal(seededRandom(9)), elapsedMs: 0, showStats: false }));
    saved.b.s.pop();
    expect(deserialize(JSON.stringify(saved))).toBeNull();
  });
});
