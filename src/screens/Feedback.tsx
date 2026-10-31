import { useId, useMemo, useState } from 'react';
import { APP_VERSION, describeDevice, FEEDBACK_EMAIL, FEEDBACK_KINDS, feedbackMailto, type FeedbackKind } from '../app/contact';
import { DECKS } from '../decks/decks';
import { GAMES } from '../games/registry';
import { Segmented } from '../settings/controls';
import { useSettings } from '../settings/SettingsContext';
import type { Settings } from '../settings/settings';
import { BackButton } from './BackButton';
import styles from './Page.module.css';

// Lets the address wrap after the @ on narrow phones rather than mid-word
const [EMAIL_USER, EMAIL_DOMAIN] = FEEDBACK_EMAIL.split('@');

const PALETTE_NAMES: Record<Settings['palette'], string> = {
  lagoon: 'Lagoon', coral: 'Coral Reef', winter: 'Winter', honeycomb: 'Honeycomb', forest: 'Forest',
};

/** What "Include phone and app details" adds, shown in full before sending. */
function deviceDetails(settings: Settings): string[] {
  const brave = 'brave' in navigator;
  const installed = matchMedia('(display-mode: standalone)').matches;
  const look = [
    PALETTE_NAMES[settings.palette],
    settings.mode,
    DECKS[settings.deck].name,
    `text size ${settings.textSize}`,
    settings.highContrast && 'high contrast',
    settings.reduceMotion && 'reduce motion',
  ].filter(Boolean).join(', ');
  return [
    `Tidepool ${APP_VERSION}${installed ? ', installed' : ', in the browser'}`,
    describeDevice(navigator.userAgent, brave),
    `Screen ${window.innerWidth}×${window.innerHeight}`,
    look,
  ];
}

export function Feedback({ fromHome = false }: { fromHome?: boolean }) {
  const { settings } = useSettings();
  const kindId = useId();
  const gameId = useId();
  const messageId = useId();
  const errorId = useId();
  const [kind, setKind] = useState<FeedbackKind>('idea');
  const [game, setGame] = useState('');
  const [message, setMessage] = useState('');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [missing, setMissing] = useState(false);
  const [sent, setSent] = useState(false);
  const details = useMemo(() => deviceDetails(settings), [settings]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setMissing(true);
      document.getElementById(messageId)?.focus();
      return;
    }
    window.location.href = feedbackMailto({ kind, game: game || null, message, details: includeDetails ? details : null });
    setSent(true);
  };

  return (
    <main className={`screen ${styles.page}`}>
      <header className={styles.header}>
        <BackButton to={fromHome ? { name: 'home' } : { name: 'settings' }} />
        <h1 className={styles.title}>Feedback</h1>
      </header>

      <p className={styles.text}>
        Tidepool is in beta, so ideas, problems and hellos all help. Sending opens your email app with this filled in;
        nothing is sent until you press send there.
      </p>

      <form className={styles.form} onSubmit={send} noValidate>
        <div className="panel">
          <span id={kindId} className={styles.label}>What's it about?</span>
          <Segmented<FeedbackKind>
            labelledBy={kindId}
            value={kind}
            onChange={setKind}
            options={FEEDBACK_KINDS.map(({ value, label }) => ({ value, label }))}
          />
        </div>

        <div className="panel">
          <label htmlFor={gameId} className={styles.label}>Which game? (optional)</label>
          <select id={gameId} className={styles.field} value={game} onChange={(e) => setGame(e.target.value)}>
            <option value="">The whole app</option>
            {GAMES.map(({ id, title }) => <option key={id} value={title}>{title}</option>)}
          </select>
        </div>

        <div className="panel">
          <label htmlFor={messageId} className={styles.label}>Your message</label>
          <textarea
            id={messageId}
            className={styles.field}
            value={message}
            maxLength={1500}
            placeholder={kind === 'problem' ? 'What happened, and what were you doing just before?' : 'Write as much or as little as you like'}
            aria-invalid={missing && !message.trim()}
            aria-describedby={missing && !message.trim() ? errorId : undefined}
            onChange={(e) => setMessage(e.target.value)}
          />
          {missing && !message.trim() && <p id={errorId} className={styles.error}>Write a few words first.</p>}
        </div>

        <div className="panel">
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={includeDetails}
              onChange={(e) => setIncludeDetails(e.target.checked)}
            />
            <span>
              <span className={styles.label} style={{ marginBottom: 2 }}>Include phone and app details</span>
              <span className={styles.hint}>Helps track down problems. This is all it adds:</span>
            </span>
          </label>
          {includeDetails && (
            <div className={styles.details}>
              {details.map((line) => <div key={line}>{line}</div>)}
            </div>
          )}
        </div>

        <button type="submit" className={styles.primary}>Open my email app</button>
        <p className={styles.small} role="status">
          {sent
            ? `Thank you! If your email app didn't open, write to ${FEEDBACK_EMAIL}.`
            : null}
        </p>
      </form>

      <p className={styles.small}>
        Or email{' '}
        <a className={styles.inlineLink} href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Tidepool feedback')}`}>
          {EMAIL_USER}@<wbr />{EMAIL_DOMAIN}
        </a>{' '}
        directly.
      </p>
    </main>
  );
}
