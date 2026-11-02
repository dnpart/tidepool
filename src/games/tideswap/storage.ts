// Saves Tide Swap's mode, best Solo score and level, the Versus tally and pace (key tidepool.tideswap). The shape is
// Bubble Pals' (`games/falling/storage.ts`) plus the best level reached in Solo. Games aren't saved mid-play.
import { deserialize as fallingDeserialize, serialize as fallingSerialize, type SavedFalling } from '../falling/storage';

export type { Mode } from '../falling/storage';

export const STORAGE_KEY = 'tidepool.tideswap';

export interface SavedTideSwap extends SavedFalling {
  /** Highest Solo level reached (1 until the first level is cleared). */
  bestLevel: number;
}

export const DEFAULTS: SavedTideSwap = { mode: 'solo', best: 0, tally: [0, 0], pace: 'steady', showTally: false, bestLevel: 1 };

export const serialize = (saved: SavedTideSwap): string =>
  JSON.stringify({ ...JSON.parse(fallingSerialize(saved)), l: saved.bestLevel });

export function deserialize(raw: string | null): SavedTideSwap {
  let l = 1;
  try {
    const d = raw ? JSON.parse(raw) : null;
    if (Number.isInteger(d?.l) && d.l >= 1) l = d.l;
  } catch {
    // falls back below
  }
  return { ...fallingDeserialize(raw), bestLevel: l };
}

export function load(): SavedTideSwap {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(saved: SavedTideSwap): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(saved));
  } catch {
    // Storage can be full or blocked; the game still plays
  }
}
