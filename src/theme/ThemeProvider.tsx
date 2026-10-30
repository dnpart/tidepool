import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { useSettings } from '../settings/SettingsContext';
import { cssVariables, resolveTokens } from './tokens';

/** Applies the current theme as CSS variables on <html>, so every component reads var(--ink) etc. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { palette, mode, highContrast, textSize, reduceMotion } = useSettings().settings;

  useLayoutEffect(() => {
    const root = document.documentElement;
    const theme = resolveTokens(palette, mode, highContrast);
    for (const [name, value] of Object.entries(cssVariables(theme, textSize))) {
      root.style.setProperty(name, value);
    }
    root.dataset.palette = palette;
    root.dataset.mode = mode;
    root.dataset.contrast = highContrast ? 'high' : 'standard';
    root.dataset.reduceMotion = String(reduceMotion);
    root.style.colorScheme = mode;
  }, [palette, mode, highContrast, textSize, reduceMotion]);

  // Turn on theme crossfades only after the first theme has painted
  useEffect(() => {
    const id = requestAnimationFrame(() => (document.documentElement.dataset.ready = 'true'));
    return () => cancelAnimationFrame(id);
  }, []);

  return <>{children}</>;
}
