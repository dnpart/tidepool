// Saves Coral Stack's mode, best Continuous score and best level reached in Levels (key tidepool.coralstack). Games aren't
// saved mid-play, since they run in real time. Coral Stack had Versus until the owner swapped it for Levels; a save
// from then opens on Continuous and keeps its best score.
export const STORAGE_KEY = 'tidepool.coralstack';

export type Mode = 'solo' | 'levels';

export interface SavedCoralStack {
  /** The mode chosen last, which the Start card opens on. */
  mode: Mode;
  /** Best Continuous score. */
  best: number;
  /** Highest level reached in Levels (1 until the first level is cleared). */
  bestLevel: number;
}

export const DEFAULTS: SavedCoralStack = { mode: 'solo', best: 0, bestLevel: 1 };

const count = (n: unknown, min = 0) => (Number.isInteger(n) && (n as number) >= min ? (n as number) : min);

export const serialize = (saved: SavedCoralStack): string =>
  JSON.stringify({ v: 1, m: saved.mode, b: saved.best, l: saved.bestLevel });

export function deserialize(raw: string | null): SavedCoralStack {
  if (!raw) return { ...DEFAULTS };
  try {
    const d = JSON.parse(raw);
    if (d?.v !== 1) return { ...DEFAULTS };
    return { mode: d.m === 'levels' ? 'levels' : 'solo', best: count(d.b), bestLevel: count(d.l, 1) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function load(): SavedCoralStack {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(saved: SavedCoralStack): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(saved));
  } catch {
    // Storage can be full or blocked; the game still plays
  }
}
