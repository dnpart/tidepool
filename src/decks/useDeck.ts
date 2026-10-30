import { useSettings } from '../settings/SettingsContext';
import type { DeckId } from './decks';

/** The deck chosen in Settings. */
export function useDeck(): DeckId {
  return useSettings().settings.deck;
}
