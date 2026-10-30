import { findGame } from '../games/registry';
import { Gallery } from '../screens/Gallery';
import { Home } from '../screens/Home';
import { SettingsProvider } from '../settings/SettingsContext';
import { SettingsScreen } from '../settings/SettingsScreen';
import { SkyBackground } from '../sky/SkyBackground';
import { ThemeProvider } from '../theme/ThemeProvider';
import { useRoute } from './router';

function Screens() {
  const route = useRoute();
  switch (route.name) {
    case 'home':
      return <Home />;
    case 'settings':
      return <SettingsScreen />;
    case 'gallery':
      return <Gallery />;
    case 'play': {
      const game = findGame(route.gameId);
      if (!game) return <Home />;
      const Game = game.component;
      return <Game />;
    }
  }
}

export function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <SkyBackground />
        <Screens />
      </ThemeProvider>
    </SettingsProvider>
  );
}
