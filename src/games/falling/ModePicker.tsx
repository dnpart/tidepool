import { capitalize } from '../../decks/decks';
import { Segmented } from '../../settings/controls';
import type { Mode } from './storage';
import { PACE_NAMES, PACES, type Pace } from './speed';
import styles from './Falling.module.css';

/** Solo or Versus, and in Versus the opponent's pace: on the Start card and in the menu. */
export function ModePicker({ id, mode, pace, rival, onMode, onPace }: {
  id: string;
  mode: Mode;
  pace: Pace;
  rival: string;
  onMode: (m: Mode) => void;
  onPace: (p: Pace) => void;
}) {
  return (
    <div className={styles.choice}>
      <span id={`${id}-mode`} className={styles.choiceLabel}>Play</span>
      <Segmented<Mode>
        labelledBy={`${id}-mode`}
        value={mode}
        onChange={onMode}
        options={[{ value: 'solo', label: 'Solo' }, { value: 'versus', label: 'Versus' }]}
      />
      {mode === 'versus' && (
        <>
          <span id={`${id}-pace`} className={styles.choiceLabel}>{capitalize(rival)} pace</span>
          <Segmented<Pace>
            labelledBy={`${id}-pace`}
            value={pace}
            onChange={onPace}
            options={PACES.map((p) => ({ value: p, label: PACE_NAMES[p] }))}
          />
        </>
      )}
    </div>
  );
}
