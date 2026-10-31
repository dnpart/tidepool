import { describe, expect, it } from 'vitest';
import { hrefFor, parseHash } from './router';

describe('parseHash', () => {
  it('parses known routes', () => {
    expect(parseHash('')).toEqual({ name: 'home' });
    expect(parseHash('#/')).toEqual({ name: 'home' });
    expect(parseHash('#/settings')).toEqual({ name: 'settings' });
    expect(parseHash('#/gallery')).toEqual({ name: 'gallery' });
    expect(parseHash('#/play/solitaire')).toEqual({ name: 'play', gameId: 'solitaire' });
    expect(parseHash('#/about')).toEqual({ name: 'about' });
    expect(parseHash('#/feedback')).toEqual({ name: 'feedback' });
    expect(parseHash('#/feedback/home')).toEqual({ name: 'feedback', from: 'home' });
  });

  it('sends unknown routes home', () => {
    expect(parseHash('#/nope')).toEqual({ name: 'home' });
    expect(parseHash('#/feedback/elsewhere')).toEqual({ name: 'home' });
  });

  it('round-trips with hrefFor', () => {
    const route = { name: 'play', gameId: 'speed' } as const;
    expect(parseHash(hrefFor(route))).toEqual(route);
    for (const r of [{ name: 'about' }, { name: 'about', from: 'home' }, { name: 'feedback' }, { name: 'feedback', from: 'home' }] as const) {
      expect(parseHash(hrefFor(r))).toEqual(r);
    }
  });
});
