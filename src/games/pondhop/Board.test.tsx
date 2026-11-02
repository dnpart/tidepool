// Winter freezes the pond (design/winter-pond/frozen-pond.html, look A), and only Winter draws a hop's skate mark.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Board, type Skate } from './Board';
import { ICE } from './board';

const marbles = [[-1, -1, -1, 2], [-1, -1, -1, -1]];
const skate: Skate = { id: 1, from: [58, 140], to: [270, 270] };
const draw = (ice?: 'light' | 'dark') =>
  renderToStaticMarkup(<Board marbles={marbles} size={360} targets={[]} label="board" ice={ice} skate={skate} />);

describe('the Pond Hop board', () => {
  it('draws open water and no skate mark outside Winter', () => {
    const svg = draw();
    expect(svg).toContain('#B9E1E3');
    expect(svg).not.toContain('pathLength');
  });

  it('draws the frozen pond and the skate mark in Winter, light and dark', () => {
    for (const mode of ['light', 'dark'] as const) {
      const svg = draw(mode);
      expect(svg).not.toContain('#B9E1E3');
      expect(svg).toContain(ICE[mode].rim);
      expect(svg.match(/pathLength="1"/g)).toHaveLength(2);
    }
  });
});
