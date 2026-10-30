import { useId } from 'react';
import { MoonIcon, SpeakerHigh, SpeakerLow, SunIcon } from '../art/icons';
import { CardBack, type CardBackStyle } from '../cards/CardBack';
import { BackButton } from '../screens/BackButton';
import { play } from '../sound/sfx';
import { BASE_TOKENS, type Mode, type Palette, type TextSize } from '../theme/tokens';
import { Segmented, SwitchRow } from './controls';
import { useSettings } from './SettingsContext';
import { displayName } from './settings';
import styles from './SettingsScreen.module.css';

const PALETTES: { value: Palette; name: string }[] = [
  { value: 'lagoon', name: 'Lagoon' },
  { value: 'coral', name: 'Coral Reef' },
];

const BACKS: { value: CardBackStyle; name: string }[] = [
  { value: 'starry', name: 'Starry sea' },
  { value: 'tide', name: 'Night tide' },
];

const SIZES: TextSize[] = ['S', 'M', 'L', 'XL'];
const SIZE_NAMES: Record<TextSize, string> = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large' };
// The "A" buttons grow more than the real scale so the steps are easy to tell apart
const SIZE_A_PX: Record<TextSize, number> = { S: 14, M: 18, L: 22, XL: 26 };

function swatches(palette: Palette): string[] {
  const t = BASE_TOKENS[palette].light;
  return [t.bg, t.accent, t.octo, t.ink];
}

export function SettingsScreen() {
  const { settings, update } = useSettings();
  const nameId = useId();
  const appearanceId = useId();
  const sizeId = useId();
  const volumeId = useId();
  const backId = useId();
  const soundOff = !settings.sfx;

  return (
    <main className={`screen ${styles.settings}`}>
      <header className={styles.header}>
        <BackButton />
        <h1 className={styles.title}>Settings</h1>
      </header>

      <section aria-label="You" className="panel">
        <label htmlFor={nameId} className={styles.label}>What should I call you?</label>
        <input
          id={nameId}
          className={styles.input}
          value={settings.name}
          maxLength={24}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="done"
          onChange={(e) => update({ name: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </section>

      <h2 className={styles.heading}>Look</h2>
      <div role="radiogroup" aria-label="Palette" className={styles.palettes}>
        {PALETTES.map(({ value, name }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={settings.palette === value}
            className={styles.paletteTile}
            onClick={() => update({ palette: value })}
          >
            <span className={styles.swatches}>
              {swatches(value).map((color) => <span key={color} className={styles.swatch} style={{ background: color }} />)}
            </span>
            <span className={styles.tileName}>{name}</span>
          </button>
        ))}
      </div>

      <div className="panel">
        <span id={appearanceId} className={styles.label}>Appearance</span>
        <Segmented<Mode>
          labelledBy={appearanceId}
          value={settings.mode}
          onChange={(mode) => update({ mode })}
          options={[
            { value: 'light', label: <><SunIcon size={20} /> Light</> },
            { value: 'dark', label: <><MoonIcon size={20} /> Dark</> },
          ]}
        />
      </div>

      <div className="panel">
        <span id={backId} className={styles.label}>Card back</span>
        <div role="radiogroup" aria-labelledby={backId} className={styles.backs}>
          {BACKS.map(({ value, name }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={settings.cardBack === value}
              className={styles.backOption}
              onClick={() => update({ cardBack: value })}
            >
              <CardBack back={value} width={56} />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      <h2 className={styles.heading}>Reading</h2>
      <div className="panel">
        <span id={sizeId} className={styles.label}>Text size</span>
        <Segmented<TextSize>
          labelledBy={sizeId}
          value={settings.textSize}
          onChange={(textSize) => update({ textSize })}
          options={SIZES.map((size) => ({
            value: size,
            ariaLabel: SIZE_NAMES[size],
            label: <span className={styles.sizeA} style={{ fontSize: SIZE_A_PX[size] }}>A</span>,
          }))}
        />
        <p className={styles.preview}>Hi, {displayName(settings)}. Ready for a game?</p>
      </div>

      <SwitchRow
        title="High contrast"
        hint="Bolder text and outlines"
        checked={settings.highContrast}
        onChange={(highContrast) => update({ highContrast })}
      />
      <SwitchRow
        title="Reduce motion"
        hint="Pauses the sky, calms card moves"
        checked={settings.reduceMotion}
        onChange={(reduceMotion) => update({ reduceMotion })}
      />

      <h2 className={styles.heading}>Sound</h2>
      <div className={`panel ${styles.soundPanel}`}>
        <SwitchRow
          title="Sound effects"
          hint="Taps, card flips, little bloops. No music."
          checked={settings.sfx}
          onChange={(sfx) => update({ sfx })}
        />
        <div className={styles.volume} data-disabled={soundOff}>
          <div className={styles.volumeHead}>
            <label htmlFor={volumeId} className={styles.label}>Volume</label>
            <span className={styles.percent}>{settings.volume}%</span>
          </div>
          <div className={styles.sliderRow}>
            <SpeakerLow size={22} />
            <input
              id={volumeId}
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.volume}
              disabled={soundOff}
              className={styles.slider}
              style={{ ['--fill' as string]: `${settings.volume}%` }}
              onChange={(e) => update({ volume: Number(e.target.value) })}
            />
            <SpeakerHigh size={22} />
          </div>
          <button type="button" className={styles.testButton} disabled={soundOff} onClick={() => play('tap')}>
            Play a test bloop
          </button>
        </div>
      </div>
    </main>
  );
}
