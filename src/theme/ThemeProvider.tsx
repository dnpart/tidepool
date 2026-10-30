import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { useSettings } from '../settings/SettingsContext';
import { cssVariables, resolveTokens, type ResolvedTheme } from './tokens';

const ThemeContext = createContext<ResolvedTheme | null>(null);

/** Applies the current theme as CSS variables on <html>, so every component reads var(--ink) etc. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { palette, mode, highContrast, textSize } = useSettings().settings;
  const reduced = useReducedMotion();
  const theme = useMemo(() => resolveTokens(palette, mode, highContrast), [palette, mode, highContrast]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(cssVariables(theme, textSize))) {
      root.style.setProperty(name, value);
    }
    root.dataset.palette = palette;
    root.dataset.mode = mode;
    root.dataset.contrast = highContrast ? 'high' : 'standard';
    // Covers the setting and the phone's own reduce-motion preference
    root.dataset.reduceMotion = String(reduced);
    root.style.colorScheme = mode;
    // The phone's status bar follows the app background
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bg);
  }, [theme, palette, mode, highContrast, textSize, reduced]);

  // Turn on theme crossfades only after the first theme has painted
  useEffect(() => {
    const id = requestAnimationFrame(() => (document.documentElement.dataset.ready = 'true'));
    return () => cancelAnimationFrame(id);
  }, []);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Resolved token values, for places that need real colors rather than CSS variables (e.g. creature shading). */
export function useTheme(): ResolvedTheme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}

/** True when the Reduce motion setting is on or the phone asks for reduced motion. */
export function useReducedMotion(): boolean {
  const setting = useSettings().settings.reduceMotion;
  const [system, setSystem] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSystem(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return setting || system;
}
