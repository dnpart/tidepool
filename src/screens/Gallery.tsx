// Hidden page (#/gallery) showing every character and card, to check against the mockups.
import { Cloud } from '../art/Cloud';
import { Creature, type CreatureProps } from '../art/Creature';
import { SuitIcon } from '../art/Suit';
import { hrefFor } from '../app/router';
import { Card } from '../cards/Card';
import { CardBack } from '../cards/CardBack';
import { play, SOUND_NAMES, type SoundName } from '../sound/sfx';
import { RANKS, SUIT_STYLE, SUITS, type Card as CardData, type Suit } from '../cards/deck';
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

const SUIT_TITLE: Record<Suit, string> = { hearts: 'Hearts', diamonds: 'Diamonds', spades: 'Spades', clubs: 'Clubs' };

const FEATURED: { card: CardData; caption: string }[] = [
  { card: { suit: 'hearts', rank: 1 }, caption: 'Ace: big buddy' },
  { card: { suit: 'spades', rank: 4 }, caption: 'Number: peeking manta' },
  { card: { suit: 'clubs', rank: 11 }, caption: 'Jack: manta' },
  { card: { suit: 'hearts', rank: 12 }, caption: 'Queen: pearl crown' },
  { card: { suit: 'spades', rank: 13 }, caption: 'King: manta crown' },
];

const PLAY_W = 50;

const SOUND_LABELS: Record<SoundName, string> = {
  tap: 'Tap bloop',
  flip: 'Card flip',
  land: 'Card lands',
  invalid: 'Invalid move',
  foundation: 'To foundation',
  win: 'Win',
  speedFast: 'Speed: you were faster',
  whoosh: 'Speed: stalemate whoosh',
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

      <h2 className={styles.heading}>Card faces</h2>
      <div className={styles.scroller} tabIndex={0} role="group" aria-label="Featured card faces">
        {FEATURED.map(({ card, caption }) => (
          <figure key={caption} className={styles.cardFigure}>
            <Card card={card} width={140} />
            <figcaption>{caption}</figcaption>
          </figure>
        ))}
      </div>

      <h2 className={styles.heading}>Card backs</h2>
      <div className={styles.scroller} tabIndex={0} role="group" aria-label="Card backs">
        <figure className={styles.cardFigure}><CardBack back="starry" width={140} /><figcaption>Starry sea</figcaption></figure>
        <figure className={styles.cardFigure}><CardBack back="tide" width={140} /><figcaption>Night tide</figcaption></figure>
        <figure className={styles.cardFigure}><CardBack back="starry" width={PLAY_W} /><figcaption>Play size</figcaption></figure>
        <figure className={styles.cardFigure}><CardBack back="tide" width={PLAY_W} /><figcaption>Play size</figcaption></figure>
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
