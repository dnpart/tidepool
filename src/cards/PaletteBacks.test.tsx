// The newer card backs must match the approved master in design/garden-mockup/backs.js and cats.js, at full and play size.
// The mockup's characters come from the same components the app uses, so both sides draw identical octopuses, foxes
// and owls; everything is compared element by element (numbers rounded, ids ignored).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import art from '../../design/garden-mockup/art.js?raw';
import backs from '../../design/garden-mockup/backs.js?raw';
import cats from '../../design/garden-mockup/cats.js?raw';
import { Creature, type CreatureProps } from '../art/Creature';
import { FoxOwl, type FoxOwlProps } from '../art/FoxOwl';
import { PALETTE_BACKS, PaletteBack, type PaletteBackStyle } from './PaletteBacks';

/** A standalone character's drawing without its own <svg> wrapper, as the mockup's export made it. */
const inner = (html: string) => html.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const fox = (p: FoxOwlProps) => inner(renderToStaticMarkup(<FoxOwl {...p} />));
const creature = (p: CreatureProps) => inner(renderToStaticMarkup(<Creature {...p} />));
const EXISTING = {
  foxSleepy: fox({ kind: 'fox', suit: 'hearts', eyes: 'sleepy' }),
  owlSpades: fox({ kind: 'owl', suit: 'spades', eyes: 'open' }),
  octoHappyPeach: creature({ kind: 'octopus', color: '#F6B07A', eyes: 'happy' }),
  manta: creature({ kind: 'manta', color: '#7A9EB0', eyes: 'open' }),
};

type MockBack = { name: string; bg: string; border: string; draw: (play: boolean) => string };
const MOCK = new Function('EXISTING', `${art}\n${backs}\n${cats}\nreturn { ...NEW_BACKS, ...CAT_BACKS };`)(EXISTING) as Record<string, MockBack>;

// The mockup's keys for the app's back ids
const MOCK_KEY: Record<PaletteBackStyle, string> = {
  sandy: 'sandyShallows', kelp: 'kelpForest', den: 'cozyDen', pines: 'pineNight',
  lazyLagoon: 'lazyLagoon', beeGarden: 'beeGarden', hive: 'snugHive', honeycomb: 'honeycomb', canopy: 'canopy',
  lilyPond: 'lilyPond', fairyRing: 'fairyRing', frosted: 'frostedToadstools', lamplight: 'lamplight', glade: 'moonlitGlade',
  fishbowl: 'fishbowl', yarn: 'yarn', snowDay: 'snowDay', sunbeam: 'sunbeam', nightProwl: 'nightProwl',
};

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
      // The app's standalone characters add accessibility attributes the mockup's inner drawings don't carry
      .filter((a) => !a.startsWith('aria-') && !a.startsWith('role='))
      .sort();
    // React wraps drawings in groups and an outer svg; the mockup doesn't
    if ((tag === 'g' || tag === 'svg') && attrs.length === 0) continue;
    out.push(`${tag} ${attrs.join(' ')}`);
  }
  return out;
}

describe('the newer card backs match the master', () => {
  for (const back of Object.keys(PALETTE_BACKS) as PaletteBackStyle[]) {
    it(`${PALETTE_BACKS[back].name}`, () => {
      const mock = MOCK[MOCK_KEY[back]];
      expect(PALETTE_BACKS[back]).toEqual({ name: mock.name, bg: mock.bg, border: mock.border });
      for (const play of [false, true]) {
        const app = renderToStaticMarkup(<svg><PaletteBack back={back} detailed={!play} uid="u" /></svg>);
        expect(normalize(app), play ? 'play size' : 'full size').toEqual(normalize(mock.draw(play)));
      }
    });
  }
});
