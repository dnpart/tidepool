import { describe, expect, it } from 'vitest';
import { CARD_BACK_NAMES, CARD_BACKS, DECK_IDS } from './decks';
import { PALETTES } from '../theme/tokens';

describe('card backs follow the palette (PLAN.md)', () => {
  it('matches the approved table', () => {
    expect(CARD_BACKS.sea).toEqual({ lagoon: 'tide', coral: 'garden', winter: 'starry' });
    expect(CARD_BACKS.arctic).toEqual({ lagoon: 'aurora', coral: 'knit', winter: 'snowfall' });
  });

  it('gives every deck and palette its own named back', () => {
    const backs = DECK_IDS.flatMap((deck) => PALETTES.map((palette) => CARD_BACKS[deck][palette]));
    expect(new Set(backs).size).toBe(6);
    for (const back of backs) expect(CARD_BACK_NAMES[back]).toBeTruthy();
  });
});
