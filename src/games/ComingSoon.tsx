import { Creature } from '../art/Creature';
import { BackButton } from '../screens/BackButton';
import { useTheme } from '../theme/ThemeProvider';

// Stands in for a game until its phase is built
export function ComingSoon() {
  const { octo } = useTheme();
  return (
    <main className="screen" style={{ textAlign: 'center' }}>
      <div style={{ textAlign: 'left' }}><BackButton /></div>
      <div style={{ marginTop: 80 }}>
        <Creature kind="octopus" color={octo} eyes="sleepy" size={110} />
      </div>
      <h1 style={{ fontSize: 'var(--fs-heading)', marginTop: 16 }}>This game is still napping</h1>
      <p style={{ color: 'var(--sub)', fontSize: 'var(--fs-small)' }}>It arrives in a later build.</p>
    </main>
  );
}
