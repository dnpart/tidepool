import { describe, expect, it } from 'vitest';
import { cssVariables, PALETTES, resolveTokens, skyFor, withAlpha } from './tokens';

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

describe('skyFor', () => {
  it('gives Winter snow day and night, and the others clouds by day and stars by night', () => {
    expect(skyFor('winter', 'light')).toBe('snow');
    expect(skyFor('winter', 'dark')).toBe('snow');
    expect(skyFor('lagoon', 'light')).toBe('clouds');
    expect(skyFor('coral', 'dark')).toBe('stars');
  });

  it('only Winter has snow colors, and Winter has no clouds or stars', () => {
    for (const mode of ['light', 'dark'] as const) {
      const w = resolveTokens('winter', mode, false);
      expect(w.snow).not.toBeNull();
      expect(w.crystal).not.toBeNull();
      expect([w.cloud, w.starCore, w.starGlow]).toEqual([null, null, null]);
      expect(resolveTokens('lagoon', mode, false).snow).toBeNull();
    }
    expect(resolveTokens('winter', 'light', true).ink).toBe('#0A1C2C');
    expect(resolveTokens('winter', 'light', true).accent).toBe('#1F4C70');
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

// --- contrast (PLAN.md polish checklist: 4.5:1 normally, 7:1 with high contrast) ---

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1, 7), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('text contrast', () => {
  const TEXT_ON: [keyof ReturnType<typeof resolveTokens>, keyof ReturnType<typeof resolveTokens>][] = [
    ['ink', 'bg'], ['ink', 'surface'], ['ink', 'accentSoft'],
    ['sub', 'bg'], ['sub', 'surface'], ['sub', 'accentSoft'],
    ['onAccent', 'accent'], ['accent', 'surface'],
  ];

  for (const highContrast of [false, true]) {
    for (const palette of PALETTES) {
      for (const mode of ['light', 'dark'] as const) {
        it(`${palette} ${mode}${highContrast ? ' high contrast' : ''} meets ${highContrast ? 7 : 4.5}:1`, () => {
          const t = resolveTokens(palette, mode, highContrast);
          for (const [fg, bg] of TEXT_ON) {
            expect(contrast(t[fg] as string, t[bg] as string), `${fg} on ${bg}`).toBeGreaterThanOrEqual(highContrast ? 7 : 4.5);
          }
        });
      }
    }
  }

  it('card rank text reads on plain and face-card backgrounds', () => {
    // Values from global.css --rank-*; black suits use their symbol colors
    const ranks = [
      { text: '#BF3953', hc: '#8B2A3C', tint: '#FDE6EB' },
      { text: '#B84A1D', hc: '#883615', tint: '#FFEBDC' },
      { text: '#1E3557', hc: '#1E3557', tint: '#E3ECF9' },
      { text: '#1D4F4A', hc: '#1D4F4A', tint: '#DFF2EC' },
    ];
    for (const { text, hc, tint } of ranks) {
      for (const bg of ['#FFFDF8', tint]) {
        expect(contrast(text, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(hc, bg)).toBeGreaterThanOrEqual(7);
      }
    }
  });
});
