import { describe, expect, it } from 'vitest';
import { BOARD, CENTER, holeAt, marbleAt, POND, RADIUS } from './board';
import { CORNER, HOP, PADS } from './rules';

const dist = ([x1, y1]: [number, number], [x2, y2]: [number, number]) => Math.hypot(x1 - x2, y1 - y2);

describe('the board', () => {
  it('puts hole 0 at the top and goes clockwise, with your start (30) on the left', () => {
    expect(holeAt(0)[0]).toBeCloseTo(CENTER);
    expect(holeAt(0)[1]).toBeCloseTo(CENTER - RADIUS);
    expect(holeAt(10)[0]).toBeCloseTo(CENTER + RADIUS);
    expect(holeAt(30)[0]).toBeCloseTo(CENTER - RADIUS);
  });

  it('puts each lily pad straight across the pond from its partner', () => {
    for (const pad of PADS) {
      const [x1, y1] = holeAt(pad);
      const [x2, y2] = holeAt((pad + HOP) % 40);
      expect((x1 + x2) / 2).toBeCloseTo(CENTER);
      expect((y1 + y2) / 2).toBeCloseTo(CENTER);
    }
  });

  it('gives every marble of every seat its own spot inside the board, wherever it is', () => {
    for (const progress of [CORNER, 0, 17, 39, 40, 43]) {
      const spots = [0, 1, 2].flatMap((seat) => [0, 1, 2, 3].map((m) => marbleAt(seat, m, progress)));
      for (const [x, y] of spots) {
        expect(x).toBeGreaterThan(10);
        expect(x).toBeLessThan(BOARD - 10);
        expect(y).toBeGreaterThan(10);
        expect(y).toBeLessThan(BOARD - 10);
      }
      if (progress === CORNER) {
        // Twelve corner spots, none closer than a marble's width
        for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) expect(dist(spots[i], spots[j])).toBeGreaterThan(16);
      }
    }
  });

  it('runs each home lane from the track toward the pond, without reaching it', () => {
    for (const seat of [0, 1, 2]) {
      const lane = [40, 41, 42, 43].map((p) => dist(marbleAt(seat, 0, p), [CENTER, CENTER]));
      expect(lane).toEqual([...lane].sort((a, b) => b - a));
      expect(lane[0]).toBeLessThan(RADIUS);
      expect(lane[3]).toBeGreaterThan(POND);
    }
  });
});
