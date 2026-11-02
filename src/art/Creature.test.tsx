// The octopus and manta come from the owner's drawings (design/art-export/01-characters-octo-manta.svg). Card characters use their own
// cell untouched; other poses borrow eyes, cheeks or a crown from the cells that have them.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { characterFor } from '../cards/Card';
import { RANKS, SUITS } from '../cards/deck';
import { Creature, creatureBounds, recipeFor, type CreatureProps } from './Creature';
import { OCTO_MANTA_CELLS } from './octoMantaArt';

const RANK_CELL: Record<number, string> = { 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' };
const TITLE = { hearts: 'Hearts', diamonds: 'Diamonds', spades: 'Spades', clubs: 'Clubs' } as const;

describe('the owner’s octopus and manta', () => {
  it('splits every cell into its parts', () => {
    for (const [id, cell] of Object.entries(OCTO_MANTA_CELLS)) {
      const count = (part: string) => cell.nodes.filter((n) => n.part === part).length;
      expect(count('cheeks'), id).toBe(2);
      expect(count('eyes'), id).toBeGreaterThanOrEqual(2);
      expect(count('crown') > 0, id).toBe(/Queen|King/.test(id));
    }
  });

  it('draws every card character from its own cell, as drawn', () => {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const c = characterFor('sea', suit, rank);
        if (c.deck !== 'sea') throw new Error('expected a sea character');
        const recipe = recipeFor(c.props);
        expect(recipe.cell).toBe(`${TITLE[suit]}_${RANK_CELL[rank] ?? 'number_cards'}`);
        expect(recipe.recolor).toEqual({});
        expect([recipe.eyesFrom, recipe.cheeksFrom, recipe.crownFrom]).toEqual([undefined, undefined, undefined]);
      }
    }
  });

  it('builds the cheering Queen from the waving octopus, recolored, with her crown and happy eyes', () => {
    const recipe = recipeFor({ kind: 'octopus', color: '#EE8C9E', eyes: 'happy', hat: 'queen', wave: true });
    expect(recipe.cell).toBe('Waving');
    expect(recipe.crownFrom).toBe('Hearts_Queen');
    expect(recipe.cheeksFrom).toBe('Hearts_number_cards');
    expect(recipe.eyesFrom?.cell).toBe('Hearts_number_cards');
    expect(recipe.recolor['#f6b07a']).toBe('#ee8c9e');
  });

  it('picks the nearest suit for any body color, like the dark theme’s manta', () => {
    expect(recipeFor({ kind: 'manta', color: '#8DB0C2' }).cell).toBe('Spades_number_cards');
    expect(recipeFor({ kind: 'octopus', color: '#F4A6BE', eyes: 'happy' }).cell).toBe('Hearts_number_cards');
    expect(recipeFor({ kind: 'manta', color: '#7A9EB0', eyes: 'sleepy' }).cheeksFrom).toBe('Spades_number_cards');
  });

  it('measures crowns above the head', () => {
    for (const kind of ['octopus', 'manta'] as const) {
      const plain = creatureBounds({ kind });
      const king = creatureBounds({ kind, hat: 'king' });
      expect(king.top).toBeLessThan(plain.top);
      expect(plain.bottom).toBeGreaterThan(50);
    }
  });

  it('renders every pose the app asks for', () => {
    const poses: CreatureProps[] = [
      { kind: 'octopus', color: '#EE8C9E', eyes: 'happy', hat: 'queen', wave: true },
      { kind: 'octopus', color: '#F6B07A', eyes: 'sleepy' },
      { kind: 'manta', color: '#7A9EB0', eyes: 'happy', hat: 'king' },
      { kind: 'manta', color: '#6FAFA3', eyes: 'happy', bowtie: '#1D4F4A' },
    ];
    for (const p of poses) expect(renderToStaticMarkup(<Creature {...p} />)).toContain('<path');
  });
});
