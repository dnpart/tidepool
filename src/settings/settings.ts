import type { Mode, Palette, TextSize } from '../theme/tokens';

export interface Settings {
  name: string;
  palette: Palette;
  mode: Mode;
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
  cardBack: 'starry' | 'tide';
  sfx: boolean;
  volume: number;
}

export const STORAGE_KEY = 'tidepool.settings';

export const DEFAULT_SETTINGS: Settings = {
  name: 'Night',
  palette: 'lagoon',
  mode: 'light',
  textSize: 'M',
  highContrast: false,
  reduceMotion: false,
  cardBack: 'starry',
  sfx: true,
  volume: 60,
};

const oneOf = <T>(value: unknown, options: readonly T[], fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

/** Turns whatever is in storage into valid settings, keeping good fields and defaulting the rest. */
export function parseSettings(raw: string | null): Settings {
  let data: Record<string, unknown> = {};
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') data = parsed as Record<string, unknown>;
  } catch {
    // corrupted storage: fall back to defaults
  }
  const d = DEFAULT_SETTINGS;
  const volume =
    typeof data.volume === 'number' && Number.isFinite(data.volume)
      ? Math.min(100, Math.max(0, Math.round(data.volume / 5) * 5))
      : d.volume;
  return {
    name: typeof data.name === 'string' ? data.name : d.name,
    palette: oneOf(data.palette, ['lagoon', 'coral'] as const, d.palette),
    mode: oneOf(data.mode, ['light', 'dark'] as const, d.mode),
    textSize: oneOf(data.textSize, ['S', 'M', 'L', 'XL'] as const, d.textSize),
    highContrast: bool(data.highContrast, d.highContrast),
    reduceMotion: bool(data.reduceMotion, d.reduceMotion),
    cardBack: oneOf(data.cardBack, ['starry', 'tide'] as const, d.cardBack),
    sfx: bool(data.sfx, d.sfx),
    volume,
  };
}

export function loadSettings(): Settings {
  try {
    return parseSettings(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage full or blocked: settings still work for this session
  }
}

/** Name shown in greetings; an empty name falls back to the default. */
export function displayName(settings: Settings): string {
  return settings.name.trim() || DEFAULT_SETTINGS.name;
}
