// A new version of Tidepool, ready to use. main.tsx registers the service worker (vite-plugin-pwa, `prompt` mode): when a
// new version has downloaded it waits, and `markUpdateReady` hands over the function that switches to it. Home shows a
// bar with a Restart button (`UpdateBar`) instead of the old "close and reopen, sometimes twice". Kept apart from the
// registration so tests and screens never import the service worker module.
import { useSyncExternalStore } from 'react';

let apply: (() => void) | null = null;
const listeners = new Set<() => void>();

/** Called once a new version is downloaded and waiting; `switchTo` reloads into it. */
export function markUpdateReady(switchTo: () => void): void {
  apply = switchTo;
  listeners.forEach((l) => l());
}

/** True once a new version is waiting. */
export function useUpdateReady(): boolean {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => apply !== null,
  );
}

/** Reloads into the new version. */
export function applyUpdate(): void {
  apply?.();
}
