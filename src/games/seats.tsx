// Who sits where in the games against one or two of the deck's characters (Dominoes and Pond Hop): seat 0 is you,
// seat 1 Speed's opponent, seat 2 the other team's character (PLAN.md "Game 5: Dominoes", Opponents).
import type { Eyes } from '../art/Creature';
import { capitalize, type DeckStyle } from '../decks/decks';
import { DeckCreature } from '../decks/DeckCreature';
import { useTheme } from '../theme/ThemeProvider';

/** "you", "the black cat" or "the orange cat", for the middle of a sentence. */
export const seatWho = (names: DeckStyle['names'], seat: number): string =>
  seat === 0 ? 'you' : `the ${seat === 1 ? names.opponent : names.second}`;

/** "You", "Black cat" or "Orange cat", for labels. */
export const seatLabel = (names: DeckStyle['names'], seat: number): string =>
  seat === 0 ? 'You' : capitalize(seat === 1 ? names.opponent : names.second);

/** The deck's character for a seat: 1 is Speed's opponent, 2 the other team's, 0 the waving greeter for your wins. */
export function SeatCharacter({ seat, eyes, wave = false, size }: { seat: number; eyes: Eyes; wave?: boolean; size: number }) {
  const { octo, manta } = useTheme();
  if (seat === 2) {
    return (
      <DeckCreature
        sea={{ kind: 'manta', color: manta, eyes }}
        arctic={{ kind: 'owl', suit: 'spades', eyes, wave }}
        garden={{ team: 'greeter', eyes, wave }}
        size={size}
      />
    );
  }
  return (
    <DeckCreature
      sea={{ kind: 'octopus', color: octo, eyes, wave }}
      arctic={{ kind: 'fox', suit: 'diamonds', eyes, wave }}
      garden={{ team: seat === 1 ? 'racer' : 'greeter', eyes, wave }}
      size={size}
    />
  );
}
