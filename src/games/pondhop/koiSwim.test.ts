// Koi Garden's koi swim the Pond Hop pond (Nov 5): they wander for good without reaching the rocks or turning on the spot.
import { describe, expect, it } from 'vitest';
import { CENTER as C } from './board';
import { restingKoi, swim, SWIM_MAX } from './koiSwim';

describe('the swimming koi', () => {
  it('start where the still pond draws them', () => {
    expect(restingKoi().map((k) => [k.kind, k.x, k.y])).toEqual([['kohaku', C - 58, C - 70], ['orange', C + 66, C + 58], ['shiro', C - 70, C + 62]]);
  });

  it('wander the open water for an hour without nearing the rocks, turning smoothly, and swim all over', () => {
    const koi = restingKoi();
    const dt = 1 / 30;
    let far = 0, maxTurn = 0;
    const reached = new Set<string>();
    for (let i = 0, t = 0; i < 30 * 3600; i++, t += dt) {
      const before = koi.map((k) => k.a);
      swim(koi, t, dt);
      koi.forEach((k, j) => {
        far = Math.max(far, Math.hypot(k.x - C, k.y - C));
        maxTurn = Math.max(maxTurn, Math.abs(k.a - before[j]) / dt);
        reached.add(`${k.kind}${Math.floor((Math.atan2(k.y - C, k.x - C) + Math.PI) / (Math.PI / 2))}`);
        expect(Math.abs(k.tail)).toBeLessThanOrEqual(22);
      });
    }
    expect(far).toBeLessThanOrEqual(SWIM_MAX + 1e-9);
    // never faster than about half a turn a second
    expect(maxTurn).toBeLessThan(Math.PI);
    // every koi visits every quarter of the pond
    expect(reached.size).toBe(12);
  });

  it('rarely swim right over each other', () => {
    const koi = restingKoi();
    const dt = 1 / 30;
    let close = 0, frames = 0;
    for (let i = 0, t = 0; i < 30 * 1200; i++, t += dt) {
      swim(koi, t, dt);
      for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) {
        frames++;
        if (Math.hypot(koi[a].x - koi[b].x, koi[a].y - koi[b].y) < 12) close++;
      }
    }
    expect(close / frames).toBeLessThan(0.02);
  });
});
