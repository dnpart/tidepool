// Koi Garden's card backs (Nov 4): one scene for every deck, a koi pond at dusk with the deck's own friend sitting on a
// rock at its edge (the calico in the Cats deck, which the palette was made for). New art, like the rest, for the owner
// to redraw. Coordinates are on the 140×196 reference card; `detailed` is false at play size (under 80px wide).
import { ASPECT, CreatureAt } from '../art/Creature';
import { FoxOwlAt } from '../art/FoxOwl';
import { GardenAt } from '../art/Garden';
import { KoiFish, Petal } from '../art/KoiGarden';

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

/** A cherry petal centered on (x, y). */
function PetalAt({ x, y, r, s = 1 }: { x: number; y: number; r: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}><Petal color="#F4B8C4" opacity={0.85} /></g>;
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
          <KoiFish kind="kohaku" x={46} y={100} a={20} s={26} />
          <KoiFish kind="orange" x={110} y={122} a={160} s={20} />
          <path d="M104 78 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z M104 78 L101.5 70 L106.5 70 Z" fill="#7CC08A" fillRule="evenodd" />
          <PetalAt x={28} y={32} r={20} /><PetalAt x={112} y={24} r={-30} s={0.9} /><PetalAt x={84} y={50} r={70} s={0.8} />
          <PetalAt x={22} y={72} r={140} s={0.9} /><PetalAt x={120} y={98} r={10} s={0.8} />
        </>
      ) : (
        <KoiFish kind="kohaku" x={70} y={88} a={0} s={40} />
      )}
      <ellipse cx={70} cy={rockY + 2} rx={detailed ? 46 : 54} ry={detailed ? 14 : 16} fill="#9EA39C" />
      <ellipse cx={70} cy={rockY - 1} rx={detailed ? 42 : 50} ry={detailed ? 11 : 13} fill="#C3C6C0" />
      <Friend back={back} place={standing(70, rockY + 2, detailed ? 62 : 74)} />
    </>
  );
}
