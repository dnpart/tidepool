import { useSettings } from '../settings/SettingsContext';
import { displayName } from '../settings/settings';
import styles from './Home.module.css';

// Phase 1: header only. The full Home layout arrives in Phase 3.
export function Home() {
  const { settings } = useSettings();
  return (
    <main className="screen">
      <header>
        <p className={styles.eyebrow}>TIDEPOOL</p>
        <h1 className={styles.title}>Hi, {displayName(settings)}</h1>
      </header>
    </main>
  );
}
