// Draws the right character for the chosen deck: an octopus or manta, or a fox or owl (PLAN.md "Decks" table).
import { Creature, type CreatureProps } from '../art/Creature';
import { FoxOwl, type FoxOwlProps } from '../art/FoxOwl';
import { useDeck } from './useDeck';

interface DeckCreatureProps {
  sea: CreatureProps;
  arctic: FoxOwlProps;
  size: number;
  /** Fox + Owl size when the mockup differs from the sea creature's. */
  arcticSize?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Extra style for the Fox + Owl character only. */
  arcticStyle?: React.CSSProperties;
  label?: string;
}

export function DeckCreature({ sea, arctic, size, arcticSize, className, style, arcticStyle, label }: DeckCreatureProps) {
  const deck = useDeck();
  return deck === 'arctic' ? (
    <FoxOwl {...arctic} size={arcticSize ?? size} className={className} style={{ ...style, ...arcticStyle }} label={label} />
  ) : (
    <Creature {...sea} size={size} className={className} style={style} label={label} />
  );
}
