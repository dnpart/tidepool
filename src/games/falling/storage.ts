// What a falling-block game saves (Bubble Pals, Coral Stack, Tide Swap): the mode chosen last, the best Solo score,
// the Versus tally and pace. Games aren't saved mid-play, since they run in real time, like Speed.
import { PACES, type Pace } from './speed';

export type Mode = 'solo' | 'versus';

export interface SavedFalling {
  /** The mode chosen last, which the Start card opens on. */
  mode: Mode;
  best: number;
  /** Versus games won: you, then the opponent. */
  tally: [number, number];
  pace: Pace;
  showTally: boolean;
}

export const DEFAULTS: SavedFalling = { mode: 'solo', best: 0, tally: [0, 0], pace: 'steady', showTally: false };

const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0);

export const serialize = (saved: SavedFalling): string =>
  JSON.stringify({ v: 1, m: saved.mode, b: saved.best, t: saved.tally, p: saved.pace, sh: saved.showTally });

export function deserialize(raw: string | null): SavedFalling {
  if (!raw) return { ...DEFAULTS };
  try {
    const d = JSON.parse(raw);
    if (d?.v !== 1) return { ...DEFAULTS };
    const tally = Array.isArray(d.t) ? d.t : [];
    return {
      mode: d.m === 'versus' ? 'versus' : 'solo',
      best: count(d.b),
      tally: [count(tally[0]), count(tally[1])],
      pace: PACES.includes(d.p) ? d.p : DEFAULTS.pace,
      showTally: d.sh === true,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Load and save for one game's key (e.g. tidepool.bubblepals). */
export function storageFor(key: string) {
  return {
    load(): SavedFalling {
      try {
        return deserialize(localStorage.getItem(key));
      } catch {
        return { ...DEFAULTS };
      }
    },
    save(saved: SavedFalling): void {
      try {
        localStorage.setItem(key, serialize(saved));
      } catch {
        // Storage can be full or blocked; the game still plays
      }
    },
  };
}
