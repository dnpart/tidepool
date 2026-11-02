// Saves Bubble Pals' best Solo score, the Versus tally and pace (key tidepool.bubblepals). Games aren't saved mid-play,
// since they run in real time, like Speed.
import { PACES, type Pace } from './rules';

export const STORAGE_KEY = 'tidepool.bubblepals';

export interface SavedBubblePals {
  best: number;
  /** Versus games won: you, then the opponent. */
  tally: [number, number];
  pace: Pace;
  showTally: boolean;
}

export const DEFAULTS: SavedBubblePals = { best: 0, tally: [0, 0], pace: 'steady', showTally: false };

const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0);

export const serialize = (saved: SavedBubblePals): string =>
  JSON.stringify({ v: 1, b: saved.best, t: saved.tally, p: saved.pace, sh: saved.showTally });

export function deserialize(raw: string | null): SavedBubblePals {
  if (!raw) return { ...DEFAULTS };
  try {
    const d = JSON.parse(raw);
    if (d?.v !== 1) return { ...DEFAULTS };
    const tally = Array.isArray(d.t) ? d.t : [];
    return {
      best: count(d.b),
      tally: [count(tally[0]), count(tally[1])],
      pace: PACES.includes(d.p) ? d.p : DEFAULTS.pace,
      showTally: d.sh === true,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function load(): SavedBubblePals {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(saved: SavedBubblePals): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(saved));
  } catch {
    // Storage can be full or blocked; the game still plays
  }
}
