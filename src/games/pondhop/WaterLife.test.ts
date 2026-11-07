import { describe, expect, it } from 'vitest';
import { seededRandom } from '../../util/random';
import { CENTER as C, POND } from './board';
import { glideAt, makeGlide, TENTACLE_SPOTS, waterLifeFor } from './WaterLife';

const dist = (x: number, y: number) => Math.hypot(x - C, y - C);

describe('life under the water', () => {
  it('Lagoon has mantas, Coral Reef tentacles, the other palettes their own ponds', () => {
    expect(waterLifeFor('lagoon')).toBe('mantas');
    expect(waterLifeFor('coral')).toBe('tentacles');
    for (const p of ['winter', 'honeycomb', 'forest', 'koi']) expect(waterLifeFor(p)).toBeNull();
  });

  it('a manta glides in from beyond the edge, through the middle of the pond, and out again', () => {
    const random = seededRandom(5);
    for (let i = 0; i < 50; i++) {
      const g = makeGlide(random);
      const start = glideAt(g, 0), end = glideAt(g, 1);
      expect(dist(start.x, start.y)).toBeGreaterThan(POND + 20);
      expect(dist(end.x, end.y)).toBeGreaterThan(POND + 20);
      const closest = Math.min(...Array.from({ length: 41 }, (_, k) => glideAt(g, k / 40)).map((p) => dist(p.x, p.y)));
      expect(closest).toBeLessThan(45);
      expect(g.seconds).toBeGreaterThanOrEqual(10);
    }
  });

  it('heads the way it is going', () => {
    const g = { from: [0, 180] as [number, number], via: [180, 180] as [number, number], to: [360, 180] as [number, number], seconds: 10 };
    expect(glideAt(g, 0.5).heading).toBeCloseTo(0);
    expect(glideAt(g, 0.5).x).toBeCloseTo(180);
  });

  it('tentacles come up in open water, clear of the piers, the hop lines and the rocks', () => {
    for (const [x, y] of TENTACLE_SPOTS) {
      // Tall as they are (about 55 units up), they stay inside the water
      expect(dist(x, y) + 55).toBeLessThan(POND + 6);
      const deg = ((Math.atan2(y - C, x - C) * 180) / Math.PI + 360) % 45;
      // At least 15 degrees from the piers (every 90) and the hop lines (the diagonals)
      expect(Math.min(deg, 45 - deg)).toBeGreaterThanOrEqual(15);
    }
  });
});
