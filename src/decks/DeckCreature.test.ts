import { describe, expect, it } from 'vitest';
import { gardenProps } from './DeckCreature';

describe('gardenProps (who plays which part in the new decks)', () => {
  it('puts the red team in hearts unless told otherwise', () => {
    expect(gardenProps('honey', { team: 'red', eyes: 'sleepy' })).toEqual({ kind: 'sloth', suit: 'hearts', eyes: 'sleepy' });
    expect(gardenProps('woodland', { team: 'red', suit: 'diamonds', wave: true })).toEqual({ kind: 'mushroom', suit: 'diamonds', wave: true });
  });

  it('races with the Spades bee or the Clubs moth, and deals with the other suit', () => {
    expect(gardenProps('honey', { team: 'racer' })).toEqual({ kind: 'bee', suit: 'spades' });
    expect(gardenProps('woodland', { team: 'racer' })).toEqual({ kind: 'moth', suit: 'clubs' });
    expect(gardenProps('honey', { team: 'dealer', hat: 'king' })).toEqual({ kind: 'bee', suit: 'clubs', hat: 'king' });
    expect(gardenProps('woodland', { team: 'dealer', hat: 'king' })).toEqual({ kind: 'moth', suit: 'spades', hat: 'king' });
  });

  it('greets with the Diamonds sloth or the orange cat, and cheers with the Hearts toadstool or the calico', () => {
    expect(gardenProps('honey', { team: 'greeter', wave: true })).toEqual({ kind: 'sloth', suit: 'diamonds', wave: true });
    expect(gardenProps('cats', { team: 'greeter', wave: true })).toEqual({ kind: 'cat', suit: 'hearts', wave: true });
    expect(gardenProps('woodland', { team: 'cheer', hat: 'queen' })).toEqual({ kind: 'mushroom', suit: 'hearts', hat: 'queen' });
    expect(gardenProps('cats', { team: 'cheer', hat: 'queen' })).toEqual({ kind: 'cat', suit: 'diamonds', hat: 'queen' });
    expect(gardenProps('cats', { team: 'racer', eyes: 'sleepy' })).toEqual({ kind: 'cat', suit: 'spades', eyes: 'sleepy' });
    expect(gardenProps('cats', { team: 'dealer', hat: 'king' })).toEqual({ kind: 'cat', suit: 'clubs', hat: 'king' });
  });

  it('keeps a black card its own suit', () => {
    expect(gardenProps('woodland', { team: 'black', suit: 'spades', eyes: 'happy' })).toEqual({ kind: 'moth', suit: 'spades', eyes: 'happy' });
  });
});
