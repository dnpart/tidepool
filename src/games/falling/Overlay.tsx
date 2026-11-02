import styles from './Falling.module.css';

/** A centered card over the game: Start, Paused, Rules and the end. */
export function Overlay({ children, labelledBy }: { children: React.ReactNode; labelledBy: string }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>
  );
}
