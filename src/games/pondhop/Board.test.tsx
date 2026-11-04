// The pond fills the circle (design/pond-palettes/koi-ponds.html, chosen Nov 4): each palette has its own water and
// edge, the home lanes run on piers, and a hop leaves its mark on the water.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Board, type HopTrail } from './Board';
import { holeAt, pondFor, POND_LOOK, type PondKind } from './board';

const marbles = [[-1, -1, -1, 2], [-1, -1, -1, -1]];
const hop: HopTrail = { id: 1, from: holeAt(5), to: holeAt(25) };
const draw = (pond: PondKind, mode: 'light' | 'dark' = 'light', withHop = true) =>
  renderToStaticMarkup(<Board marbles={marbles} size={360} targets={[]} label="board" pond={pond} mode={mode} hop={withHop ? hop : null} />);

describe('the Pond Hop board', () => {
  it('gives each palette its pond', () => {
    expect(['lagoon', 'coral', 'winter', 'forest', 'honeycomb', 'koi'].map(pondFor)).toEqual(['water', 'water', 'ice', 'leaves', 'honey', 'koi']);
  });

  for (const kind of ['water', 'ice', 'leaves', 'honey', 'koi'] as const) {
    for (const mode of ['light', 'dark'] as const) {
      it(`draws the ${kind} pond in ${mode}: its water, an edge piece under each of the 36 holes off the lily pads, four piers`, () => {
        const svg = draw(kind, mode, false);
        const look = POND_LOOK[kind][mode];
        expect(svg).toContain(look.inner);
        const edge = kind === 'honey' ? `fill="${look.stone[0]}" stroke="${look.stone[1]}" stroke-width="1.6"` : `fill="${look.stone[0]}"`;
        expect(svg.split(edge).length - 1).toBe(36);
        expect(svg).toContain(look.pier);
      });
    }
  }

  it('marks a hop: ripples on water, a skate mark on ice, a honey trail in honey', () => {
    for (const kind of ['water', 'leaves', 'koi'] as const) expect(draw(kind).match(/animation-delay:\d+ms/g)).toHaveLength(3);
    expect(draw('ice').match(/pathLength="1"/g)).toHaveLength(2);
    expect(draw('honey')).toContain('#A9620F');
    expect(draw('water', 'light', false)).not.toContain('animation-delay');
  });

  it('shows fireflies over the forest pond at night only', () => {
    expect(draw('leaves', 'dark', false)).toContain('#FFF4D6');
    expect(draw('leaves', 'light', false)).not.toContain('#FFF4D6');
  });
});
