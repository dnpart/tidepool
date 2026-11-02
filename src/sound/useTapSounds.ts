import { useEffect } from 'react';
import { play, shouldPlay, soundSettings, unlockAudio } from './sfx';

// Buttons, links and list rows bloop when tapped. Elements with data-silent play their own sound instead.
const TAPPABLE = 'button, a[href], [role="radio"], [role="switch"]';

// iPhones only let audio start on the end of a touch (touchend, click), Chrome on its start too, so listen to both
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown'] as const;

/**
 * Bloops on taps app-wide, and creates or wakes the AudioContext on every touch (as browsers require), so sound comes
 * back after a phone call or the app sitting in the background, not only on the first touch.
 */
export function useTapSounds(): void {
  useEffect(() => {
    const wake = () => {
      if (shouldPlay(soundSettings())) unlockAudio();
    };
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest(TAPPABLE);
      if (!target || target.closest('[data-silent]') || (target as HTMLButtonElement).disabled) return;
      play('tap');
    };
    for (const g of GESTURES) document.addEventListener(g, wake, { passive: true });
    document.addEventListener('click', onClick);
    return () => {
      for (const g of GESTURES) document.removeEventListener(g, wake);
      document.removeEventListener('click', onClick);
    };
  }, []);
}
