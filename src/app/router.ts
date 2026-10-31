import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'gallery' }
  | { name: 'together' }
  /** `from: 'home'` when opened from Home's tips, so Back returns there instead of to Settings. */
  | { name: 'about'; from?: 'home' }
  | { name: 'feedback'; from?: 'home' }
  | { name: 'play'; gameId: string };

/** Parses a location hash such as "#/play/solitaire". Anything unknown goes Home. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'settings' && parts.length === 1) return { name: 'settings' };
  if (parts[0] === 'gallery' && parts.length === 1) return { name: 'gallery' };
  if (parts[0] === 'together' && parts.length === 1) return { name: 'together' };
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
    case 'together':
      return '#/together';
    case 'about':
    case 'feedback':
      return route.from === 'home' ? `#/${route.name}/home` : `#/${route.name}`;
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
