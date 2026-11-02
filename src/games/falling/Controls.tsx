// The four buttons under a falling-block tank: Left, Turn, Right, Drop. Left and Right repeat while held. They play
// their own sounds (data-silent), so the global tap bloop doesn't sound on every press.
import { useEffect, useRef } from 'react';
import styles from './Falling.module.css';

export type Control = 'left' | 'right' | 'turn' | 'drop';

const ICONS: Record<Control, React.ReactElement> = {
  left: <path d="M14 6l-6 6 6 6" />,
  right: <path d="M10 6l6 6-6 6" />,
  turn: (
    <>
      <path d="M18 10a6.5 6.5 0 1 0 .5 5" />
      <path d="M19 5v5.5h-5.5" />
    </>
  ),
  drop: <path d="M12 4v11M7 11l5 5 5-5M6 20h12" />,
};
const LABELS: Record<Control, string> = { left: 'Left', turn: 'Turn', right: 'Right', drop: 'Drop' };
const REPEAT_AFTER_MS = 240;
const REPEAT_EVERY_MS = 85;

export function Controls({ onPress, disabled }: { onPress: (c: Control) => void; disabled?: boolean }) {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => stop, []);
  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);

  const start = (c: Control) => {
    stop();
    onPress(c);
    if (c !== 'left' && c !== 'right') return;
    const repeat = () => {
      onPress(c);
      timers.current = [setTimeout(repeat, REPEAT_EVERY_MS)];
    };
    timers.current = [setTimeout(repeat, REPEAT_AFTER_MS)];
  };

  return (
    <div className={styles.controls} role="group" aria-label="Controls">
      {(['left', 'turn', 'right', 'drop'] as const).map((c) => (
        <button
          key={c}
          type="button"
          className={styles.control}
          data-kind={c}
          data-silent
          disabled={disabled}
          // Pointer down acts at once and starts the repeat; a keyboard press comes through as a click with no pointer
          onPointerDown={(e) => {
            if (e.button > 0) return;
            e.preventDefault();
            start(c);
          }}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onClick={(e) => {
            if (e.detail === 0) onPress(c);
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            {ICONS[c]}
          </svg>
          <span>{LABELS[c]}</span>
        </button>
      ))}
    </div>
  );
}
