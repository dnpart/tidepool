import { describe, expect, it } from 'vitest';
import { cssVariables, resolveTokens, withAlpha } from './tokens';

describe('resolveTokens', () => {
  it('derives dash from accent at 47% alpha', () => {
    expect(resolveTokens('lagoon', 'light', false).dash).toBe('#2A7C7678');
    expect(withAlpha('#000000', 0.47)).toBe('#00000078');
  });

  it('applies high contrast overrides', () => {
    const t = resolveTokens('coral', 'light', true);
    expect(t.ink).toBe('#2A101A');
    expect(t.sub).toBe(t.ink);
    expect(t.line).toBe(t.ink);
    expect(t.dash).toBe(t.ink);
    expect(t.borderWidth).toBe(2);
    expect(resolveTokens('lagoon', 'dark', true).ink).toBe('#FFFFFF');
  });
});

describe('cssVariables', () => {
  it('scales font sizes by text size', () => {
    const vars = cssVariables(resolveTokens('lagoon', 'light', false), 'XL');
    expect(vars['--fs-title-home']).toBe('41.6px');
    expect(vars['--accent-soft']).toBe('#CFEAE5');
    expect(vars['--on-accent']).toBe('#FFFFFF');
    expect(vars['--border-w']).toBe('1px');
  });
});
