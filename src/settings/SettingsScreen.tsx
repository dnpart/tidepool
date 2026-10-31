import { useId } from 'react';
import { Creature } from '../art/Creature';
import { FoxOwl } from '../art/FoxOwl';
import { Garden } from '../art/Garden';
import { MoonIcon, SpeakerHigh, SpeakerLow, SunIcon } from '../art/icons';
import { DECK_IDS, DECKS, GARDEN_CAST, isGardenDeck, type DeckId } from '../decks/decks';
import { BackButton } from '../screens/BackButton';
import { play } from '../sound/sfx';
import { BASE_TOKENS, type Mode, type Palette, type TextSize } from '../theme/tokens';
import { hrefFor } from '../app/router';
import { LinkRow, Segmented, SwitchRow } from './controls';
import { useSettings } from './SettingsContext';
import { DEFAULT_NAME, displayName } from './settings';
import styles from './SettingsScreen.module.css';

const PALETTES: { value: Palette; name: string; sky: string }[] = [
  { value: 'lagoon', name: 'Lagoon', sky: 'Clouds by day, stars by night' },
  { value: 'coral', name: 'Coral Reef', sky: 'Clouds by day, stars by night' },
  { value: 'winter', name: 'Winter', sky: 'Snowfall, day and night' },
  { value: 'honeycomb', name: 'Honeycomb', sky: 'Drifting pollen by day, honey glow by night' },
  { value: 'forest', name: 'Forest', sky: 'Falling leaves by day, fireflies by night' },
];

const SIZES: TextSize[] = ['S', 'M', 'L', 'XL'];
const SIZE_NAMES: Record<TextSize, string> = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large' };
// The "A" buttons grow more than the real scale so the steps are easy to tell apart
const SIZE_A_PX: Record<TextSize, number> = { S: 14, M: 18, L: 22, XL: 26 };

/** Each deck's two characters, as in the Settings mockups. */
function DeckPreview({ deck }: { deck: DeckId }) {
  if (isGardenDeck(deck)) {
    const { red, black, racer } = GARDEN_CAST[deck];
    return (
      <>
        <Garden kind={red} suit="hearts" eyes="happy" size={48} />
        <Garden kind={black} suit={racer} eyes="happy" size={48} />
      </>
    );
  }
  return deck === 'arctic' ? (
    <>
      <FoxOwl kind="fox" suit="hearts" size={48} />
      <FoxOwl kind="owl" suit="spades" size={48} />
    </>
  ) : (
    <>
      <Creature kind="octopus" color="#EE8C9E" eyes="happy" size={48} />
      <Creature kind="manta" color="#7A9EB0" eyes="open" size={48} />
    </>
  );
}

function swatches(palette: Palette): string[] {
  const t = BASE_TOKENS[palette].light;
  // The third swatch hints at the palette's own sky where its octopus colors are borrowed from Lagoon:
  // Winter's night accent, Honeycomb's honey and Forest's amber leaf
  const THIRD: Partial<Record<Palette, string>> = {
    winter: BASE_TOKENS.winter.dark.accent, honeycomb: '#F2B33D', forest: '#C9A464',
  };
  const third = THIRD[palette] ?? t.octo;
  return [t.bg, t.accent, third, t.ink];
}

export function SettingsScreen() {
  const { settings, update } = useSettings();
  const nameId = useId();
  const appearanceId = useId();
  const sizeId = useId();
  const volumeId = useId();
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
          placeholder={DEFAULT_NAME}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="done"
          onChange={(e) => update({ name: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </section>

      <h2 className={styles.heading}>Look</h2>
      <div role="radiogroup" aria-label="Palette" className={styles.palettes}>
        {PALETTES.map(({ value, name, sky }) => (
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
            <span className={styles.tileSky}>{sky}</span>
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

      <h2 className={styles.heading}>Deck</h2>
      <div role="radiogroup" aria-label="Deck" className={styles.decks}>
        {DECK_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={settings.deck === id}
            className={styles.deckOption}
            onClick={() => update({ deck: id })}
          >
            <span className={styles.deckPreview}><DeckPreview deck={id} /></span>
            <span className={styles.deckText}>
              <span className={styles.tileName}>{DECKS[id].name}</span>
              <span className={styles.deckBlurb}>{DECKS[id].blurb}</span>
            </span>
          </button>
        ))}
      </div>
      <p className={styles.deckHint}>
        Your deck also picks your company: who races you in Speed, who deals Blackjack, and who says hello on Home.
        Card backs match your palette.
      </p>

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
          <button type="button" className={styles.testButton} disabled={soundOff} data-silent onClick={() => play('tap')}>
            Play a test bloop
          </button>
        </div>
      </div>

      <h2 className={styles.heading}>Tidepool</h2>
      <LinkRow title="Send feedback" hint="Ideas, problems, or just hello" href={hrefFor({ name: 'feedback' })} />
      <LinkRow title="About Tidepool" hint="Why it exists, privacy and my view on AI" href={hrefFor({ name: 'about' })} />
      <SwitchRow
        title="Tips on Home"
        hint="The little slideshow at the top of Home"
        checked={settings.showTips}
        onChange={(showTips) => update({ showTips })}
      />
    </main>
  );
}
