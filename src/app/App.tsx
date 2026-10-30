import { SettingsProvider } from '../settings/SettingsContext';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Home } from '../screens/Home';
import { Placeholder } from '../screens/Placeholder';
import { useRoute } from './router';

function Screens() {
  const route = useRoute();
  switch (route.name) {
    case 'home':
      return <Home />;
    case 'settings':
      return <Placeholder title="Settings" />;
    case 'play':
      return <Placeholder title={route.gameId} />;
  }
}

export function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <Screens />
      </ThemeProvider>
    </SettingsProvider>
  );
}
