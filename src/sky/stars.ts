import { seededRandom } from '../util/random';

export interface Star {
  /** Start offset from the screen center, px. */
  x: number;
  y: number;
  /** Total travel, px. */
  dx: number;
  dy: number;
  size: number;
  brightness: number;
  duration: number;
  delay: number;
}

export interface CloudSpec {
  width: number;
  top: number;
  opacity: number;
  duration: number;
  delay: number;
}

const between = (random: () => number, min: number, max: number) => min + random() * (max - min);

/** 40 stars scattered around the center, each drifting outward along its own angle (PLAN.md "Background motion"). */
export function makeStars(width: number, height: number, count = 40, seed = 20261030): Star[] {
  const random = seededRandom(seed);
  const shorter = Math.min(width, height);
  const stretchY = height > width ? 1.5 : 1;
  return Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const distance = between(random, 10, shorter * 0.45);
    const duration = between(random, 50, 100);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance * stretchY,
      dx: Math.cos(angle) * 520,
      dy: Math.sin(angle) * 676,
      size: between(random, 4, 12),
      brightness: between(random, 0.35, 1),
      duration,
      delay: -random() * duration,
    };
  });
}

/** 5 clouds, one per horizontal band down the screen. Tops are fractions of the screen height. */
export function makeClouds(count = 5, seed = 7): CloudSpec[] {
  const random = seededRandom(seed);
  return Array.from({ length: count }, (_, i) => {
    const duration = between(random, 110, 190);
    return {
      width: between(random, 90, 160),
      top: (i + between(random, 0.1, 0.7)) / count,
      opacity: between(random, 0.5, 0.85),
      duration,
      delay: -between(random, 0.15, 0.85) * duration,
    };
  });
}
