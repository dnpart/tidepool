// The bee, sloth, toadstool, luna moth and cats must match the approved master art in design/garden-mockup/art.js
// and cats.js.
// Both are drawn for every pose and compared element by element (numbers rounded, clip ids ignored).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Suit } from '../cards/deck';
import master from '../../design/garden-mockup/art.js?raw';
import cats from '../../design/garden-mockup/cats.js?raw';
import { GardenArt, type GardenKind, type GardenProps } from './Garden';

type MockOptions = { suit: Suit; eyes?: string; hat?: string; wave?: boolean; badgeColor?: string; bowtieColor?: string; grass?: boolean };
// The mockup is a plain browser script; run it and keep its drawing functions
const MOCK = new Function(`${master}\n${cats}\nreturn SPECIES;`)() as Record<GardenKind, (o: MockOptions) => string>;

/** Each element as its tag and sorted attributes, with numbers rounded, colors uppercased and clip ids blanked. */
function normalize(svg: string): string[] {
  const out: string[] = [];
  for (const [, tag, attrText] of svg.matchAll(/<([a-zA-Z]+)([^>]*?)\/?>/g)) {
    const attrs = [...attrText.matchAll(/([\w:-]+)="([^"]*)"/g)]
      .map(([, name, value]) => {
        const v = value
          .replace(/url\(#[^)]*\)/g, 'url(#id)')
          // Numbers, but not the digits inside a color like #3E846C
          .replace(/(?<!#[0-9a-fA-F]*)-?\d*\.?\d+(e-?\d+)?/g, (n) => String(Number(Number(n).toFixed(2))))
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();
        return `${name}=${name === 'id' ? 'id' : v}`;
      })
      .sort();
    // React wraps the drawing in an svg and groups the eyes; the mockup does neither
    if ((tag === 'g' || tag === 'svg') && attrs.length === 0) continue;
    out.push(`${tag} ${attrs.join(' ')}`);
  }
  return out;
}

function react(props: GardenProps): string {
  return renderToStaticMarkup(<svg><GardenArt {...props} /></svg>);
}

const SUITS: Record<GardenKind, Suit[]> = {
  sloth: ['hearts', 'diamonds'], bee: ['spades', 'clubs'], mushroom: ['hearts', 'diamonds'], moth: ['clubs', 'spades'],
  cat: ['hearts', 'diamonds', 'spades', 'clubs'],
};
const POSES: Omit<GardenProps, 'kind' | 'suit'>[] = [
  {}, { eyes: 'happy' }, { eyes: 'open' }, { eyes: 'sleepy' }, { eyes: 'open', wave: true },
  { eyes: 'open', hat: 'queen' }, { eyes: 'open', hat: 'king' }, { eyes: 'happy', hat: 'king' },
  { eyes: 'open', bowtie: '#2B3A55' }, { eyes: 'happy', badge: true, badgeColor: '#B5364A' },
];

describe('garden characters match the master art', () => {
  for (const kind of Object.keys(SUITS) as GardenKind[]) {
    for (const suit of SUITS[kind]) {
      it(`${kind}, ${suit}`, () => {
        for (const pose of POSES) {
          const mock = MOCK[kind]({ suit, eyes: pose.eyes, hat: pose.hat, wave: pose.wave, badgeColor: pose.badge ? pose.badgeColor : undefined, bowtieColor: pose.bowtie });
          expect(normalize(react({ kind, suit, ...pose })), JSON.stringify(pose)).toEqual(normalize(mock));
        }
      });
    }
  }

  it('toadstools can leave out their grass (card backs)', () => {
    const mock = MOCK.mushroom({ suit: 'hearts', eyes: 'sleepy', grass: false });
    expect(normalize(react({ kind: 'mushroom', suit: 'hearts', eyes: 'sleepy', grass: false }))).toEqual(normalize(mock));
  });
});
