import { ChevronLeft } from '../art/icons';
import { hrefFor, type Route } from '../app/router';
import styles from './Buttons.module.css';

/** 44×44 back button; returns Home unless given another route. */
export function BackButton({ to = { name: 'home' } }: { to?: Route }) {
  const label = to.name === 'home' ? 'Back to home' : to.name === 'settings' ? 'Back to settings' : 'Back';
  return (
    <a className={styles.iconButton} href={hrefFor(to)} aria-label={label}>
      <ChevronLeft />
    </a>
  );
}
