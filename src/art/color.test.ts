import { describe, expect, it } from 'vitest';
import { shade } from './color';

describe('shade', () => {
  it('multiplies each channel', () => {
    expect(shade('#EE8C9E', 0.88)).toBe('#D17B8B');
    expect(shade('#FFFFFF', 0.5)).toBe('#808080');
  });
});
