import { hrefFor } from '../app/router';
import { APP_VERSION, KOFI_URL, SOURCE_URL } from '../app/contact';
import { ChevronRight } from '../art/icons';
import { DeckCreature } from '../decks/DeckCreature';
import { GAMES } from '../games/registry';
import { useTheme } from '../theme/ThemeProvider';
import { BackButton } from './BackButton';
import styles from './Page.module.css';

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function About({ fromHome = false }: { fromHome?: boolean }) {
  const { octo } = useTheme();
  return (
    <main className={`screen ${styles.page}`}>
      <header className={styles.header}>
        <BackButton to={fromHome ? { name: 'home' } : { name: 'settings' }} />
        <h1 className={styles.title}>About Tidepool</h1>
      </header>

      <section className={styles.hero} aria-labelledby="about-why">
        <DeckCreature
          sea={{ kind: 'octopus', color: octo, eyes: 'happy', wave: true }}
          arctic={{ kind: 'fox', suit: 'diamonds', wave: true }}
          garden={{ team: 'greeter', eyes: 'happy', wave: true }}
          size={84}
          className={styles.heroCreature}
        />
        <div>
          <h2 id="about-why" className={styles.heroTitle}>Why Tidepool exists</h2>
          <p className={styles.small}>Beta {APP_VERSION}</p>
        </div>
      </section>

      <div className="panel">
        <p className={styles.text}>
          Tidepool started as a fun little app I made so I could play Solitaire with no ads. It ended up being more
          than that: {NUMBER_WORDS[GAMES.length] ?? GAMES.length} games, five decks and a lot of small, sleepy characters.
        </p>
        <p className={styles.text}>Maybe I'll add more games later. Playing together on two phones is next.</p>
      </div>

      <section className="panel" aria-labelledby="about-ai">
        <h2 id="about-ai" className={styles.tag}>My view on AI</h2>
        <p className={styles.text}>
          I'm not anti-AI, but I am pro-regulation. AI can be an amazing tool: it helped me build the app I dreamed of.
          It also needs real rules that stop corporations from harming our planet and keep AI from being used for
          violence.
        </p>
        <p className={styles.text}>
          I use AI thoughtfully, and I try to be as kind to the planet and as ethical as I can. One small example:
          Tidepool runs on your phone, so there are no servers running for it around the clock.
        </p>
      </section>

      <section className="panel" aria-labelledby="about-private">
        <h2 id="about-private" className={styles.tag}>Your privacy</h2>
        <p className={styles.text}>
          No ads, no accounts and no tracking. Your games and settings are saved on this phone only, and Tidepool never
          sends them anywhere. Clearing your browser's data for this site clears them too.
        </p>
      </section>

      <section className={styles.tipBox} aria-labelledby="about-tip">
        <h2 id="about-tip" className={styles.tipTitle}>Keep Tidepool free</h2>
        <p className={styles.text}>
          No ads and no subscriptions, ever. If Tidepool brings you a little calm, a small tip helps keep it free for
          everyone.
        </p>
        <a className={styles.secondary} href={KOFI_URL} target="_blank" rel="noopener noreferrer">
          Leave a tip on Ko-fi
        </a>
      </section>

      <a className={styles.secondary} href={hrefFor({ name: 'feedback' })}>
        Send feedback <ChevronRight size={20} />
      </a>

      <p className={`${styles.small} ${styles.footer}`}>
        Tidepool {APP_VERSION} ·{' '}
        <a className={styles.inlineLink} href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
          See the code on GitHub
        </a>
      </p>
    </main>
  );
}
