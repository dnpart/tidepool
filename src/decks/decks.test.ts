import { describe, expect, it } from 'vitest';
import { CARD_BACK_NAMES, CARD_BACKS, DECK_IDS, DECKS, GARDEN_CAST, isGardenDeck } from './decks';
import { PALETTES } from '../theme/tokens';

describe('card backs follow the palette (PLAN.md)', () => {
  it('matches the approved table', () => {
    // Honeycomb and Forest borrow the Lagoon backs until phase 21
    expect(CARD_BACKS.sea).toEqual({ lagoon: 'tide', coral: 'garden', winter: 'starry', honeycomb: 'tide', forest: 'tide' });
    expect(CARD_BACKS.arctic).toEqual({
      lagoon: 'aurora', coral: 'knit', winter: 'snowfall', honeycomb: 'aurora', forest: 'aurora',
    });
  });

  it('gives every deck and palette its own named back', () => {
    const backs = DECK_IDS.flatMap((deck) => PALETTES.map((palette) => CARD_BACKS[deck][palette]));
    expect(new Set(backs).size).toBe(6);
    for (const back of backs) expect(CARD_BACK_NAMES[back]).toBeTruthy();
  });
});

describe('Bee + Sloth and Mushroom + Moth (PLAN.md)', () => {
  it('puts sloths and toadstools on the red team, bees and moths on the black team', () => {
    expect(GARDEN_CAST.honey).toEqual({ red: 'sloth', black: 'bee', racer: 'spades', dealer: 'clubs' });
    expect(GARDEN_CAST.woodland).toEqual({ red: 'mushroom', black: 'moth', racer: 'clubs', dealer: 'spades' });
    expect(DECK_IDS.filter(isGardenDeck)).toEqual(['honey', 'woodland']);
  });

  it('uses the planned wording', () => {
    expect(DECKS.honey.names).toEqual({ opponent: 'bee', dealer: 'King bee', friends: 'honey friends' });
    expect(DECKS.woodland.names).toEqual({ opponent: 'moth', dealer: 'King moth', friends: 'forest friends' });
  });

  it('gives only the moth royals a light face card ink', () => {
    const withInk = DECK_IDS.flatMap((d) => Object.entries(DECKS[d].suits).filter(([, c]) => c.faceInk).map(([s]) => `${d} ${s}`));
    expect(withInk).toEqual(['woodland spades', 'woodland clubs']);
  });
});
