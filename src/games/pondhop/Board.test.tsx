// Winter, Forest and Honeycomb have their own ponds (design/winter-pond/frozen-pond.html and
// design/pond-palettes/ponds.html, look A of each), and only those ponds mark a hop.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Board, type HopTrail } from './Board';
import { FOREST, HONEY, ICE, pondFor, type PondKind } from './board';

const marbles = [[-1, -1, -1, 2], [-1, -1, -1, -1]];
const hop: HopTrail = { id: 1, from: [58, 140], to: [270, 270] };
const draw = (pond: PondKind, mode: 'light' | 'dark' = 'light') =>
  renderToStaticMarkup(<Board marbles={marbles} size={360} targets={[]} label="board" pond={pond} mode={mode} hop={hop} />);

describe('the Pond Hop board', () => {
  it('gives each palette its pond', () => {
    expect(['lagoon', 'coral', 'winter', 'forest', 'honeycomb'].map(pondFor)).toEqual(['water', 'water', 'ice', 'leaves', 'honey']);
  });

  it('draws open water and no hop mark in Lagoon and Coral Reef', () => {
    const svg = draw('water');
    expect(svg).toContain('#B9E1E3');
    expect(svg).not.toContain('pathLength');
    expect(svg).not.toContain('animation-delay');
  });

  for (const mode of ['light', 'dark'] as const) {
    it(`draws the ice and a skate mark (${mode})`, () => {
      const svg = draw('ice', mode);
      expect(svg).not.toContain('#B9E1E3');
      expect(svg).toContain(ICE[mode].rim);
      expect(svg.match(/pathLength="1"/g)).toHaveLength(2);
    });

    it(`draws the leafy pond and three ripples where a hop skips (${mode})`, () => {
      const svg = draw('leaves', mode);
      expect(svg).toContain(FOREST[mode].rim);
      expect(svg.match(/animation-delay:\d+ms/g)).toHaveLength(3);
      // fireflies glow over it at night only
      expect(svg.includes('#FFF4D6')).toBe(mode === 'dark');
    });

    it(`draws the honey pool and a honey trail (${mode})`, () => {
      const svg = draw('honey', mode);
      expect(svg).toContain(HONEY[mode].rim);
      expect(svg).toContain(HONEY[mode].trail);
      expect(svg.match(/<polygon/g)).toHaveLength(16 + 3);
    });
  }
});
