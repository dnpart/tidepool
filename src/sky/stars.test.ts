import { describe, expect, it } from 'vitest';
import { makeClouds, makeStars } from './stars';

describe('makeStars', () => {
  it('is stable for the same screen and within the plan ranges', () => {
    const a = makeStars(400, 800);
    expect(a).toEqual(makeStars(400, 800));
    expect(a).toHaveLength(40);
    for (const s of a) {
      expect(s.size).toBeGreaterThanOrEqual(4);
      expect(s.size).toBeLessThanOrEqual(12);
      expect(s.brightness).toBeGreaterThanOrEqual(0.35);
      expect(s.duration).toBeGreaterThanOrEqual(50);
      expect(s.duration).toBeLessThanOrEqual(100);
      expect(s.delay).toBeLessThanOrEqual(0);
      expect(Math.hypot(s.x, s.y / 1.5)).toBeLessThanOrEqual(400 * 0.45 + 1e-9);
    }
  });
});

describe('makeClouds', () => {
  it('puts one cloud in each of five bands', () => {
    const clouds = makeClouds();
    expect(clouds).toHaveLength(5);
    clouds.forEach((c, i) => {
      expect(c.top).toBeGreaterThanOrEqual(i / 5);
      expect(c.top).toBeLessThan((i + 1) / 5);
      expect(c.width).toBeGreaterThanOrEqual(90);
      expect(c.width).toBeLessThanOrEqual(160);
    });
  });
});
