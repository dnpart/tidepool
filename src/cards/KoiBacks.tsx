// Koi Garden's card backs (Nov 4): one scene for every deck, a koi pond at dusk with the deck's own friend sitting on a
// rock at its edge (the calico in the Cats deck, which the palette was made for). New art, like the rest, for the owner
// to redraw. Coordinates are on the 140×196 reference card; `detailed` is false at play size (under 80px wide).
import { ASPECT, CreatureAt } from '../art/Creature';
import { FoxOwlAt } from '../art/FoxOwl';
import { GardenAt } from '../art/Garden';

export type KoiBackStyle = 'koiSea' | 'koiArctic' | 'koiHoney' | 'koiWoodland' | 'koiCats';

const BG = '#1F4A47';
const BORDER = 'rgba(243,222,214,.55)';
export const KOI_BACKS: Record<KoiBackStyle, { name: string; bg: string; border: string }> = {
  koiSea: { name: 'Koi garden', bg: BG, border: BORDER },
  koiArctic: { name: 'Koi garden', bg: BG, border: BORDER },
  koiHoney: { name: 'Koi garden', bg: BG, border: BORDER },
  koiWoodland: { name: 'Koi garden', bg: BG, border: BORDER },
  koiCats: { name: 'Koi watch', bg: BG, border: BORDER },
};

/** A koi swimming toward angle `a` (degrees), `s` long, centered on (x, y). */
export function Koi({ x, y, a, s, body, patch, fin }: { x: number; y: number; a: number; s: number; body: string; patch?: string; fin: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s / 30})`}>
      <path d="M-15 0 L-21 -5 Q-19 0 -21 5 Z" fill={fin} opacity={0.9} />
      <path d="M-2 -4 L-6 -9 L0 -5Z M-2 4 L-6 9 L0 5Z" fill={fin} opacity={0.85} />
      <path d="M14 0 C14 -4.5 6 -6 -2 -5 C-9 -4 -15 -1.5 -16 0 C-15 1.5 -9 4 -2 5 C6 6 14 4.5 14 0Z" fill={body} />
      {patch && (
        <>
          <path d="M9 -3 C5 -5 1 -3 2 0 C3 3 7 3.5 10 2Z" fill={patch} />
          <ellipse cx={-6} cy={-1.5} rx={3.5} ry={2} fill={patch} />
        </>
      )}
      <circle cx={10.5} cy={-2.2} r={0.9} fill="#1E2A2A" />
    </g>
  );
}

/** A cherry petal centered on (x, y). */
function Petal({ x, y, r, s = 1 }: { x: number; y: number; r: number; s?: number }) {
  return <path transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} d="M0 -5 C4 -4 4 3 0 5 C-1 3 -1.5 1 0 0 C-1.5 -1 -1 -3 0 -5Z" fill="#F4B8C4" opacity={0.85} />;
}

/** Top-left for a character `size` wide centered on cx with the bottom of its viewBox on `bottom`. */
const standing = (cx: number, bottom: number, size: number) => ({ x: cx - size / 2, y: bottom - size * ASPECT, size });

function Friend({ back, place }: { back: KoiBackStyle; place: { x: number; y: number; size: number } }) {
  switch (back) {
    case 'koiSea': return <CreatureAt kind="octopus" color="#EE8C9E" eyes="happy" {...place} />;
    case 'koiArctic': return <FoxOwlAt kind="fox" suit="hearts" eyes="happy" {...place} />;
    case 'koiHoney': return <GardenAt kind="sloth" suit="hearts" eyes="happy" {...place} />;
    case 'koiWoodland': return <GardenAt kind="mushroom" suit="hearts" eyes="happy" {...place} />;
    case 'koiCats': return <GardenAt kind="cat" suit="diamonds" eyes="happy" {...place} />;
  }
}

export function KoiBack({ back, detailed }: { back: KoiBackStyle; detailed: boolean }) {
  const rockY = detailed ? 178 : 180;
  return (
    <>
      <circle cx={70} cy={detailed ? 110 : 104} r={detailed ? 58 : 66} fill="#2A6159" />
      {detailed ? (
        <>
          <Koi x={46} y={100} a={20} s={26} body="#FFF6EE" patch="#E0552F" fin="#F2C6B4" />
          <Koi x={110} y={122} a={160} s={20} body="#F08A3A" fin="#F6B887" />
          <path d="M104 78 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z M104 78 L101.5 70 L106.5 70 Z" fill="#7CC08A" fillRule="evenodd" />
          <Petal x={28} y={32} r={20} /><Petal x={112} y={24} r={-30} s={0.9} /><Petal x={84} y={50} r={70} s={0.8} />
          <Petal x={22} y={72} r={140} s={0.9} /><Petal x={120} y={98} r={10} s={0.8} />
        </>
      ) : (
        <Koi x={70} y={88} a={0} s={40} body="#FFF6EE" patch="#E0552F" fin="#F2C6B4" />
      )}
      <ellipse cx={70} cy={rockY + 2} rx={detailed ? 46 : 54} ry={detailed ? 14 : 16} fill="#9EA39C" />
      <ellipse cx={70} cy={rockY - 1} rx={detailed ? 42 : 50} ry={detailed ? 11 : 13} fill="#C3C6C0" />
      <Friend back={back} place={standing(70, rockY + 2, detailed ? 62 : 74)} />
    </>
  );
}
