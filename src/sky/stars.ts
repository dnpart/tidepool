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

/** A rising pollen speck in the Honeycomb sky (PLAN.md "Skies"). */
export interface Speck {
  left: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  sway: number;
}

/** Honeycomb pollen. Light: 22 specks (seed 11); dark: 26 (seed 23); 2.4–6px, rising in 26–48s. */
export function makePollen(mode: 'light' | 'dark'): Speck[] {
  const light = mode === 'light';
  const random = seededRandom(light ? 11 : 23);
  return Array.from({ length: light ? 22 : 26 }, () => {
    const duration = between(random, 26, 48);
    return {
      left: random(),
      size: between(random, 2.4, 6),
      opacity: between(random, 0.45, 0.95),
      duration,
      delay: -random() * duration,
      sway: between(random, 4, 7),
    };
  });
}

export const LEAF_COLORS = ['#9DBB86', '#C9A464', '#C7835A', '#8FB07C', '#D8B56E'] as const;

export interface Leaf {
  left: number;
  /** Height in px; the leaf is two thirds as wide. */
  size: number;
  color: string;
  duration: number;
  delay: number;
  sway: number;
}

/** Forest by day: 14 leaves (seed 11), 12–20px, falling in 14–24s and tipping as they sway. */
export function makeLeaves(): Leaf[] {
  const random = seededRandom(11);
  return Array.from({ length: 14 }, (_, i) => {
    const duration = between(random, 14, 24);
    return {
      left: random(),
      size: between(random, 12, 20),
      color: LEAF_COLORS[i % LEAF_COLORS.length],
      duration,
      delay: -random() * duration,
      sway: between(random, 3, 5),
    };
  });
}

export interface Firefly {
  left: number;
  top: number;
  size: number;
  /** How far it wanders from its spot, px. */
  dx: number;
  dy: number;
  wander: number;
  blink: number;
  delay: number;
}

/** Forest by night: 18 fireflies (seed 23) below the top 15% of the screen, wandering and blinking. */
export function makeFireflies(): Firefly[] {
  const random = seededRandom(23);
  return Array.from({ length: 18 }, () => {
    const blink = between(random, 3, 6);
    return {
      left: random(),
      top: between(random, 0.15, 1),
      size: between(random, 3, 5),
      dx: between(random, -30, 30),
      dy: between(random, -30, 30),
      wander: between(random, 8, 14),
      blink,
      delay: -random() * blink,
    };
  });
}

export interface StillStar {
  left: number;
  top: number;
  size: number;
  opacity: number;
}

/** 14 faint, still stars (seed 31) in the top 40% of the Forest night sky. */
export function makeStillStars(): StillStar[] {
  const random = seededRandom(31);
  return Array.from({ length: 14 }, () => ({
    left: random(),
    top: between(random, 0, 0.4),
    size: between(random, 1.4, 3),
    opacity: between(random, 0.35, 0.75),
  }));
}

export interface CombCluster {
  /** Cell radius (center to corner), px. */
  r: number;
  /** [column, row] of each pointy-top cell; odd rows shift half a cell right. */
  cells: [number, number][];
  /** Indexes into `cells` that are filled with honey. */
  filled: number[];
  /** Where the cluster sits; `half` pushes it halfway off that edge. */
  place: { top: string; left?: string; right?: string; half?: 'left' | 'right' };
}

/** The three still honeycomb clusters: by the title, on the right edge and on the left edge. */
export const COMB_CLUSTERS: CombCluster[] = [
  { r: 13, cells: [[0, 0], [1, 0], [0, 1], [1, 1], [1, 2]], filled: [1, 3], place: { top: '30px', right: '92px' } },
  { r: 15, cells: [[0, 0], [0, 1], [-1, 1], [0, 2]], filled: [1], place: { top: '40%', right: '0', half: 'right' } },
  { r: 17, cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]], filled: [1], place: { top: '72%', left: '0', half: 'left' } },
];

/** Cell centers for a cluster, shifted so the whole cluster starts at (0, 0), plus its size. */
export function layoutCluster({ r, cells }: CombCluster): { centers: [number, number][]; width: number; height: number } {
  const dx = r * Math.sqrt(3);
  const dy = r * 1.5;
  const raw = cells.map(([c, row]) => [c * dx + (row % 2 ? dx / 2 : 0), row * dy] as [number, number]);
  const minX = Math.min(...raw.map(([x]) => x)) - dx / 2;
  const minY = Math.min(...raw.map(([, y]) => y)) - r;
  const centers = raw.map(([x, y]) => [x - minX, y - minY] as [number, number]);
  return {
    centers,
    width: Math.max(...centers.map(([x]) => x)) + dx / 2,
    height: Math.max(...centers.map(([, y]) => y)) + r,
  };
}

/** Pointy-top hexagon path centered on (cx, cy). */
export function hexPath(cx: number, cy: number, r: number): string {
  const points = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  });
  return `M${points.join(' L')} Z`;
}
