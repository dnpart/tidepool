import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, displayName, parseSettings } from './settings';

describe('parseSettings', () => {
  it('returns defaults for empty or broken storage', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('42')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and replaces invalid ones', () => {
    const s = parseSettings(JSON.stringify({ name: 'Sam', palette: 'coral', mode: 'purple', volume: 300 }));
    expect(s.name).toBe('Sam');
    expect(s.palette).toBe('coral');
    expect(s.mode).toBe('light');
    expect(s.volume).toBe(100);
  });

  it('keeps the Winter palette', () => {
    expect(parseSettings(JSON.stringify({ palette: 'winter' })).palette).toBe('winter');
    expect(parseSettings(JSON.stringify({ palette: 'autumn' })).palette).toBe('lagoon');
  });

  it('keeps the deck, defaulting to Octo + Manta', () => {
    expect(parseSettings(null).deck).toBe('sea');
    expect(parseSettings(JSON.stringify({ deck: 'arctic' })).deck).toBe('arctic');
    expect(parseSettings(JSON.stringify({ deck: 'honey' })).deck).toBe('honey');
    expect(parseSettings(JSON.stringify({ deck: 'woodland' })).deck).toBe('woodland');
    expect(parseSettings(JSON.stringify({ palette: 'forest' })).palette).toBe('forest');
    expect(parseSettings(JSON.stringify({ deck: 'jungle' })).deck).toBe('sea');
  });

  it('snaps volume to steps of 5', () => {
    expect(parseSettings(JSON.stringify({ volume: 43 })).volume).toBe(45);
  });
});

describe('displayName', () => {
  it('falls back to Night when blank', () => {
    expect(displayName({ ...DEFAULT_SETTINGS, name: '  ' })).toBe('Night');
  });
});
