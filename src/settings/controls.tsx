import { useId, type ReactNode } from 'react';
import styles from './controls.module.css';

/** On/off switch: a real button with role="switch". */
export function Switch({
  checked, onChange, labelledBy,
}: { checked: boolean; onChange: (value: boolean) => void; labelledBy: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      className={styles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.track}><span className={styles.knob} /></span>
    </button>
  );
}

/** A panel row with a title, optional hint and a switch on the right. */
export function SwitchRow({
  title, hint, checked, onChange,
}: { title: string; hint?: string; checked: boolean; onChange: (value: boolean) => void }) {
  const id = useId();
  return (
    <div className={`panel ${styles.switchRow}`}>
      <div className={styles.rowText}>
        <span id={id} className={styles.label}>{title}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
      <Switch checked={checked} onChange={onChange} labelledBy={id} />
    </div>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
}

/** Segmented control, built as a radio group. */
export function Segmented<T extends string>({
  options, value, onChange, labelledBy,
}: { options: SegmentOption<T>[]; value: T; onChange: (value: T) => void; labelledBy: string }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={styles.segmented}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          aria-label={option.ariaLabel}
          className={styles.segment}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
