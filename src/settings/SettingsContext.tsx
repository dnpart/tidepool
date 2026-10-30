import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { configureSound } from '../sound/sfx';
import { loadSettings, saveSettings, type Settings } from './settings';

type Action = { type: 'set'; patch: Partial<Settings> } | { type: 'reset' };

function reducer(state: Settings, action: Action): Settings {
  switch (action.type) {
    case 'set':
      return { ...state, ...action.patch };
    case 'reset':
      return loadSettings();
  }
}

interface SettingsValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(reducer, undefined, loadSettings);

  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => configureSound(settings), [settings]);

  const value = useMemo<SettingsValue>(
    () => ({ settings, update: (patch) => dispatch({ type: 'set', patch }) }),
    [settings],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}
