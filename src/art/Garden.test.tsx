// The bee, sloth, toadstool and cats must match the approved master art in design/garden-mockup/art.js and cats.js,
// drawn for every pose without a crown or bow tie and compared element by element (numbers rounded, clip ids ignored).
// Crowns, bow ties and mustaches are the owner's now (royalArt.ts, Nov 22), and so is the moth (mothArt.ts): those are
// checked against the owner's shapes instead.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Suit } from '../cards/deck';
import master from '../../design/garden-mockup/art.js?raw';
import cats from '../../design/garden-mockup/cats.js?raw';
import { GardenArt, type GardenKind, type GardenProps } from './Garden';
import { MOTH_CLOSED_EYES, MOTH_CLUBS, MOTH_SPADES } from './mothArt';
import { ROYAL_BOWTIE, ROYAL_CROWNS, ROYAL_MUSTACHE } from './royalArt';

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
const MOCKED: GardenKind[] = ['sloth', 'bee', 'mushroom', 'cat'];
const POSES: Omit<GardenProps, 'kind' | 'suit'>[] = [
  {}, { eyes: 'happy' }, { eyes: 'open' }, { eyes: 'sleepy' }, { eyes: 'open', wave: true },
  { eyes: 'happy', badge: true, badgeColor: '#B5364A' },
];

describe('garden characters match the master art', () => {
  for (const kind of MOCKED) {
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

/** Every path's d (and ellipse's center) in a drawing, to look for the owner's shapes. */
const shapesIn = (markup: string) => new Set([...markup.matchAll(/ d="([^"]*)"/g)].map((m) => m[1]));

describe("every character wears the owner's crowns, bow tie and mustache", () => {
  for (const kind of Object.keys(SUITS) as GardenKind[]) {
    for (const suit of SUITS[kind]) {
      it(`${kind}, ${suit}`, () => {
        for (const hat of ['queen', 'king'] as const) {
          const drawn = shapesIn(react({ kind, suit, eyes: 'open', hat }));
          for (const node of ROYAL_CROWNS[hat][suit].nodes) if (node.attrs.d) expect(drawn.has(node.attrs.d), `${hat} crown`).toBe(true);
          expect(drawn.has(ROYAL_MUSTACHE.nodes[0].attrs.d), 'mustache').toBe(hat === 'king');
        }
        const jack = react({ kind, suit, eyes: 'open', bowtie: '#2B3A55' });
        for (const node of ROYAL_BOWTIE.nodes) if (node.attrs.d) expect(shapesIn(jack).has(node.attrs.d), 'bow tie').toBe(true);
        expect(jack).not.toContain(ROYAL_BOWTIE.wing);
      });
    }
  }
});

describe("the moth is the owner's drawing", () => {
  for (const [suit, shapes] of [['clubs', MOTH_CLUBS], ['spades', MOTH_SPADES]] as const) {
    it(suit, () => {
      const open = shapesIn(react({ kind: 'moth', suit, eyes: 'open' }));
      for (const s of shapes) if (s.attrs.d) expect(open.has(s.attrs.d), s.role).toBe(true);
      for (const eyes of ['sleepy', 'happy'] as const) {
        const closed = react({ kind: 'moth', suit, eyes });
        for (const s of MOTH_CLOSED_EYES) expect(shapesIn(closed).has(s.attrs.d)).toBe(true);
        // The open eyes and their shine are ellipses; the closed face drops them
        expect(closed.match(/<ellipse/g)?.length).toBe(shapes.filter((s) => s.tag === 'ellipse' && s.role !== 'eye' && s.role !== 'shine').length);
      }
    });
  }
});
