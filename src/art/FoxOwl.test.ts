import { describe, expect, it } from 'vitest';
import svg from '../../design/fox-owl-deck.svg?raw';
// @ts-expect-error: plain JS build script without type declarations
import { buildArt } from '../../scripts/fox-owl-art.mjs';
import generated from './foxOwlArt.ts?raw';
import { findLayer, recipeFor } from './FoxOwl';
import { FOX_OWL_CELLS } from './foxOwlArt';

describe('foxOwlArt.ts', () => {
  it('matches the owner\'s Illustrator file (run `npm run art` after changing it)', () => {
    expect(buildArt(svg)).toBe(generated);
  });

  it('gives every drawing an Eyes layer and the waving fox its toe beans', () => {
    for (const [id, cell] of Object.entries(FOX_OWL_CELLS)) {
      expect(findLayer(cell.layers, 'Eyes'), id).toBeDefined();
    }
    const beans = FOX_OWL_CELLS.foxWaving.layers.filter((l) => l.tag === 'circle');
    expect(beans).toHaveLength(5);
  });
});

describe('recipeFor (PLAN.md cast table)', () => {
  it('uses each fox drawing as drawn', () => {
    expect(recipeFor({ kind: 'fox', suit: 'hearts' })).toMatchObject({ cell: 'foxHearts', recolor: {} });
    expect(recipeFor({ kind: 'fox', suit: 'diamonds' })).toMatchObject({ cell: 'foxDiamonds', recolor: {} });
    expect(recipeFor({ kind: 'fox', suit: 'diamonds', wave: true })).toMatchObject({ cell: 'foxWaving', eyesFrom: undefined });
    expect(recipeFor({ kind: 'fox', suit: 'hearts', eyes: 'sleepy' })).toMatchObject({ cell: 'foxSleepy', recolor: {} });
  });

  it('recolors ears and borrows eyes for the variants', () => {
    expect(recipeFor({ kind: 'fox', suit: 'diamonds', hat: 'queen' }).recolor).toEqual({ '#ee8c9e': '#f6b07a' });
    expect(recipeFor({ kind: 'fox', suit: 'hearts', hat: 'queen', eyes: 'happy' }).eyesFrom).toBe('foxHearts');
    expect(recipeFor({ kind: 'fox', suit: 'diamonds', eyes: 'open' })).toMatchObject({ cell: 'foxDiamonds', eyesFrom: 'foxWaving' });
  });

  it('recolors owls between spades and clubs', () => {
    expect(recipeFor({ kind: 'owl', suit: 'clubs', hat: 'king' }).recolor).toEqual({ '#5873a6': '#3f7a73', '#3e5a92': '#2f625c' });
    expect(recipeFor({ kind: 'owl', suit: 'spades', eyes: 'sleepy' })).toMatchObject({
      cell: 'owlSleepy', recolor: { '#3f7a73': '#5873a6', '#2f625c': '#3e5a92' },
    });
  });

  it('gives suit buddy owls happy eyes and no speckles', () => {
    expect(recipeFor({ kind: 'owl', suit: 'clubs', badge: true })).toMatchObject({
      cell: 'owlClubs', eyeArcs: 'happy', drop: ['Chest_speckles', 'Wing_marks'],
    });
    expect(recipeFor({ kind: 'owl', suit: 'spades', hat: 'king', eyes: 'sleepy' }).eyeArcs).toBe('sleepy');
  });

  it('dresses Jacks in their suit color', () => {
    const r = recipeFor({ kind: 'fox', suit: 'diamonds', bowtie: '#B8461A' });
    expect(r.cell).toBe('foxJack');
    expect(r.recolor['#b5294a']).toBe('#B8461A');
    expect(r.recolor['#ee8c9e']).toBe('#f6b07a');
    expect(recipeFor({ kind: 'owl', suit: 'spades', bowtie: '#1E3557' }).recolor['#1d4f4a']).toBe('#1E3557');
  });
});
