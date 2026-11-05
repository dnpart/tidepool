// The fox and owl come from the owner's redrawn sheet (design/art-export/02-characters-fox-owl.svg). Card characters
// use their own cell as drawn; the screens' poses use theirs, borrowing eyes only when other eyes are asked for.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { characterFor } from '../cards/Card';
import { RANKS, SUITS } from '../cards/deck';
import { FoxOwl, foxOwlBounds, recipeFor, type FoxOwlProps } from './FoxOwl';
import { FOX_OWL_CELLS } from './foxOwlArt';

const RANK_CELL: Record<number, string> = { 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' };
const TITLE = { hearts: 'Hearts', diamonds: 'Diamonds', spades: 'Spades', clubs: 'Clubs' } as const;

describe('the owner’s fox and owl', () => {
  it('finds the eyes in every cell, one on each side of the face, and the Queens’ lashes with them', () => {
    for (const [id, cell] of Object.entries(FOX_OWL_CELLS)) {
      const eyes = cell.nodes.filter((n) => n.part === 'eyes');
      expect(eyes.length, id).toBeGreaterThanOrEqual(2);
      const mids = eyes.map((n) => n.box[0] + n.box[2] / 2);
      expect(Math.max(...mids) - Math.min(...mids), id).toBeGreaterThan(10);
      const plain = FOX_OWL_CELLS[id.replace('Queen', 'number_cards') as keyof typeof FOX_OWL_CELLS];
      if (/_Queen$/.test(id)) expect(eyes.length, id).toBeGreaterThan(plain.nodes.filter((n) => n.part === 'eyes').length);
    }
  });

  it('draws every card character from its own cell, as drawn', () => {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const c = characterFor('arctic', suit, rank);
        if (c.deck !== 'arctic') throw new Error('expected a fox or owl');
        expect(recipeFor(c.props)).toEqual({ cell: `${TITLE[suit]}_${RANK_CELL[rank] ?? 'number_cards'}` });
      }
    }
  });

  it('uses the poses drawn for the screens', () => {
    const cell = (p: FoxOwlProps) => recipeFor(p);
    expect(cell({ kind: 'fox', suit: 'diamonds', eyes: 'open' })).toEqual({ cell: 'Diamonds_fox_open_eyes' });
    expect(cell({ kind: 'fox', suit: 'diamonds', wave: true })).toEqual({ cell: 'Waving_fox' });
    expect(cell({ kind: 'fox', suit: 'hearts', eyes: 'sleepy' })).toEqual({ cell: 'Sleepy_fox' });
    expect(cell({ kind: 'fox', suit: 'hearts', hat: 'queen', eyes: 'happy' })).toEqual({ cell: 'Cheering_Queen_fox' });
    expect(cell({ kind: 'owl', suit: 'clubs', eyes: 'sleepy' })).toEqual({ cell: 'Sleepy_owl' });
    expect(cell({ kind: 'owl', suit: 'spades', eyes: 'sleepy' })).toEqual({ cell: 'Sleepy_owl_spades' });
    expect(cell({ kind: 'owl', suit: 'spades', hat: 'king', eyes: 'happy' })).toEqual({ cell: 'Happy_King_owl' });
    expect(cell({ kind: 'owl', suit: 'spades', hat: 'king', eyes: 'sleepy' })).toEqual({ cell: 'Sleepy_King_owl' });
  });

  it('borrows eyes for the rest', () => {
    expect(recipeFor({ kind: 'fox', suit: 'diamonds', eyes: 'happy' })).toEqual({ cell: 'Diamonds_number_cards', eyesFrom: 'Diamonds_Ace' });
    expect(recipeFor({ kind: 'fox', suit: 'diamonds', eyes: 'sleepy' })).toEqual({ cell: 'Diamonds_number_cards', eyesFrom: 'Sleepy_fox' });
    expect(recipeFor({ kind: 'fox', suit: 'diamonds', wave: true, eyes: 'happy' })).toEqual({ cell: 'Waving_fox', eyesFrom: 'Diamonds_Ace' });
    expect(recipeFor({ kind: 'owl', suit: 'clubs', hat: 'king', eyes: 'happy' })).toEqual({ cell: 'Clubs_King', eyesFrom: 'Clubs_Ace' });
    expect(recipeFor({ kind: 'owl', suit: 'spades', hat: 'queen', eyes: 'happy' })).toEqual({ cell: 'Spades_Queen', eyesFrom: 'Spades_Ace' });
  });

  it('measures crowns above the head', () => {
    for (const kind of ['fox', 'owl'] as const) {
      const plain = foxOwlBounds({ kind });
      expect(foxOwlBounds({ kind, hat: 'king' }).top).toBeLessThan(plain.top);
      expect(plain.bottom).toBeGreaterThan(50);
    }
  });

  it('renders every pose the app asks for', () => {
    for (const kind of ['fox', 'owl'] as const) {
      for (const suit of SUITS) {
        for (const eyes of [undefined, 'open', 'happy', 'sleepy'] as const) {
          for (const extra of [{}, { hat: 'queen' }, { hat: 'king' }, { wave: true }, { bowtie: '#000' }, { badge: true }] as const) {
            expect(renderToStaticMarkup(<FoxOwl kind={kind} suit={suit} eyes={eyes} {...extra} />)).toContain('<path');
          }
        }
      }
    }
  });
});
