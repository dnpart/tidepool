// Keyboard and app-visibility handling shared by the steering falling-block games.
import { useEffect } from 'react';
import type { Control } from './Controls';

/** Arrows slide, up turns, down or space drops, while playing. */
export function usePlayKeys(running: boolean, press: (c: Control) => void) {
  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Control> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'turn', ArrowDown: 'drop', ' ': 'drop' };
      const c = map[e.key];
      if (!c) return;
      e.preventDefault();
      press(c);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, press]);
}

/** Calls `pause` when the app goes to the background. */
export function usePauseWhenHidden(pause: () => void) {
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && pause();
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [pause]);
}
