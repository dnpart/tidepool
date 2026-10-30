import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'gallery' }
  | { name: 'play'; gameId: string };

/** Parses a location hash such as "#/play/solitaire". Anything unknown goes Home. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'settings' && parts.length === 1) return { name: 'settings' };
  if (parts[0] === 'gallery' && parts.length === 1) return { name: 'gallery' };
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
