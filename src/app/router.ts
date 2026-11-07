import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'gallery' }
  /** Every drawn asset laid out for the Illustrator export (scripts/export-art.mjs). */
  | { name: 'art' }
  | { name: 'together' }
  /** `from: 'home'` when opened from Home's tips, so Back returns there instead of to Settings. */
  | { name: 'about'; from?: 'home' }
  | { name: 'feedback'; from?: 'home' }
  /** Settings → What's new (`#/whats-new`). */
  | { name: 'whatsNew'; from?: 'home' }
  | { name: 'play'; gameId: string };

/** Parses a location hash such as "#/play/solitaire". Anything unknown goes Home. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'settings' && parts.length === 1) return { name: 'settings' };
  if (parts[0] === 'gallery' && parts.length === 1) return { name: 'gallery' };
  if (parts[0] === 'art' && parts.length === 1) return { name: 'art' };
  if (parts[0] === 'together' && parts.length === 1) return { name: 'together' };
  if (parts[0] === 'whats-new' && parts.length <= 2) {
    if (parts.length === 1) return { name: 'whatsNew' };
    if (parts[1] === 'home') return { name: 'whatsNew', from: 'home' };
  }
  if ((parts[0] === 'about' || parts[0] === 'feedback') && parts.length <= 2) {
    if (parts.length === 1) return { name: parts[0] };
    if (parts[1] === 'home') return { name: parts[0], from: 'home' };
  }
  if (parts[0] === 'play' && parts.length === 2) return { name: 'play', gameId: parts[1] };
  return { name: 'home' };
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'settings':
      return '#/settings';
    case 'gallery':
      return '#/gallery';
    case 'art':
      return '#/art';
    case 'together':
      return '#/together';
    case 'about':
    case 'feedback':
      return route.from === 'home' ? `#/${route.name}/home` : `#/${route.name}`;
    case 'whatsNew':
      return route.from === 'home' ? '#/whats-new/home' : '#/whats-new';
    case 'play':
      return `#/play/${route.gameId}`;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
