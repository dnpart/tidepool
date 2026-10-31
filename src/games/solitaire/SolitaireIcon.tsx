import { INK_DARK } from '../../art/color';
import { FoxHeadAt } from '../../art/FoxOwl';
import { GardenHeadAt } from '../../art/Garden';
import { DECKS, GARDEN_CAST, isGardenDeck } from '../../decks/decks';
import { useDeck } from '../../decks/useDeck';
import { useTheme } from '../../theme/ThemeProvider';

/** Three fanned cards; the front one has the deck's face (an octopus, the fox's head, a sloth's head or a toadstool). */
export function SolitaireIcon({ size = 40 }: { size?: number }) {
  const { octo } = useTheme();
  const deck = useDeck();
  const card = { width: 15, height: 21, rx: 3, fill: DECKS[deck].face, stroke: 'var(--ink)', strokeWidth: 2 };
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect {...card} x={8} y={9} transform="rotate(-20 15.5 30)" />
      <rect {...card} x={12.5} y={8} transform="rotate(-4 20 29)" />
      <rect {...card} x={17} y={9} transform="rotate(14 24.5 30)" />
      <g transform="rotate(14 24.5 30)">
        {isGardenDeck(deck) ? (
          <GardenHeadAt kind={GARDEN_CAST[deck].red} cx={24.5} cy={19.3} width={11} />
        ) : deck === 'arctic' ? (
          <FoxHeadAt x={19} y={14.6} width={11} />
        ) : (
          <>
            <circle cx={24.5} cy={19.5} r={4.6} fill={octo} />
            <path d="M22.4 19.4 q0.8 -1 1.6 0 M25 19.4 q0.8 -1 1.6 0" stroke={INK_DARK} strokeWidth={0.9} fill="none" strokeLinecap="round" />
          </>
        )}
      </g>
    </svg>
  );
}
