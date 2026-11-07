// What's new (Settings → What's new, or Home's first tip): what changed for players, newest first. The list lives in
// app/whatsNew.ts; opening this page clears the "something new" dot on Home's Settings button and the Settings row.
import { useEffect } from 'react';
import { formatDay, markUpdatesSeen, UPDATES } from '../app/whatsNew';
import { BackButton } from './BackButton';
import styles from './Page.module.css';

export function WhatsNew({ fromHome = false }: { fromHome?: boolean }) {
  useEffect(() => markUpdatesSeen(), []);
  return (
    <main className={`screen ${styles.page}`}>
      <header className={styles.header}>
        <BackButton to={fromHome ? { name: 'home' } : { name: 'settings' }} />
        <h1 className={styles.title}>What's new</h1>
      </header>

      <p className={styles.small}>
        New things arrive when you close Tidepool and open it again (sometimes twice).
      </p>

      {UPDATES.map((u) => (
        <section key={u.date} className="panel" aria-labelledby={`new-${u.date}`}>
          <h2 id={`new-${u.date}`} className={styles.tag}>{formatDay(u.date)}</h2>
          <ul className={styles.updates}>
            {u.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ))}
    </main>
  );
}
