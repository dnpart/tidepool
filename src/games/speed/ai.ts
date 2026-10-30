// The octopus opponent: plays a random legal card after a paced, slightly random delay.
import { legalMoves, type SpeedMove, type SpeedState } from './rules';

export type Pace = 'gentle' | 'normal' | 'quick';

export const PACE_MS: Record<Pace, number> = { gentle: 2200, normal: 1400, quick: 900 };
export const PACE_NAMES: Record<Pace, string> = { gentle: 'Gentle', normal: 'Normal', quick: 'Quick' };

/** The octopus never plays two cards within this many ms. */
export const MIN_GAP_MS = 400;

/** Delay before the octopus's next play: the pace ±30%. */
export function nextDelay(pace: Pace, random: () => number = Math.random): number {
  return Math.max(MIN_GAP_MS, PACE_MS[pace] * (0.7 + 0.6 * random()));
}

/** A random legal move for the octopus, or null if it has none. */
export function chooseMove(state: SpeedState, random: () => number = Math.random): SpeedMove | null {
  const moves = legalMoves(state, 'octo');
  return moves.length ? moves[Math.floor(random() * moves.length)] : null;
}
