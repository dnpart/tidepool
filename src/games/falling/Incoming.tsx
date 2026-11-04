import type { ReactNode } from 'react';
import styles from './Falling.module.css';

/**
 * "3 pebbles coming" over a tank, with a little picture for each (up to six). `icon` draws one in a 32-unit box centered
 * on (0, 0); the small version (the opponent's tank) shows just the number.
 */
export function Incoming({ count, width, small, words, icon }: {
  count: number;
  width: number;
  small?: boolean;
  /** "3 pebbles" */
  words: (n: number) => string;
  icon: ReactNode;
}) {
  const size = small ? 12 : 16;
  const shown = Math.min(count, 6);
  return (
    <div className={styles.incoming} style={{ width }} data-small={small || undefined} aria-hidden="true">
      {count > 0 && (
        <>
          <span>{small ? count : `${words(count)} coming`}</span>
          <svg width={shown * (size + 2)} height={size} viewBox={`0 0 ${shown * 34} 32`}>
            {Array.from({ length: shown }, (_, i) => <g key={i} transform={`translate(${16 + i * 34} 16)`}>{icon}</g>)}
          </svg>
        </>
      )}
    </div>
  );
}
