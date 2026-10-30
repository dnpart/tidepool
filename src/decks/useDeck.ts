import { useSettings } from '../settings/SettingsContext';
import { CARD_BACKS, type CardBackStyle, type DeckId } from './decks';

/** The deck chosen in Settings. */
export function useDeck(): DeckId {
  return useSettings().settings.deck;
}

/** The card back for the chosen deck and palette (PLAN.md "Card backs follow the palette"). */
export function useCardBack(): CardBackStyle {
  const { deck, palette } = useSettings().settings;
  return CARD_BACKS[deck][palette];
}
