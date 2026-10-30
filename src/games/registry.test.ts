import { describe, expect, it } from 'vitest';
import { DECKS } from '../decks/decks';
import { findGame } from './registry';

describe('game descriptions follow the deck', () => {
  it('names the deck\'s characters', () => {
    const line = (id: string, deck: keyof typeof DECKS) => findGame(id)!.description(DECKS[deck]);
    expect(line('speed', 'sea')).toBe('A quick race against the octopus');
    expect(line('speed', 'arctic')).toBe('A quick race against the fox');
    expect(line('pairs', 'arctic')).toBe('Find the matching snow friends');
    expect(line('blackjack', 'sea')).toBe('Get to 21 while the King manta deals');
    expect(line('blackjack', 'arctic')).toBe('Get to 21 while the King owl deals');
    expect(line('solitaire', 'arctic')).toBe('Klondike, at your own pace');
  });
});
