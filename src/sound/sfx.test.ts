import { describe, expect, it } from 'vitest';
import { masterGain, play, shouldPlay, configureSound } from './sfx';

describe('sound settings', () => {
  it('maps volume to master gain = volume / 100 × 0.3', () => {
    expect(masterGain(100)).toBeCloseTo(0.3);
    expect(masterGain(60)).toBeCloseTo(0.18);
    expect(masterGain(0)).toBe(0);
  });

  it('never plays when the switch is off or volume is 0', () => {
    expect(shouldPlay({ sfx: false, volume: 60 })).toBe(false);
    expect(shouldPlay({ sfx: true, volume: 0 })).toBe(false);
    expect(shouldPlay({ sfx: true, volume: 5 })).toBe(true);
  });

  it('does not touch audio at all when muted', () => {
    // No window or AudioContext in this test environment, so any audio access would throw
    configureSound({ sfx: false, volume: 60 });
    expect(() => play('win')).not.toThrow();
    configureSound({ sfx: true, volume: 0 });
    expect(() => play('tap')).not.toThrow();
  });
});
