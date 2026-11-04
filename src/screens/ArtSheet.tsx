// Hidden page (#/art): every drawn asset in the app, one per figure, for scripts/export-art.mjs to gather into a
// single Illustrator file (design/art-export/tidepool-art.svg). Each figure holds one root <svg> and says where the
// art lives in the code (data-source), so edited art can be brought back. Effects (glows, ripples, sparkles in motion),
// plain shapes (dice, dominoes, holes) and UI icons are left out on purpose.
import type { ReactNode } from 'react';
import { Cloud } from '../art/Cloud';
import { Creature } from '../art/Creature';
import { Crystal } from '../art/Crystal';
import { FoxOwl } from '../art/FoxOwl';
import { Garden } from '../art/Garden';
import { KoiFish, Lantern, Petal } from '../art/KoiGarden';
import { SuitIcon } from '../art/Suit';
import { characterFor, type Character } from '../cards/Card';
import { CardBack } from '../cards/CardBack';
import { SUITS, type Rank, type Suit } from '../cards/deck';
import { CARD_BACK_NAMES, CARD_BACKS, DECK_IDS, DECKS, isGardenDeck, type DeckId } from '../decks/decks';
import { useDeck } from '../decks/useDeck';
import { Block } from '../games/coralstack/Block';
import { CORALS } from '../games/coralstack/rules';
import { Friend, type FriendKind } from '../games/falling/Friend';
import { Board, Marble } from '../games/pondhop/Board';
import { MARBLE_NAMES, type PondKind } from '../games/pondhop/board';
import { GAMES } from '../games/registry';
import { PALETTES, resolveTokens, type Palette } from '../theme/tokens';
import { CAST, CAT_CAST, gardenCast, SNOW_CAST } from './Gallery';

const SUIT_TITLE: Record<Suit, string> = { hearts: 'Hearts', diamonds: 'Diamonds', spades: 'Spades', clubs: 'Clubs' };
const CARD_RANKS: [Rank, string][] = [[1, 'Ace'], [2, 'number cards'], [11, 'Jack'], [12, 'Queen'], [13, 'King']];

const SOURCE: Record<DeckId, string> = {
  sea: 'src/art/Creature.tsx',
  arctic: 'src/art/FoxOwl.tsx (from design/fox-owl-deck.svg)',
  honey: 'src/art/Garden.tsx',
  woodland: 'src/art/Garden.tsx',
  cats: 'src/art/Cat.tsx',
};

function Piece({ section, group, name, note, source, scale, backdrop, children }: {
  section: string; group: string; name: string; note?: string; source: string; scale: number;
  /** A color behind the frame (not part of the art), for pale art like the cloud. */
  backdrop?: string;
  children: ReactNode;
}) {
  return (
    <figure data-art="" data-section={section} data-group={group} data-name={name} data-note={note ?? ''}
      data-source={source} data-scale={scale} data-backdrop={backdrop} style={{ margin: 0, display: 'inline-block' }}>
      {children}
    </figure>
  );
}

const draw = (c: Character) =>
  c.deck === 'garden' ? <Garden {...c.props} size={64} /> : c.deck === 'arctic' ? <FoxOwl {...c.props} size={64} /> : <Creature {...c.props} size={64} />;

/** Every character a deck draws: the card characters by suit, then the extra poses the screens use. */
function deckCast(deck: DeckId): { name: string; note: string; node: ReactNode }[] {
  const cards = SUITS.flatMap((suit) =>
    CARD_RANKS.map(([rank, title]) => ({ name: `${SUIT_TITLE[suit]} ${title}`, note: 'On the cards', node: draw(characterFor(deck, suit, rank)) })),
  );
  const extras =
    deck === 'sea' ? CAST.map((c) => ({ name: c.name, note: c.use, node: <Creature {...c.props} size={64} /> }))
      : deck === 'arctic' ? SNOW_CAST.map((c) => ({ name: c.name, note: c.use, node: <FoxOwl {...c.props} size={64} /> }))
        : deck === 'cats' ? CAT_CAST.map((c) => ({ name: c.name, note: c.use, node: <Garden {...c.props} size={64} /> }))
          : isGardenDeck(deck) ? gardenCast(deck).map((c) => ({ name: c.name, note: c.use, node: <Garden {...c.props} size={64} /> }))
            : [];
  return [...cards, ...extras];
}

const FRIENDS: [FriendKind, string][] = [
  ['octo', 'Octopus'], ['manta', 'Manta'], ['star', 'Starfish'], ['turtle', 'Turtle'], ['jelly', 'Jellyfish'],
  ['pearl', 'Pearl'], ['pebble', 'Pebble'], ['shellBottom', 'Bottom shell'], ['shellTop', 'Top shell'],
];
/** Each pond, with the palette whose board colors it's drawn on. */
const PONDS: [PondKind, string, Palette][] = [
  ['water', 'Lagoon and Coral Reef', 'lagoon'], ['ice', 'Winter', 'winter'], ['leaves', 'Forest', 'forest'],
  ['honey', 'Honeycomb', 'honeycomb'], ['koi', 'Koi Garden', 'koi'],
];
const PALETTE_TITLE = { lagoon: 'Lagoon', coral: 'Coral Reef', winter: 'Winter', honeycomb: 'Honeycomb', forest: 'Forest', koi: 'Koi Garden' } as const;

export function ArtSheet() {
  const deck = useDeck();
  return (
    <main style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', background: '#FFFFFF' }}>
      {DECK_IDS.flatMap((d) =>
        deckCast(d).map(({ name, note, node }) => (
          <Piece key={`${d}${name}`} section="Characters" group={DECKS[d].name} name={name} note={note} source={SOURCE[d]} scale={4}>
            {node}
          </Piece>
        )),
      )}

      {DECK_IDS.flatMap((d) =>
        PALETTES.map((palette) => {
          const back = CARD_BACKS[d][palette];
          return (
            <Piece key={`${d}${palette}`} section="Card backs" group={DECKS[d].name} name={CARD_BACK_NAMES[back]}
              note={PALETTE_TITLE[palette]} source="src/cards/CardBack.tsx, src/cards/PaletteBacks.tsx" scale={2}>
              <CardBack back={back} width={140} />
            </Piece>
          );
        }),
      )}

      {GAMES.map((g) => (
        <Piece key={g.id} section="Game icons" group={g.title} name={g.title} note={DECKS[deck].name}
          source={`src/games/${g.id}/ (its Icon file)`} scale={6}>
          <g.icon size={40} />
        </Piece>
      ))}

      {FRIENDS.map(([kind, name]) => (
        <Piece key={kind} section="Game pieces" group="Bubble Pals and Tide Swap" name={name} source="src/games/falling/Friend.tsx" scale={6}>
          <svg width={36} height={36} viewBox="-18 -18 36 36"><Friend kind={kind} cx={0} cy={0} size={32} /></svg>
        </Piece>
      ))}
      {[...CORALS, 'sand' as const].map((kind) => (
        <Piece key={kind} section="Game pieces" group="Coral Stack" name={kind === 'sand' ? 'Sand' : `Coral ${kind.toUpperCase()}`}
          source="src/games/coralstack/Block.tsx" scale={6}>
          <svg width={36} height={36} viewBox="-18 -18 36 36"><Block kind={kind} cx={0} cy={0} size={32} /></svg>
        </Piece>
      ))}
      {MARBLE_NAMES.map((name, seat) => (
        <Piece key={name} section="Game pieces" group="Pond Hop marbles" name={`${name[0].toUpperCase()}${name.slice(1)} marble`}
          source="src/games/pondhop/Board.tsx (Marble)" scale={8}>
          <svg width={20} height={20} viewBox="-10 -10 20 20"><Marble x={0} y={0} r={8} seat={seat} /></svg>
        </Piece>
      ))}
      {SUITS.map((suit) => (
        <Piece key={suit} section="Game pieces" group="Suit symbols" name={SUIT_TITLE[suit]} source="src/art/Suit.tsx" scale={6}>
          <SuitIcon suit={suit} size={24} color={DECKS.sea.suits[suit].symbol} />
        </Piece>
      ))}

      {PONDS.flatMap(([pond, palettes, palette]) =>
        (['light', 'dark'] as const).map((mode) => {
          // The board's panel and holes in that palette's own colors, light or dark
          const t = resolveTokens(palette, mode, false);
          return (
            <Piece key={`${pond}${mode}`} section="Pond Hop ponds" group={palettes} name={`${palettes} pond, ${mode}`}
              source="src/games/pondhop/Pond.tsx (the pond), Board.tsx, board.ts (POND_LOOK)" scale={1.5}>
              <span style={{ ['--surface' as string]: t.surface, ['--line' as string]: t.line, ['--ink' as string]: t.ink, display: 'contents' }}>
                <Board marbles={[[-1, -1, -1, -1], [-1, -1, -1, -1]]} size={360} targets={[]} label="" pond={pond} mode={mode} />
              </span>
            </Piece>
          );
        }),
      )}

      {/* Koi Garden's new art (Nov 4): its card backs, the koi, and its sky's petal and lantern */}
      {(['koiSea', 'koiArctic', 'koiHoney', 'koiWoodland', 'koiCats'] as const).map((back, i) => (
        <Piece key={back} section="Koi Garden" group="Card backs" name={`${DECKS[DECK_IDS[i]].name} back`}
          note={CARD_BACK_NAMES[back]} source="src/cards/KoiBacks.tsx" scale={2}>
          <CardBack back={back} width={140} />
        </Piece>
      ))}
      {(['kohaku', 'orange', 'shiro'] as const).map((kind) => (
        <Piece key={kind} section="Koi Garden" group="Koi" name={{ kohaku: 'White and red koi', orange: 'Orange koi', shiro: 'White and black koi' }[kind]}
          note="In the koi pond and on the backs" source="src/art/KoiGarden.tsx (KoiFish)" scale={6}>
          <svg width={36} height={20} viewBox="-18 -10 36 20"><KoiFish kind={kind} x={0} y={0} a={0} s={30} /></svg>
        </Piece>
      ))}
      <Piece section="Koi Garden" group="Sky" name="Cherry petal" note="Falls by day" source="src/art/KoiGarden.tsx (Petal)" scale={12}>
        <svg width={12} height={12} viewBox="-6 -6 12 12"><Petal color="#F4B8C4" /></svg>
      </Piece>
      <Piece section="Koi Garden" group="Sky" name="Paper lantern" note="Floats up at night" source="src/art/KoiGarden.tsx (Lantern)" scale={8}
        backdrop="#0F1A1C">
        <svg width={24} height={28} viewBox="-12 -14 24 28"><Lantern color="#F08C6C" /></svg>
      </Piece>

      <Piece section="Sky" group="Lagoon and Coral Reef" name="Cloud" source="src/art/Cloud.tsx" scale={3}
        backdrop="#CFE8EE">
        <Cloud width={80} />
      </Piece>
      <Piece section="Sky" group="Winter" name="Snow crystal" source="src/art/Crystal.tsx" scale={6}>
        <Crystal size={24} color="#8FB2D0" />
      </Piece>
      <Piece section="Sky" group="Forest" name="Falling leaf" source="src/sky/SkyBackground.tsx (LeafLayer)" scale={10}>
        <svg width={10} height={15} viewBox="-5 -7.5 10 15">
          <path d="M0 -7 C5 -4 5 4 0 8 C-5 4 -5 -4 0 -7 Z" fill="#8DB86B" />
          <path d="M0 -6 L0 7" stroke="#6E905A" strokeWidth={0.9} />
        </svg>
      </Piece>
    </main>
  );
}
