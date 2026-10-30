// Values copied exactly from PLAN.md "Design tokens". Do not reinterpret.

export type Palette = 'lagoon' | 'coral' | 'winter';
export const PALETTES: readonly Palette[] = ['lagoon', 'coral', 'winter'];
export type Mode = 'light' | 'dark';
export type TextSize = 'S' | 'M' | 'L' | 'XL';

export interface Tokens {
  bg: string;
  surface: string;
  ink: string;
  sub: string;
  accent: string;
  onAccent: string;
  accentSoft: string;
  line: string;
  octo: string;
  octo2: string;
  manta: string;
  cloud: string | null;
  starCore: string | null;
  starGlow: string | null;
  /** Winter sky: snowflake fill and big crystal stroke. */
  snow: string | null;
  crystal: string | null;
}

export const BASE_TOKENS: Record<Palette, Record<Mode, Tokens>> = {
  lagoon: {
    light: {
      bg: '#E4F3F0', surface: '#FFFFFF', ink: '#173B47', sub: '#4A6670',
      accent: '#2A7C76', onAccent: '#FFFFFF', accentSoft: '#CFEAE5', line: '#CFE3DF',
      octo: '#EE8C9E', octo2: '#F6B07A', manta: '#7A9EB0',
      cloud: '#FFFFFF', starCore: null, starGlow: null, snow: null, crystal: null,
    },
    dark: {
      bg: '#0D1A2B', surface: '#16283D', ink: '#E8F5F2', sub: '#A6C0C6',
      accent: '#5FC4BA', onAccent: '#0D1A2B', accentSoft: '#1E3A4E', line: '#24405A',
      octo: '#EE8C9E', octo2: '#F6B07A', manta: '#8DB0C2',
      cloud: null, starCore: '#FFF4D6', starGlow: 'rgba(255,244,214,.45)', snow: null, crystal: null,
    },
  },
  coral: {
    light: {
      bg: '#FDEEE8', surface: '#FFFFFF', ink: '#45222F', sub: '#74505B',
      accent: '#B5455F', onAccent: '#FFFFFF', accentSoft: '#F8D6DC', line: '#F1D9D3',
      octo: '#F29A8A', octo2: '#F4A6BE', manta: '#8C9CC4',
      cloud: '#FFFFFF', starCore: null, starGlow: null, snow: null, crystal: null,
    },
    dark: {
      bg: '#1D1326', surface: '#2B1D36', ink: '#FCEDE8', sub: '#D6B9C2',
      accent: '#FF8FA3', onAccent: '#1D1326', accentSoft: '#3A2545', line: '#3F2C4B',
      octo: '#F29A8A', octo2: '#F4A6BE', manta: '#A3B0D8',
      cloud: null, starCore: '#FFE9CC', starGlow: 'rgba(255,233,204,.45)', snow: null, crystal: null,
    },
  },
  winter: {
    light: {
      bg: '#E8F1F8', surface: '#FFFFFF', ink: '#16324A', sub: '#46607A',
      accent: '#2C6590', onAccent: '#FFFFFF', accentSoft: '#D5E5F2', line: '#CFDEEA',
      octo: '#EE8C9E', octo2: '#F6B07A', manta: '#7A9EB0',
      cloud: null, starCore: null, starGlow: null, snow: '#FFFFFF', crystal: '#8FB2D0',
    },
    dark: {
      bg: '#0B1521', surface: '#142333', ink: '#E6F0F8', sub: '#A7BACB',
      accent: '#8CC3EC', onAccent: '#0B1521', accentSoft: '#1C3348', line: '#26405A',
      octo: '#EE8C9E', octo2: '#F6B07A', manta: '#8DB0C2',
      cloud: null, starCore: null, starGlow: null, snow: '#F4F9FF', crystal: '#DCEBFA',
    },
  },
};

export type Sky = 'clouds' | 'stars' | 'snow';

/** Each palette brings its own sky: Winter snows day and night, the others have clouds by day and stars by night. */
export function skyFor(palette: Palette, mode: Mode): Sky {
  if (palette === 'winter') return 'snow';
  return mode === 'dark' ? 'stars' : 'clouds';
}

const HIGH_CONTRAST_INK: Record<Palette, Record<Mode, string>> = {
  lagoon: { light: '#0B1F27', dark: '#FFFFFF' },
  coral: { light: '#2A101A', dark: '#FFFFFF' },
  winter: { light: '#0A1C2C', dark: '#FFFFFF' },
};

// White button text on the light accents is under 7:1, so high contrast darkens them (dark mode already passes)
const HIGH_CONTRAST_ACCENT: Record<Palette, string> = { lagoon: '#21615C', coral: '#94394E', winter: '#1F4C70' };

export const TEXT_SCALE: Record<TextSize, number> = { S: 0.9, M: 1.0, L: 1.15, XL: 1.3 };

// Base font sizes in px, multiplied by the text size setting
export const FONT_SIZES = {
  eyebrow: 12,
  small: 14,
  body: 15,
  listTitle: 19,
  heading: 20,
  titleHome: 32,
  titleSettings: 30,
} as const;

export interface ResolvedTheme extends Tokens {
  dash: string;
  borderWidth: number;
}

/** Hex color plus alpha (0..1) as an 8-digit hex string. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase();
  return `${hex}${a}`;
}

export function resolveTokens(palette: Palette, mode: Mode, highContrast: boolean): ResolvedTheme {
  const base = BASE_TOKENS[palette][mode];
  if (!highContrast) {
    return { ...base, dash: withAlpha(base.accent, 0.47), borderWidth: 1 };
  }
  const ink = HIGH_CONTRAST_INK[palette][mode];
  const accent = mode === 'light' ? HIGH_CONTRAST_ACCENT[palette] : base.accent;
  return { ...base, ink, sub: ink, line: ink, accent, dash: ink, borderWidth: 2 };
}

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** CSS custom properties for <html>, e.g. { '--ink': '#173B47', '--fs-body': '15px' }. */
export function cssVariables(theme: ResolvedTheme, textSize: TextSize): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme)) {
    if (key === 'borderWidth') continue;
    vars[`--${kebab(key)}`] = value ?? 'transparent';
  }
  vars['--border-w'] = `${theme.borderWidth}px`;
  const scale = TEXT_SCALE[textSize];
  for (const [key, px] of Object.entries(FONT_SIZES)) {
    vars[`--fs-${kebab(key)}`] = `${+(px * scale).toFixed(2)}px`;
  }
  return vars;
}
