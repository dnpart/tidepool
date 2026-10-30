import { useEffect } from 'react';
import { play, unlockAudio } from './sfx';

// Buttons, links and list rows bloop when tapped. Elements with data-silent play their own sound instead.
const TAPPABLE = 'button, a[href], [role="radio"], [role="switch"]';

/** Bloops on taps app-wide and creates the AudioContext on the first touch, as browsers require. */
export function useTapSounds(): void {
  useEffect(() => {
    const onPointerDown = () => unlockAudio();
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest(TAPPABLE);
      if (!target || target.closest('[data-silent]') || (target as HTMLButtonElement).disabled) return;
      play('tap');
    };
    document.addEventListener('pointerdown', onPointerDown, { once: true });
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('click', onClick);
    };
  }, []);
}
