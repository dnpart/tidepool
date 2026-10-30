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

export interface Flake {
  /** Horizontal position, fraction of the screen width. */
  left: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  /** Side-to-side sway period, seconds. */
  sway: number;
}

export interface Crystal {
  left: number;
  size: number;
  duration: number;
  delay: number;
}

/** Winter snowfall (PLAN.md "Sky per palette"). Light: 44 flakes 3–7.5px; dark: 48 flakes 2.5–7px, a little fainter. */
export function makeSnow(mode: 'light' | 'dark'): Flake[] {
  const light = mode === 'light';
  const random = seededRandom(light ? 11 : 23);
  return Array.from({ length: light ? 44 : 48 }, () => {
    const duration = between(random, 9, 17);
    return {
      left: random(),
      size: light ? between(random, 3, 7.5) : between(random, 2.5, 7),
      opacity: light ? between(random, 0.65, 1) : between(random, 0.55, 1),
      duration,
      delay: -random() * duration,
      sway: between(random, 2.6, 5),
    };
  });
}

/** Three big snowflakes that each fall for about half their cycle, then rest out of sight. */
export const CRYSTALS: Record<'light' | 'dark', Crystal[]> = {
  light: [
    { left: 0.16, size: 20, duration: 27, delay: -3 },
    { left: 0.58, size: 16, duration: 34, delay: -16 },
    { left: 0.8, size: 22, duration: 41, delay: -31 },
  ],
  dark: [
    { left: 0.22, size: 20, duration: 29, delay: -8 },
    { left: 0.64, size: 16, duration: 36, delay: -22 },
    { left: 0.86, size: 22, duration: 43, delay: -2 },
  ],
};
