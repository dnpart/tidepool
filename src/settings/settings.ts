import { DECK_IDS, type DeckId } from '../decks/decks';
import { PALETTES, type Mode, type Palette, type TextSize } from '../theme/tokens';

export interface Settings {
  name: string;
  palette: Palette;
  mode: Mode;
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
  /** Which characters and card colors: Octo + Manta or Fox + Owl. */
  deck: DeckId;
  sfx: boolean;
  volume: number;
  /** The tips carousel on Home; "Hide tips" turns it off, Settings turns it back on. */
  showTips: boolean;
}

export const STORAGE_KEY = 'tidepool.settings';
/** Bumped when saved settings need a one-time fix on load (see parseSettings). */
const SETTINGS_VERSION = 2;

/** Shown when no name is set. */
export const DEFAULT_NAME = 'friend';

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  palette: 'lagoon',
  mode: 'light',
  textSize: 'M',
  highContrast: false,
  reduceMotion: false,
  deck: 'sea',
  sfx: true,
  volume: 60,
  showTips: true,
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
  let name = typeof data.name === 'string' ? data.name : d.name;
  // Before version 2 the default name "Night" was saved on first launch, so a saved "Night" there means "never set"
  if (data.v === undefined && name === 'Night') name = '';
  return {
    name,
    palette: oneOf(data.palette, PALETTES, d.palette),
    mode: oneOf(data.mode, ['light', 'dark'] as const, d.mode),
    textSize: oneOf(data.textSize, ['S', 'M', 'L', 'XL'] as const, d.textSize),
    highContrast: bool(data.highContrast, d.highContrast),
    reduceMotion: bool(data.reduceMotion, d.reduceMotion),
    deck: oneOf(data.deck, DECK_IDS, d.deck),
    sfx: bool(data.sfx, d.sfx),
    volume,
    showTips: bool(data.showTips, d.showTips),
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, v: SETTINGS_VERSION }));
  } catch {
    // storage full or blocked: settings still work for this session
  }
}

/** Name shown in greetings; an empty name falls back to the default. */
export function displayName(settings: Settings): string {
  return settings.name.trim() || DEFAULT_NAME;
}
