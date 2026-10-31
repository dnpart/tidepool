import { useEffect, useRef, useState, type ReactNode } from 'react';
import { hrefFor } from '../app/router';
import { ChevronLeft, ChevronRight } from '../art/icons';
import { DeckCreature } from '../decks/DeckCreature';
import { useSettings } from '../settings/SettingsContext';
import { useReducedMotion, useTheme } from '../theme/ThemeProvider';
import styles from './Tips.module.css';

/** How long each tip shows before the next one fades in, until someone touches the tips. */
export const TIP_SECONDS = 8;

export interface Tip {
  id: string;
  title: string;
  text: string;
  action?: { label: string; href: string };
}

export function tipsFor(installed: boolean): Tip[] {
  const tips: Tip[] = [
    {
      id: 'beta',
      title: 'Tidepool is in beta',
      text: 'Something odd, or an idea? Your feedback really helps.',
      action: { label: 'Send feedback', href: hrefFor({ name: 'feedback', from: 'home' }) },
    },
    {
      id: 'yours',
      title: 'Make it yours',
      text: 'Palettes, decks, dark mode, bigger text and your name are in Settings: the sliders button at the top.',
      action: { label: 'Open Settings', href: hrefFor({ name: 'settings' }) },
    },
    {
      id: 'install',
      title: 'Keep it on your phone',
      text: 'In Chrome, open the ⋮ menu and tap Install app. On an iPhone, tap Share, then Add to Home Screen. It works offline after that.',
    },
    {
      id: 'saved',
      title: 'Saved on this phone',
      text: "Games and settings save here, with no account. Nothing leaves your phone, so clearing browser data clears them too.",
    },
    {
      id: 'together',
      title: 'Playing together is coming',
      text: 'Soon two phones on the same Wi-Fi will play together, joined by scanning a code.',
    },
    {
      id: 'calm',
      title: 'Take your time',
      text: 'No timers unless you turn them on. Solitaire has unlimited undo, and most games wait right where you left them.',
    },
    {
      id: 'updates',
      title: 'Getting updates',
      text: 'When something new arrives, close Tidepool and open it again (sometimes twice) to get it.',
    },
    {
      id: 'about',
      title: 'Made by one person',
      text: 'A little app made for fun, with no ads. Read how it started.',
      action: { label: 'About Tidepool', href: hrefFor({ name: 'about', from: 'home' }) },
    },
  ];
  // Once installed, the install tip has done its job
  return installed ? tips.filter((t) => t.id !== 'install') : tips;
}

const isInstalled = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches;

/** The greeting that has always opened Home; the first slide, and all of the box when tips are hidden. */
function Greeting() {
  const { octo } = useTheme();
  return (
    <div className={styles.greetingSlide}>
      <DeckCreature
        sea={{ kind: 'octopus', color: octo, eyes: 'open', wave: true }}
        arctic={{ kind: 'fox', suit: 'diamonds', wave: true }}
        garden={{ team: 'greeter', eyes: 'open', wave: true }}
        size={100}
        className={styles.waver}
      />
      <div className={styles.greetingText}>
        <h2 className={styles.greetingTitle}>What sounds nice right now?</h2>
        <p className={styles.greetingSub}>No timers unless you want them.</p>
      </div>
    </div>
  );
}

function Glider() {
  const { manta } = useTheme();
  return (
    <DeckCreature
      sea={{ kind: 'manta', color: manta }}
      arctic={{ kind: 'owl', suit: 'spades' }}
      garden={{ team: 'racer' }}
      size={50}
      arcticSize={46}
      gardenSize={46}
      className={styles.glider}
    />
  );
}

/**
 * Home's top box: the greeting, then tips about the app. It moves on every few seconds until it is touched, focused or
 * hovered, never with Reduce motion, and "Hide tips" turns it back into the plain greeting.
 */
export function Tips() {
  const { settings, update } = useSettings();
  const reduced = useReducedMotion();
  const [tips] = useState(() => tipsFor(isInstalled()));
  const [index, setIndex] = useState(0);
  // Turns off for good (until Home opens again) once the person takes over
  const [auto, setAuto] = useState(true);
  const [hovered, setHovered] = useState(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const count = tips.length + 1;
  const running = settings.showTips && auto && !reduced && !hovered;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), TIP_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [running, count]);

  if (!settings.showTips) {
    return (
      <section className={`${styles.box} ${styles.plain}`} aria-label="Welcome">
        <Greeting />
        <Glider />
      </section>
    );
  }

  const go = (step: number) => {
    setAuto(false);
    setIndex((i) => (i + step + count) % count);
  };

  const slides: ReactNode[] = [
    <Greeting key="hello" />,
    ...tips.map((tip) => (
      <div key={tip.id} className={styles.tipSlide}>
        <h2 className={styles.tipTitle}>{tip.title}</h2>
        <p className={styles.tipText}>{tip.text}</p>
        {tip.action && <a className={styles.action} href={tip.action.href}>{tip.action.label}</a>}
      </div>
    )),
  ];

  return (
    <section
      className={styles.box}
      aria-roledescription="carousel"
      aria-label="Welcome and tips"
      onFocus={() => setAuto(false)}
      onPointerDown={() => setAuto(false)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
    >
      <div
        className={styles.slides}
        aria-live={running ? 'off' : 'polite'}
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = swipe.current;
          swipe.current = null;
          if (!start) return;
          const dx = e.clientX - start.x;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - start.y)) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => (swipe.current = null)}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            className={styles.slide}
            data-active={i === index}
            // React 18 needs inert as a string
            {...(i === index ? {} : { inert: '' })}
          >
            {slide}
          </div>
        ))}
      </div>
      <Glider />

      <div className={styles.controls}>
        <div className={styles.nav}>
          <button type="button" className={styles.arrow} aria-label="Previous tip" onClick={() => go(-1)}>
            <ChevronLeft size={20} />
          </button>
          <span className={styles.dots} aria-hidden="true">
            {slides.map((_, i) => <span key={i} className={styles.dot} data-active={i === index} />)}
          </span>
          <button type="button" className={styles.arrow} aria-label="Next tip" onClick={() => go(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
        <button type="button" className={styles.hide} onClick={() => update({ showTips: false })}>
          Hide tips
        </button>
      </div>
    </section>
  );
}
