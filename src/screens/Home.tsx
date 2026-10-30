import { Creature } from '../art/Creature';
import { ChevronRight, PlusIcon, SlidersIcon } from '../art/icons';
import { hrefFor } from '../app/router';
import { GAMES } from '../games/registry';
import { useSettings } from '../settings/SettingsContext';
import { displayName } from '../settings/settings';
import { useTheme } from '../theme/ThemeProvider';
import buttons from './Buttons.module.css';
import styles from './Home.module.css';

export function Home() {
  const { settings } = useSettings();
  const { octo, octo2, manta } = useTheme();
  return (
    <>
      <main className={`screen ${styles.home}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>TIDEPOOL</p>
            <h1 className={styles.title}>Hi, {displayName(settings)}</h1>
          </div>
          <a className={buttons.iconButton} href={hrefFor({ name: 'settings' })} aria-label="Settings">
            <SlidersIcon />
          </a>
        </header>

        <section className={styles.greeting}>
          <Creature kind="octopus" color={octo} eyes="open" wave size={100} className={styles.waver} />
          <div className={styles.greetingText}>
            <h2 className={styles.greetingTitle}>What sounds nice right now?</h2>
            <p className={styles.greetingSub}>No timers unless you want them.</p>
          </div>
          <Creature kind="manta" color={manta} size={50} className={styles.glider} />
        </section>

        <div className={styles.sectionRow}>
          <h2 className={styles.sectionTitle}>Your games</h2>
          <span className={styles.count}>{GAMES.length} {GAMES.length === 1 ? 'game' : 'games'}</span>
        </div>

        <ul className={styles.list}>
          {GAMES.map(({ id, title, description, icon: Icon }) => (
            <li key={id}>
              <a className={styles.row} href={hrefFor({ name: 'play', gameId: id })}>
                <span className={styles.tile}><Icon size={40} /></span>
                <span className={styles.rowText}>
                  <span className={styles.rowTitle}>{title}</span>
                  <span className={styles.rowSub}>{description}</span>
                </span>
                <ChevronRight className={styles.chevron} />
              </a>
            </li>
          ))}
          <li className={styles.more}>
            <span className={styles.moreIcon}><PlusIcon size={26} /></span>
            <span>More games will live here</span>
          </li>
        </ul>
      </main>

      <div className={styles.decor} aria-hidden="true">
        <Creature kind="octopus" color={octo2} eyes="happy" size={66} />
        <Creature kind="manta" color={manta} eyes="sleepy" size={88} />
        <Creature kind="octopus" color={octo} eyes="happy" size={66} />
      </div>
    </>
  );
}
