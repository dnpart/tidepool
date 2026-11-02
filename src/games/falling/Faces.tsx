// The characters of the falling-block games, drawn in the chosen deck: the racer (Versus opponent, Speed's opponent)
// and the greeter (Solo, Home's waving character).
import { DeckCreature } from '../../decks/DeckCreature';
import { useTheme } from '../../theme/ThemeProvider';

type Eyes = 'open' | 'happy' | 'sleepy';
interface FaceProps {
  eyes: Eyes;
  size: number;
  wave?: boolean;
  className?: string;
}

function Face({ team, eyes, size, wave, className }: FaceProps & { team: 'racer' | 'greeter' }) {
  const { octo } = useTheme();
  return (
    <DeckCreature
      sea={{ kind: 'octopus', color: octo, eyes, wave }}
      arctic={{ kind: 'fox', suit: 'diamonds', eyes, wave }}
      garden={{ team, eyes, wave }}
      size={size}
      className={className}
    />
  );
}

export const RacerFace = (props: FaceProps) => <Face team="racer" {...props} />;
export const GreeterFace = (props: FaceProps) => <Face team="greeter" {...props} />;
