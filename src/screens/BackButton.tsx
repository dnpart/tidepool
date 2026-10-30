import { ChevronLeft } from '../art/icons';
import { hrefFor } from '../app/router';
import styles from './Buttons.module.css';

/** 44×44 button that returns Home. */
export function BackButton() {
  return (
    <a className={styles.iconButton} href={hrefFor({ name: 'home' })} aria-label="Back to home">
      <ChevronLeft />
    </a>
  );
}
