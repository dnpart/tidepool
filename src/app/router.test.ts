import { describe, expect, it } from 'vitest';
import { hrefFor, parseHash } from './router';

describe('parseHash', () => {
  it('parses known routes', () => {
    expect(parseHash('')).toEqual({ name: 'home' });
    expect(parseHash('#/')).toEqual({ name: 'home' });
    expect(parseHash('#/settings')).toEqual({ name: 'settings' });
    expect(parseHash('#/gallery')).toEqual({ name: 'gallery' });
    expect(parseHash('#/play/solitaire')).toEqual({ name: 'play', gameId: 'solitaire' });
  });

  it('sends unknown routes home', () => {
    expect(parseHash('#/nope')).toEqual({ name: 'home' });
  });

  it('round-trips with hrefFor', () => {
    const route = { name: 'play', gameId: 'speed' } as const;
    expect(parseHash(hrefFor(route))).toEqual(route);
  });
});
