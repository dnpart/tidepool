// Draws the right character for the chosen deck: an octopus or manta, a fox or owl (PLAN.md "Decks" table), or a
// sloth, bee, toadstool or moth (PLAN.md "Bee + Sloth and Mushroom + Moth decks").
import { Creature, type CreatureProps } from '../art/Creature';
import { FoxOwl, type FoxOwlProps } from '../art/FoxOwl';
import { Garden, type GardenProps } from '../art/Garden';
import type { Suit } from '../cards/deck';
import { GARDEN_CAST, isGardenDeck, type GardenDeckId } from './decks';
import { useDeck } from './useDeck';

/**
 * A Bee + Sloth, Mushroom + Moth or Cats character by its part rather than its species: the red team (hearts unless a
 * suit is given), a black card's own suit, or a part from GARDEN_CAST (greeter, cheering Queen, racer, dealer).
 */
export type GardenRole = Omit<GardenProps, 'kind' | 'suit'> &
  ({ team: 'red'; suit?: Suit } | { team: 'black'; suit: Suit } | { team: 'greeter' | 'cheer' | 'racer' | 'dealer' });

export function gardenProps(deck: GardenDeckId, role: GardenRole): GardenProps {
  const cast = GARDEN_CAST[deck];
  const { team, ...rest } = role;
  if (team === 'red') return { ...rest, kind: cast.red, suit: role.suit ?? 'hearts' };
  if (team === 'black') return { ...rest, kind: cast.black, suit: role.suit };
  if (team === 'greeter' || team === 'cheer') return { ...rest, kind: cast.red, suit: cast[team] };
  return { ...rest, kind: cast.black, suit: cast[team] };
}

interface DeckCreatureProps {
  sea: CreatureProps;
  arctic: FoxOwlProps;
  garden: GardenRole;
  size: number;
  /** Fox + Owl size when the mockup differs from the sea creature's. */
  arcticSize?: number;
  /** Size for the Bee + Sloth and Mushroom + Moth characters, when it differs from the sea creature's. */
  gardenSize?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Extra style for the Fox + Owl character only. */
  arcticStyle?: React.CSSProperties;
  label?: string;
}

export function DeckCreature({
  sea, arctic, garden, size, arcticSize, gardenSize, className, style, arcticStyle, label,
}: DeckCreatureProps) {
  const deck = useDeck();
  if (isGardenDeck(deck)) {
    return <Garden {...gardenProps(deck, garden)} size={gardenSize ?? size} className={className} style={style} label={label} />;
  }
  return deck === 'arctic' ? (
    <FoxOwl {...arctic} size={arcticSize ?? size} className={className} style={{ ...style, ...arcticStyle }} label={label} />
  ) : (
    <Creature {...sea} size={size} className={className} style={style} label={label} />
  );
}
