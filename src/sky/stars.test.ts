import { describe, expect, it } from 'vitest';
import { CRYSTALS, makeClouds, makeSnow, makeStars } from './stars';

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

describe('makeSnow', () => {
  it('is stable and within the plan ranges for each mode', () => {
    const ranges = { light: { count: 44, size: [3, 7.5], opacity: 0.65 }, dark: { count: 48, size: [2.5, 7], opacity: 0.55 } };
    for (const mode of ['light', 'dark'] as const) {
      const flakes = makeSnow(mode);
      const r = ranges[mode];
      expect(flakes).toEqual(makeSnow(mode));
      expect(flakes).toHaveLength(r.count);
      for (const f of flakes) {
        expect(f.size).toBeGreaterThanOrEqual(r.size[0]);
        expect(f.size).toBeLessThanOrEqual(r.size[1]);
        expect(f.opacity).toBeGreaterThanOrEqual(r.opacity);
        expect(f.opacity).toBeLessThanOrEqual(1);
        expect(f.duration).toBeGreaterThanOrEqual(9);
        expect(f.duration).toBeLessThanOrEqual(17);
        expect(f.delay).toBeLessThanOrEqual(0);
        expect(f.sway).toBeGreaterThanOrEqual(2.6);
        expect(f.sway).toBeLessThanOrEqual(5);
        expect(f.left).toBeGreaterThanOrEqual(0);
        expect(f.left).toBeLessThan(1);
      }
      expect(CRYSTALS[mode]).toHaveLength(3);
    }
  });
});
