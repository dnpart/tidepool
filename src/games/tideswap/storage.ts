// Saves Tide Swap's best Solo score, the Versus tally and pace (key tidepool.tideswap), in the shape Bubble Pals uses
// too (`games/falling/storage.ts`).
import { storageFor, type SavedFalling } from '../falling/storage';

export { DEFAULTS, deserialize, serialize, type Mode } from '../falling/storage';
export type SavedTideSwap = SavedFalling;

export const STORAGE_KEY = 'tidepool.tideswap';
export const { load, save } = storageFor(STORAGE_KEY);
