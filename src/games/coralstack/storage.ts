// Saves Coral Stack's best Solo score, the Versus tally and pace (key tidepool.coralstack), in the shape every
// falling-block game shares (`games/falling/storage.ts`).
import { storageFor, type SavedFalling } from '../falling/storage';

export { DEFAULTS, deserialize, serialize, type Mode } from '../falling/storage';
export type SavedCoralStack = SavedFalling;

export const STORAGE_KEY = 'tidepool.coralstack';
export const { load, save } = storageFor(STORAGE_KEY);
