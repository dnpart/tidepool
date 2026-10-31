// Hidden page (#/gallery) showing every character and card, to check against the mockups.
import { Cloud } from '../art/Cloud';
import { Creature, type CreatureProps } from '../art/Creature';
import { FoxOwl, type FoxOwlProps } from '../art/FoxOwl';
import { Garden, type GardenProps } from '../art/Garden';
import { SuitIcon } from '../art/Suit';
import { hrefFor } from '../app/router';
import { Card } from '../cards/Card';
import { CardBack } from '../cards/CardBack';
import { play, SOUND_NAMES, type SoundName } from '../sound/sfx';
import { RANKS, SUIT_STYLE, SUITS, type Card as CardData, type Suit } from '../cards/deck';
import { CARD_BACK_NAMES, CARD_BACKS, DECK_IDS, DECKS, GARDEN_CAST, type DeckId, type GardenDeckId } from '../decks/decks';
import { PALETTES } from '../theme/tokens';
import { useDeck } from '../decks/useDeck';
import styles from './Gallery.module.css';

const CAST: { name: string; use: string; props: CreatureProps }[] = [
  { name: 'Happy', use: 'App icon, menus', props: { kind: 'octopus', color: '#EE8C9E', eyes: 'happy' } },
  { name: 'Waving', use: 'Home greeting', props: { kind: 'octopus', color: '#F6B07A', eyes: 'open', wave: true } },
  { name: 'Sleepy', use: 'Pause, rest screen', props: { kind: 'octopus', color: '#F4A6BE', eyes: 'sleepy' } },
  { name: 'Queen', use: 'Pearl crown, lashes', props: { kind: 'octopus', color: '#EE8C9E', eyes: 'open', hat: 'queen' } },
  { name: 'Manta', use: 'Speed opponent, gliding', props: { kind: 'manta', color: '#8DB0C2', eyes: 'open' } },
  { name: 'Sleepy manta', use: 'Home screen, bottom', props: { kind: 'manta', color: '#6FAFA3', eyes: 'sleepy' } },
  { name: 'Jack', use: 'Bow tie, Jack of clubs', props: { kind: 'manta', color: '#6FAFA3', eyes: 'open', bowtie: '#1D4F4A' } },
  { name: 'King', use: 'Manta crown, mustache', props: { kind: 'manta', color: '#7A9EB0', eyes: 'open', hat: 'king' } },
];

const WINTER = DECKS.arctic.suits;

// Every character in PLAN.md's Fox + Owl cast table
const SNOW_CAST: { name: string; use: string; props: FoxOwlProps }[] = [
  { name: 'Hearts fox', use: 'Happy, as drawn', props: { kind: 'fox', suit: 'hearts' } },
  { name: 'Diamonds fox', use: 'Happy, as drawn', props: { kind: 'fox', suit: 'diamonds' } },
  { name: 'Diamonds fox, open eyes', use: 'Speed opponent', props: { kind: 'fox', suit: 'diamonds', eyes: 'open' } },
  { name: 'Waving fox', use: 'Home greeting', props: { kind: 'fox', suit: 'diamonds', wave: true } },
  { name: 'Sleepy fox', use: 'Pause, Tide Pairs win', props: { kind: 'fox', suit: 'hearts', eyes: 'sleepy' } },
  { name: 'Queen fox', use: 'Queen of hearts', props: { kind: 'fox', suit: 'hearts', hat: 'queen' } },
  { name: 'Queen fox, diamonds', use: 'Peach ears', props: { kind: 'fox', suit: 'diamonds', hat: 'queen' } },
  { name: 'Cheering Queen fox', use: 'Solitaire win', props: { kind: 'fox', suit: 'hearts', hat: 'queen', eyes: 'happy' } },
  { name: 'Jack fox', use: 'Bow tie, Jack of hearts', props: { kind: 'fox', suit: 'hearts', bowtie: WINTER.hearts.symbol } },
  { name: 'Jack fox, diamonds', use: 'Jack of diamonds', props: { kind: 'fox', suit: 'diamonds', bowtie: WINTER.diamonds.symbol } },
  { name: 'King fox', use: 'Crown, mustache', props: { kind: 'fox', suit: 'hearts', hat: 'king' } },
  { name: 'King fox, diamonds', use: 'King of diamonds', props: { kind: 'fox', suit: 'diamonds', hat: 'king' } },
  { name: 'Spades owl', use: 'As drawn', props: { kind: 'owl', suit: 'spades' } },
  { name: 'Clubs owl', use: 'As drawn', props: { kind: 'owl', suit: 'clubs' } },
  { name: 'Sleepy owl', use: 'Clubs, as drawn', props: { kind: 'owl', suit: 'clubs', eyes: 'sleepy' } },
  { name: 'Sleepy owl, spades', use: 'Home, bottom edge', props: { kind: 'owl', suit: 'spades', eyes: 'sleepy' } },
  { name: 'Jack owl', use: 'Jack of clubs', props: { kind: 'owl', suit: 'clubs', bowtie: WINTER.clubs.symbol } },
  { name: 'Jack owl, spades', use: 'Jack of spades', props: { kind: 'owl', suit: 'spades', bowtie: WINTER.spades.symbol } },
  { name: 'Queen owl', use: 'Pearl crown, lashes', props: { kind: 'owl', suit: 'spades', hat: 'queen' } },
  { name: 'Queen owl, clubs', use: 'Queen of clubs', props: { kind: 'owl', suit: 'clubs', hat: 'queen' } },
  { name: 'King owl', use: 'Blackjack dealer', props: { kind: 'owl', suit: 'spades', hat: 'king' } },
  { name: 'King owl, clubs', use: 'King of clubs', props: { kind: 'owl', suit: 'clubs', hat: 'king' } },
  { name: 'Happy King owl', use: 'Blackjack: you win', props: { kind: 'owl', suit: 'spades', hat: 'king', eyes: 'happy' } },
  { name: 'Sleepy King owl', use: 'Blackjack: you lose', props: { kind: 'owl', suit: 'spades', hat: 'king', eyes: 'sleepy' } },
];

/** Every character a garden deck uses: red team, black team, and who runs the games. */
function gardenCast(deck: GardenDeckId): { name: string; use: string; props: GardenProps }[] {
  const S = DECKS[deck].suits;
  const { red, black } = GARDEN_CAST[deck];
  const redName = red === 'mushroom' ? 'toadstool' : red;
  const blackName = black;
  const { dealer, racer } = GARDEN_CAST[deck];
  const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
  return [
    { name: `Hearts ${redName}`, use: 'Happy', props: { kind: red, suit: 'hearts' } },
    { name: `Diamonds ${redName}`, use: 'Happy', props: { kind: red, suit: 'diamonds' } },
    { name: `Waving ${redName}`, use: 'Home greeting', props: { kind: red, suit: 'diamonds', eyes: 'open', wave: true } },
    { name: `Sleepy ${redName}`, use: 'Pause, Tide Pairs win', props: { kind: red, suit: 'hearts', eyes: 'sleepy' } },
    { name: `Jack ${redName}`, use: 'Jack of hearts', props: { kind: red, suit: 'hearts', eyes: 'open', bowtie: S.hearts.symbol } },
    { name: `Jack ${redName}, diamonds`, use: 'Jack of diamonds', props: { kind: red, suit: 'diamonds', eyes: 'open', bowtie: S.diamonds.symbol } },
    { name: `Queen ${redName}`, use: 'Queen of hearts', props: { kind: red, suit: 'hearts', eyes: 'open', hat: 'queen' } },
    { name: `Queen ${redName}, diamonds`, use: 'Queen of diamonds', props: { kind: red, suit: 'diamonds', eyes: 'open', hat: 'queen' } },
    { name: `Cheering Queen ${redName}`, use: 'Solitaire win', props: { kind: red, suit: 'hearts', eyes: 'happy', hat: 'queen' } },
    { name: `King ${redName}`, use: 'King of hearts', props: { kind: red, suit: 'hearts', eyes: 'open', hat: 'king' } },
    { name: `King ${redName}, diamonds`, use: 'King of diamonds', props: { kind: red, suit: 'diamonds', eyes: 'open', hat: 'king' } },
    { name: `Spades ${blackName}`, use: 'Open eyes', props: { kind: black, suit: 'spades' } },
    { name: `Clubs ${blackName}`, use: 'Open eyes', props: { kind: black, suit: 'clubs' } },
    { name: `${cap(blackName)}, happy`, use: 'Speed opponent, waiting', props: { kind: black, suit: racer, eyes: 'happy' } },
    { name: `Waving ${blackName}`, use: 'Speed: won this one', props: { kind: black, suit: racer, eyes: 'open', wave: true } },
    { name: `Sleepy ${blackName}`, use: 'Home, bottom edge', props: { kind: black, suit: racer, eyes: 'sleepy' } },
    { name: `Jack ${blackName}`, use: 'Jack of spades', props: { kind: black, suit: 'spades', eyes: 'open', bowtie: S.spades.symbol } },
    { name: `Jack ${blackName}, clubs`, use: 'Jack of clubs', props: { kind: black, suit: 'clubs', eyes: 'open', bowtie: S.clubs.symbol } },
    { name: `Queen ${blackName}`, use: 'Queen of spades', props: { kind: black, suit: 'spades', eyes: 'open', hat: 'queen' } },
    { name: `Queen ${blackName}, clubs`, use: 'Queen of clubs', props: { kind: black, suit: 'clubs', eyes: 'open', hat: 'queen' } },
    { name: `King ${blackName}`, use: 'Blackjack dealer', props: { kind: black, suit: dealer, eyes: 'open', hat: 'king' } },
    { name: `King ${blackName}, ${dealer === 'clubs' ? 'spades' : 'clubs'}`, use: `King of ${dealer === 'clubs' ? 'spades' : 'clubs'}`, props: { kind: black, suit: dealer === 'clubs' ? 'spades' : 'clubs', eyes: 'open', hat: 'king' } },
    { name: `Happy King ${blackName}`, use: 'Blackjack: you win', props: { kind: black, suit: dealer, eyes: 'happy', hat: 'king' } },
    { name: `Sleepy King ${blackName}`, use: 'Blackjack: you lose', props: { kind: black, suit: dealer, eyes: 'sleepy', hat: 'king' } },
  ];
}

const GARDEN_DECKS = [
  { deck: 'honey', title: 'Honey friends (Bee + Sloth deck)', red: 'Sloth team (red)', black: 'Bee team (black)' },
  { deck: 'woodland', title: 'Forest friends (Mushroom + Moth deck)', red: 'Toadstool team (red)', black: 'Moth team (black)' },
] as const;

// Each cat's name and shape, with its suit's colors from the Cats deck
const CAT_NAMES: Record<Suit, { name: string; team: string }> = {
  hearts: { name: 'orange cat', team: 'Orange tabby, fat loaf' },
  diamonds: { name: 'calico', team: 'Calico, skinny, sitting' },
  spades: { name: 'black cat', team: 'Black cat, skinny, sitting' },
  clubs: { name: 'Siamese', team: 'Siamese, fat loaf' },
};
const CAT_SUITS = Object.fromEntries(SUITS.map((suit) => [suit, { ...DECKS.cats.suits[suit], ...CAT_NAMES[suit] }])) as
  Record<Suit, (typeof DECKS)['cats']['suits'][Suit] & { name: string; team: string }>;

/** Every cat in every pose, and who runs the games with the Cats deck. */
const CAT_CAST: { name: string; use: string; props: GardenProps }[] = [
  ...(['hearts', 'diamonds', 'spades', 'clubs'] as const).flatMap((suit) => {
    const n = CAT_SUITS[suit].name;
    const cast: { name: string; use: string; props: GardenProps }[] = [
      { name: `Happy ${n}`, use: '', props: { kind: 'cat', suit, eyes: 'happy' } },
      { name: `Open-eyed ${n}`, use: suit === 'spades' ? 'Speed opponent, playing' : '', props: { kind: 'cat', suit, eyes: 'open' } },
      { name: `Waving ${n}`, use: suit === 'hearts' ? 'Home greeting' : suit === 'spades' ? 'Speed: won this one' : '', props: { kind: 'cat', suit, eyes: 'open', wave: true } },
      { name: `Sleepy ${n}`, use: suit === 'hearts' ? 'Pause, Tide Pairs win' : suit === 'spades' ? 'Home, bottom edge' : '', props: { kind: 'cat', suit, eyes: 'sleepy' } },
      { name: `Jack ${n}`, use: `Jack of ${suit}`, props: { kind: 'cat', suit, eyes: 'open', bowtie: CAT_SUITS[suit].symbol } },
      { name: `Queen ${n}`, use: `Queen of ${suit}`, props: { kind: 'cat', suit, eyes: 'open', hat: 'queen' } },
      { name: `King ${n}`, use: suit === 'clubs' ? 'Blackjack dealer' : `King of ${suit}`, props: { kind: 'cat', suit, eyes: 'open', hat: 'king' } },
    ];
    return cast;
  }),
  { name: 'Cheering Queen calico', use: 'Solitaire win', props: { kind: 'cat', suit: 'diamonds', eyes: 'happy', hat: 'queen' } },
  { name: 'Happy King Siamese', use: 'Blackjack: you win', props: { kind: 'cat', suit: 'clubs', eyes: 'happy', hat: 'king' } },
  { name: 'Sleepy King Siamese', use: 'Blackjack: you lose', props: { kind: 'cat', suit: 'clubs', eyes: 'sleepy', hat: 'king' } },
];

const SUIT_TITLE: Record<Suit, string> = { hearts: 'Hearts', diamonds: 'Diamonds', spades: 'Spades', clubs: 'Clubs' };

const FEATURED: { card: CardData; caption: Record<DeckId, string> }[] = [
  { card: { suit: 'hearts', rank: 1 }, caption: { sea: 'Ace: big buddy', arctic: 'Ace: big buddy', honey: 'Ace: big buddy', woodland: 'Ace: big buddy', cats: 'Ace: big buddy' } },
  {
    card: { suit: 'spades', rank: 4 },
    caption: { sea: 'Number: peeking manta', arctic: 'Number: peeking owl', honey: 'Number: peeking bee', woodland: 'Number: peeking moth', cats: 'Number: peeking black cat' },
  },
  {
    card: { suit: 'clubs', rank: 11 },
    caption: { sea: 'Jack: manta', arctic: 'Jack: owl in a bow tie', honey: 'Jack: bee in a bow tie', woodland: 'Jack: moth in a bow tie', cats: 'Jack: Siamese in a bow tie' },
  },
  { card: { suit: 'hearts', rank: 12 }, caption: { sea: 'Queen: pearl crown', arctic: 'Queen: pearl crown', honey: 'Queen: pearl crown', woodland: 'Queen: pearl crown', cats: 'Queen: pearl crown' } },
  {
    card: { suit: 'spades', rank: 13 },
    caption: { sea: 'King: manta crown', arctic: 'King: owl crown', honey: 'King: bee crown', woodland: 'King: moth crown', cats: 'King: black cat crown' },
  },
];

const PLAY_W = 50;

const PALETTE_NAMES = {
  lagoon: 'Lagoon', coral: 'Coral Reef', winter: 'Winter', honeycomb: 'Honeycomb', forest: 'Forest',
} as const;
const ALL_BACKS = DECK_IDS.flatMap((deck) => PALETTES.map((palette) => ({ deck, palette, back: CARD_BACKS[deck][palette] })));

const SOUND_LABELS: Record<SoundName, string> = {
  tap: 'Tap bloop',
  flip: 'Card flip',
  land: 'Card lands',
  invalid: 'Invalid move',
  foundation: 'To foundation',
  win: 'Win',
  speedFast: 'Speed: you were faster',
  whoosh: 'Speed: stalemate whoosh',
  splash: 'Pond Hop: lily pad hop',
  boop: 'Pond Hop: sent home',
  blub: 'Fishy: calling a fib',
};

/** A Solitaire-style column: face-down cards overlap 10px, face-up cards 24px. */
function Column({ down, up }: { down: number; up: CardData[] }) {
  const tops = [...Array(down)].map((_, i) => i * 10);
  const upStart = down * 10;
  return (
    <div className={styles.column} style={{ height: upStart + (up.length - 1) * 24 + PLAY_W * 1.4 }}>
      {tops.map((top) => (
        <CardBack key={top} width={PLAY_W} style={{ top }} className={styles.stacked} />
      ))}
      {up.map((card, i) => (
        <Card key={i} card={card} width={PLAY_W} style={{ top: upStart + i * 24 }} className={styles.stacked} />
      ))}
    </div>
  );
}

export function Gallery() {
  const deck = useDeck();
  return (
    <main className={`screen ${styles.page}`}>
      <a className={styles.back} href={hrefFor({ name: 'home' })}>← Home</a>
      <h1 className={styles.title}>Gallery</h1>

      <h2 className={styles.heading}>Sea friends</h2>
      <div className={styles.cast}>
        {CAST.map(({ name, use, props }) => (
          <figure key={name} className={styles.friend}>
            <div className={styles.bubble}><Creature {...props} size={76} /></div>
            <figcaption><strong>{name}</strong><span>{use}</span></figcaption>
          </figure>
        ))}
      </div>

      <h2 className={styles.heading}>Suit buddies</h2>
      <div className={styles.buddies}>
        {SUITS.map((suit) => {
          const style = SUIT_STYLE[suit];
          return (
            <figure key={suit} className={styles.buddy}>
              <div className={styles.bubble} style={{ background: style.tint }}>
                <Creature kind={style.team} color={style.creature} eyes="happy" badge={suit} badgeColor={style.symbol} size={76} />
              </div>
              <figcaption>
                <strong>
                  <SuitIcon suit={suit} size={16} color={style.symbol} /> {SUIT_TITLE[suit]}
                </strong>
                <span>{style.team === 'octopus' ? 'Octopus team (red)' : 'Manta team (black)'}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <h2 className={styles.heading}>Snow friends (Fox + Owl deck)</h2>
      <div className={styles.cast}>
        {SNOW_CAST.map(({ name, use, props }) => (
          <figure key={name} className={styles.friend}>
            <div className={styles.bubble} style={{ background: WINTER[props.suit].tint }}><FoxOwl {...props} size={76} /></div>
            <figcaption><strong>{name}</strong><span>{use}</span></figcaption>
          </figure>
        ))}
      </div>

      <h2 className={styles.heading}>Snow buddies</h2>
      <div className={styles.buddies}>
        {SUITS.map((suit) => (
          <figure key={suit} className={styles.buddy}>
            <div className={styles.bubble} style={{ background: WINTER[suit].tint }}>
              <FoxOwl kind={suit === 'hearts' || suit === 'diamonds' ? 'fox' : 'owl'} suit={suit} badge badgeColor={WINTER[suit].symbol} size={76} />
            </div>
            <figcaption>
              <strong>
                <SuitIcon suit={suit} size={16} color={WINTER[suit].symbol} /> {SUIT_TITLE[suit]}
              </strong>
              <span>{suit === 'hearts' || suit === 'diamonds' ? 'Fox team (red)' : 'Owl team (black)'}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {GARDEN_DECKS.map(({ deck: g, title, red, black }) => (
        <section key={g}>
          <h2 className={styles.heading}>{title}</h2>
          <div className={styles.cast}>
            {gardenCast(g).map(({ name, use, props }) => (
              <figure key={name} className={styles.friend}>
                <div className={styles.bubble} style={{ background: DECKS[g].suits[props.suit].tint }}><Garden {...props} size={76} /></div>
                <figcaption><strong>{name}</strong><span>{use}</span></figcaption>
              </figure>
            ))}
          </div>
          <div className={styles.buddies}>
            {SUITS.map((suit) => {
              const isRed = suit === 'hearts' || suit === 'diamonds';
              const kind = isRed ? GARDEN_CAST[g].red : GARDEN_CAST[g].black;
              return (
                <figure key={suit} className={styles.buddy}>
                  <div className={styles.bubble} style={{ background: DECKS[g].suits[suit].tint }}>
                    <Garden kind={kind} suit={suit} eyes="happy" badge badgeColor={DECKS[g].suits[suit].symbol} size={76} />
                  </div>
                  <figcaption>
                    <strong>
                      <SuitIcon suit={suit} size={16} color={DECKS[g].suits[suit].symbol} /> {SUIT_TITLE[suit]}
                    </strong>
                    <span>{isRed ? red : black}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      ))}

      <section>
        <h2 className={styles.heading}>Kitty friends (Cats deck)</h2>
        <div className={styles.cast}>
          {CAT_CAST.map(({ name, use, props }) => (
            <figure key={name} className={styles.friend}>
              <div className={styles.bubble} style={{ background: CAT_SUITS[props.suit].tint }}><Garden {...props} size={76} /></div>
              <figcaption><strong>{name}</strong>{use && <span>{use}</span>}</figcaption>
            </figure>
          ))}
        </div>
        <div className={styles.buddies}>
          {SUITS.map((suit) => (
            <figure key={suit} className={styles.buddy}>
              <div className={styles.bubble} style={{ background: CAT_SUITS[suit].tint }}>
                <Garden kind="cat" suit={suit} eyes="happy" badge badgeColor={CAT_SUITS[suit].symbol} size={76} />
              </div>
              <figcaption>
                <strong>
                  <SuitIcon suit={suit} size={16} color={CAT_SUITS[suit].symbol} /> {SUIT_TITLE[suit]}
                </strong>
                <span>{CAT_SUITS[suit].team}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <h2 className={styles.heading}>Card faces ({DECKS[deck].name}, change the deck in Settings)</h2>
      <div className={styles.scroller} tabIndex={0} role="group" aria-label="Featured card faces">
        {FEATURED.map(({ card, caption }) => (
          <figure key={caption.sea} className={styles.cardFigure}>
            <Card card={card} width={140} />
            <figcaption>{caption[deck]}</figcaption>
          </figure>
        ))}
      </div>

      <h2 className={styles.heading}>Card backs (one per deck and palette)</h2>
      <div className={styles.scroller} tabIndex={0} role="group" aria-label="Card backs">
        {ALL_BACKS.map(({ back, deck: d, palette }) => (
          <figure key={back} className={styles.cardFigure}>
            <CardBack back={back} width={140} />
            <CardBack back={back} width={PLAY_W} />
            <figcaption>{CARD_BACK_NAMES[back]}: {DECKS[d].name}, {PALETTE_NAMES[palette]}</figcaption>
          </figure>
        ))}
      </div>

      <h2 className={styles.heading}>At play size, on the starry table</h2>
      <div className={styles.table}>
        <Column down={0} up={[{ suit: 'spades', rank: 13 }, { suit: 'hearts', rank: 12 }, { suit: 'clubs', rank: 11 }]} />
        <Column down={2} up={[{ suit: 'diamonds', rank: 10 }]} />
        <Column down={1} up={[{ suit: 'clubs', rank: 9 }]} />
        <Column down={0} up={[{ suit: 'hearts', rank: 1 }]} />
      </div>

      <h2 className={styles.heading}>All 52, reference size</h2>
      {SUITS.map((suit) => (
        <div key={suit} className={styles.scroller} tabIndex={0} role="group" aria-label={`All ${SUIT_TITLE[suit].toLowerCase()} at reference size`}>
          {RANKS.map((rank) => <Card key={rank} card={{ suit, rank }} width={140} />)}
        </div>
      ))}

      <h2 className={styles.heading}>All 52, play size</h2>
      {SUITS.map((suit) => (
        <div key={suit} className={styles.playRow}>
          {RANKS.map((rank) => <Card key={rank} card={{ suit, rank }} width={PLAY_W} />)}
        </div>
      ))}

      <h2 className={styles.heading}>Sounds</h2>
      <div className={styles.sounds}>
        {SOUND_NAMES.map((name) => (
          <button key={name} type="button" data-silent className={styles.soundButton} onClick={() => play(name)}>
            {SOUND_LABELS[name]}
          </button>
        ))}
      </div>

      <h2 className={styles.heading}>Clouds</h2>
      <div className={styles.clouds}>
        <Cloud width={90} color="#FFFFFF" />
        <Cloud width={125} color="#FFFFFF" />
        <Cloud width={160} color="#FFFFFF" />
      </div>
    </main>
  );
}
