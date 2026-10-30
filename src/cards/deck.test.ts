import { describe, expect, it } from 'vitest';
import { seededRandom } from '../util/random';
import { cardId, cardName, createDeck, rankLabel, shuffle, teamOf } from './deck';

describe('deck', () => {
  it('has 52 unique cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardId)).size).toBe(52);
  });

  it('names cards for screen readers', () => {
    expect(cardName({ suit: 'hearts', rank: 7 })).toBe('7 of hearts');
    expect(cardName({ suit: 'spades', rank: 12 })).toBe('Queen of spades');
    expect(cardName({ suit: 'clubs', rank: 1 })).toBe('Ace of clubs');
    expect(rankLabel(10)).toBe('10');
    expect(rankLabel(13)).toBe('K');
  });

  it('puts red suits on the octopus team and black on the manta team', () => {
    expect(teamOf('hearts')).toBe('octopus');
    expect(teamOf('diamonds')).toBe('octopus');
    expect(teamOf('spades')).toBe('manta');
    expect(teamOf('clubs')).toBe('manta');
  });

  it('shuffles repeatably with a seed and keeps every card', () => {
    const a = shuffle(createDeck(), seededRandom(7));
    const b = shuffle(createDeck(), seededRandom(7));
    expect(a).toEqual(b);
    expect(a).not.toEqual(createDeck());
    expect(new Set(a.map(cardId)).size).toBe(52);
  });
});
