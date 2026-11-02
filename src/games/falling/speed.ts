// Speeds shared by the falling-block games (PLAN.md "Falling-block games"): Solo quickens with the level, Versus starts
// at the pace and quickens every 45 seconds so a game always ends.

export type Pace = 'gentle' | 'steady' | 'quick';
export const PACES: readonly Pace[] = ['gentle', 'steady', 'quick'];

/** Milliseconds per row in Solo: 800 at level 1, a little quicker each level, never under 150. */
export const soloFallMs = (lvl: number): number => Math.max(150, Math.round(800 * 0.9 ** (lvl - 1)));

const VERSUS_START: Record<Pace, number> = { gentle: 900, steady: 650, quick: 420 };
/** Milliseconds per row in Versus: set by the pace, and a little quicker every 45 seconds so a game always ends. */
export const versusFallMs = (pace: Pace, seconds: number): number =>
  Math.max(140, Math.round(VERSUS_START[pace] * 0.9 ** Math.floor(seconds / 45)));

export const PACE_NAMES: Record<Pace, string> = { gentle: 'Gentle', steady: 'Steady', quick: 'Quick' };
