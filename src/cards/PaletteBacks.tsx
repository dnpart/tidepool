// The 14 card backs added with Honeycomb, Forest and the two garden decks (PLAN.md "Card backs for every palette").
// Every shape and number is ported from design/garden-mockup/backs.js; PaletteBacks.test.tsx checks the two match.
// Coordinates are on the 140×196 reference card; `detailed` is false at play size (under 80px wide).
import { CreatureAt } from '../art/Creature';
import { FoxOwlAt } from '../art/FoxOwl';
import { GardenAt, type GardenProps } from '../art/Garden';
import { ASPECT } from '../art/Creature';
import { shade } from '../art/color';
import { hexPath } from '../sky/stars';

export type PaletteBackStyle =
  | 'sandy' | 'kelp' | 'den' | 'pines'
  | 'lazyLagoon' | 'beeGarden' | 'hive' | 'honeycomb' | 'canopy'
  | 'lilyPond' | 'fairyRing' | 'frosted' | 'lamplight' | 'glade';

export const PALETTE_BACKS: Record<PaletteBackStyle, { name: string; bg: string; border: string }> = {
  sandy: { name: 'Sandy shallows', bg: '#7A5634', border: 'rgba(255,233,204,.5)' },
  kelp: { name: 'Kelp forest', bg: '#123A2E', border: 'rgba(220,240,214,.45)' },
  den: { name: 'Cozy den', bg: '#5A3E28', border: 'rgba(255,233,204,.5)' },
  pines: { name: 'Pine night', bg: '#12301F', border: 'rgba(220,240,214,.45)' },
  lazyLagoon: { name: 'Lazy lagoon', bg: '#123B45', border: 'rgba(255,241,194,.45)' },
  beeGarden: { name: 'Bee garden', bg: '#7E2A45', border: 'rgba(255,226,214,.5)' },
  hive: { name: 'Snug hive', bg: '#1F4775', border: 'rgba(220,235,250,.55)' },
  honeycomb: { name: 'Honeycomb', bg: '#6E4A2C', border: 'rgba(242,179,61,.55)' },
  canopy: { name: 'Canopy', bg: '#1C4232', border: 'rgba(220,240,214,.45)' },
  lilyPond: { name: 'Lily pond', bg: '#0F2E3A', border: 'rgba(220,240,230,.45)' },
  fairyRing: { name: 'Fairy ring', bg: '#7C2842', border: 'rgba(255,226,214,.5)' },
  frosted: { name: 'Frosted toadstools', bg: '#1F4775', border: 'rgba(220,235,250,.55)' },
  lamplight: { name: 'Lamplight', bg: '#4A3322', border: 'rgba(242,179,61,.5)' },
  glade: { name: 'Moonlit glade', bg: '#173B30', border: 'rgba(220,240,214,.45)' },
};

// ---------- placing characters ----------

/** Top-left for a character `size` wide centered on (cx, cy), the middle of its viewBox. */
const centered = (cx: number, cy: number, size: number) => ({ x: cx - size / 2, y: cy - (34 * size) / 64, size });
/** Top-left for a character `size` wide centered on cx with the bottom of its viewBox on `bottom`. */
const standing = (cx: number, bottom: number, size: number) => ({ x: cx - size / 2, y: bottom - size * ASPECT, size });

const Garden = ({ place, ...props }: GardenProps & { place: { x: number; y: number; size: number } }) => <GardenAt {...props} {...place} />;

// ---------- small shapes ----------

function Stars({ spots, color = '#FFF4D6', opacity = 0.8 }: { spots: [number, number, number][]; color?: string; opacity?: number }) {
  return <>{spots.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={color} opacity={opacity} />)}</>;
}

/** The Winter sky's six-armed crystal, `size` wide and centered on (cx, cy); the stroke is in its 24-unit box. */
function CrystalMark({ cx, cy, size, strokeWidth = 1.8 }: { cx: number; cy: number; size: number; strokeWidth?: number }) {
  return (
    <g
      transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 24})`}
      fill="none" stroke="#DCEBFA" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 1.5 V22.5 M2.9 6.75 L21.1 17.25 M2.9 17.25 L21.1 6.75" />
      <path d="M9.5 3.8 L12 6 L14.5 3.8 M9.5 20.2 L12 18 L14.5 20.2 M3.6 10 L6.8 10.5 L5.8 7.4 M18.2 16.6 L17.2 13.5 L20.4 14 M3.6 14 L6.8 13.5 L5.8 16.6 M18.2 7.4 L17.2 10.5 L20.4 10" />
    </g>
  );
}

/** A leaf (the Forest sky's), centered on (x, y), turned and scaled, with a midrib in its color × 0.78. */
function Leaf({ x, y, rotate, scale, color }: { x: number; y: number; rotate: number; scale: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M0 -7 C5 -4 5 4 0 8 C-5 4 -5 -4 0 -7 Z" fill={color} />
      <path d="M0 -6 L0 7" stroke={shade(color, 0.78)} strokeWidth={0.9} />
    </g>
  );
}

function Flower({ x, y, r, petal, middle = '#F7C948' }: { x: number; y: number; r: number; petal: string; middle?: string }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return <circle key={i} cx={(x + Math.cos(a) * r * 0.62).toFixed(2)} cy={(y + Math.sin(a) * r * 0.62).toFixed(2)} r={(r * 0.48).toFixed(2)} fill={petal} />;
      })}
      <circle cx={x} cy={y} r={r * 0.36} fill={middle} />
    </>
  );
}

/** A little toadstool standing on (x, base), `scale` times its 16-unit size. */
function TinyShroom({ x, base, scale, cap, stem = '#F9D59F' }: { x: number; base: number; scale: number; cap: string; stem?: string }) {
  return (
    <g transform={`translate(${x} ${base}) scale(${scale})`}>
      <path d="M-3.4 -9 C-3.8 -5 -4 -2 -4 0 L4 0 C4 -2 3.8 -5 3.4 -9 Z" fill={stem} />
      <path d="M-8 -8 C-8 -14 -4.5 -17 0 -17 C4.5 -17 8 -14 8 -8 C8 -7 7 -6.6 6 -7.2 C3 -8.4 -3 -8.4 -6 -7.2 C-7 -6.6 -8 -7 -8 -8 Z" fill={cap} />
      <circle cx={-3.6} cy={-12} r={1.3} fill="#FFF6E3" />
      <circle cx={2} cy={-14} r={1.1} fill="#FFF6E3" />
      <circle cx={4.4} cy={-10.2} r={1} fill="#FFF6E3" />
    </g>
  );
}

type BackProps = { detailed: boolean; uid: string };

// ---------- Octo + Manta ----------

function SandyShallows({ detailed }: BackProps) {
  const star = (x: number, y: number, r: number, rot: number) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = ((i * 36 + rot - 90) * Math.PI) / 180;
      const rr = i % 2 ? r * 0.45 : r;
      d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(2)} ${(y + Math.sin(a) * rr).toFixed(2)} `;
    }
    return <path d={`${d}Z`} fill="#F2B33D" stroke="#F2B33D" strokeWidth={r * 0.25} strokeLinejoin="round" />;
  };
  const shell = (x: number, y: number, r: number, rot: number) => (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 ${r * 0.5} L${-r} ${-r * 0.3} C${-r * 0.8} ${-r} ${r * 0.8} ${-r} ${r} ${-r * 0.3} Z`} fill="#FFE2D6" />
      <path d={`M0 ${r * 0.5} L${-r * 0.5} ${-r * 0.75} M0 ${r * 0.5} L0 ${-r * 0.85} M0 ${r * 0.5} L${r * 0.5} ${-r * 0.75}`} stroke="#E7B7A3" strokeWidth={r * 0.14} />
    </g>
  );
  const ripples: number[] = [];
  for (let y = 30; y < 196; y += 22) ripples.push(y);
  // The approved board drew the octopus 8 viewBox units below center, so it sits there
  const size = detailed ? 76 : 84;
  return (
    <>
      {detailed && ripples.map((y) => (
        <path key={y} d={`M-4 ${y} C20 ${y - 6} 40 ${y + 6} 70 ${y} C100 ${y - 6} 120 ${y + 6} 144 ${y}`} fill="none" stroke="#E8C98F" strokeWidth={1.4} opacity={0.3} />
      ))}
      {detailed ? (
        <>
          {star(26, 34, 8, 10)}{star(116, 164, 9, -8)}
          {shell(112, 36, 7, 15)}{shell(26, 160, 6, -20)}{shell(70, 176, 5, 0)}
          <circle cx={104} cy={70} r={2} fill="none" stroke="#FFE9CC" strokeWidth={1} opacity={0.8} />
          <circle cx={110} cy={62} r={1.3} fill="none" stroke="#FFE9CC" strokeWidth={1} opacity={0.8} />
        </>
      ) : (
        <>{star(28, 160, 12, 10)}{shell(112, 40, 10, 15)}</>
      )}
      <CreatureAt kind="octopus" color="#F6B07A" eyes="happy" {...centered(70, detailed ? 107.5 : 108.5, size)} />
    </>
  );
}

function KelpForest({ detailed }: BackProps) {
  const kelp: [number, number, number, string][] = detailed
    ? [[14, 196, 150, '#3F7A55'], [30, 196, 96, '#5E9C6B'], [110, 196, 110, '#3F7A55'], [128, 196, 160, '#5E9C6B']]
    : [[22, 196, 120, '#3F7A55'], [118, 196, 100, '#5E9C6B']];
  return (
    <>
      {kelp.map(([x, b, h, c]) => {
        const leaves: number[] = [];
        for (let t = 0.25; t < 1; t += detailed ? 0.2 : 0.35) leaves.push(t);
        return (
          <g key={x}>
            <path d={`M${x} ${b} C${x - 8} ${b - h * 0.3} ${x + 8} ${b - h * 0.6} ${x} ${b - h}`} stroke={c} strokeWidth={detailed ? 3 : 5} fill="none" strokeLinecap="round" />
            {leaves.map((t) => {
              const odd = Math.round(t * 10) % 2;
              return <Leaf key={t} x={x + (odd ? 5 : -5)} y={b - h * t} rotate={odd ? 50 : -50} scale={detailed ? 1.1 : 1.6} color={c} />;
            })}
          </g>
        );
      })}
      {detailed && (
        <g fill="none" stroke="#DCF0D6" strokeWidth={1.1} opacity={0.7}>
          <circle cx={58} cy={40} r={3} /><circle cx={66} cy={28} r={2} /><circle cx={84} cy={150} r={2.4} /><circle cx={90} cy={162} r={1.6} />
        </g>
      )}
      {/* Approved 8 viewBox units lower than centered, like Sandy shallows */}
      <CreatureAt kind="manta" color="#7A9EB0" eyes="open" {...centered(70, detailed ? 102.25 : 105.5, detailed ? 82 : 92)} />
    </>
  );
}

// ---------- Fox + Owl ----------

function CozyDen({ detailed }: BackProps) {
  const [rx, ry, cy] = detailed ? [46, 48, 108] : [52, 54, 112];
  return (
    <>
      {detailed && (
        <>
          <Leaf x={24} y={30} rotate={30} scale={1.3} color="#C7835A" />
          <Leaf x={114} y={26} rotate={-40} scale={1.2} color="#D8B56E" />
          <Leaf x={120} y={62} rotate={20} scale={1.1} color="#C9A464" />
          <Leaf x={20} y={70} rotate={-25} scale={1.1} color="#D8B56E" />
          <Leaf x={30} y={176} rotate={60} scale={1.2} color="#C9A464" />
          <Leaf x={112} y={174} rotate={-50} scale={1.3} color="#C7835A" />
        </>
      )}
      <ellipse cx={70} cy={cy} rx={rx + 6} ry={ry + 6} fill="#8A6440" />
      <ellipse cx={70} cy={cy} rx={rx} ry={ry} fill="#3A281A" />
      <ellipse cx={70} cy={cy + ry * 0.62} rx={rx * 0.8} ry={ry * 0.2} fill="#4A3322" />
      <FoxOwlAt kind="fox" suit="hearts" eyes="sleepy" {...standing(70, cy + ry * 0.66, detailed ? 70 : 82)} />
    </>
  );
}

function PineNight({ detailed }: BackProps) {
  const pine = (x: number, base: number, h: number, c: string) => (
    <path
      key={x}
      d={`M${x} ${base - h} L${x - h * 0.32} ${base - h * 0.55} L${x - h * 0.16} ${base - h * 0.55} L${x - h * 0.42} ${base - h * 0.2} L${x - h * 0.2} ${base - h * 0.2} L${x - h * 0.5} ${base} L${x + h * 0.5} ${base} L${x + h * 0.2} ${base - h * 0.2} L${x + h * 0.42} ${base - h * 0.2} L${x + h * 0.16} ${base - h * 0.55} L${x + h * 0.32} ${base - h * 0.55} Z`}
      fill={c}
    />
  );
  const by = detailed ? 124 : 128;
  return (
    <>
      {detailed && <Stars spots={[[20, 20, 1.2], [52, 30, 1], [120, 54, 1.1], [16, 64, 1], [64, 14, 1]]} />}
      <circle cx={detailed ? 106 : 104} cy={30} r={detailed ? 11 : 13} fill="#F4EFD6" />
      {detailed
        ? [pine(18, 200, 74, '#1E4A32'), pine(42, 200, 52, '#2A5C40'), pine(104, 200, 58, '#2A5C40'), pine(126, 200, 80, '#1E4A32')]
        : [pine(22, 200, 70, '#2A5C40'), pine(120, 200, 60, '#1E4A32')]}
      <path d={`M150 ${by - 4} C110 ${by + 2} 60 ${by} 24 ${by + 8}`} stroke="#6B4A2E" strokeWidth={detailed ? 6 : 8} strokeLinecap="round" fill="none" />
      <FoxOwlAt kind="owl" suit="spades" eyes="open" {...standing(70, by + 2, detailed ? 66 : 76)} />
    </>
  );
}

// ---------- Bee + Sloth ----------

function LazyLagoon({ detailed }: BackProps) {
  const by = detailed ? 116 : 118;
  return (
    <>
      {detailed && <Stars spots={[[22, 22, 1.2], [112, 18, 1.3], [64, 28, 1], [124, 52, 1.1], [16, 60, 1]]} />}
      <rect x={0} y={detailed ? 152 : 150} width={140} height={60} fill="#0E2F38" />
      <path d={`M24 166 h22 M88 ${detailed ? 174 : 172} h30 M40 184 h40`} stroke="#5FC4BA" strokeWidth={detailed ? 1.6 : 3} strokeLinecap="round" opacity={0.55} />
      <path d={`M-6 ${by + 6} C30 ${by - 2} 100 ${by + 4} 146 ${by - 6}`} stroke="#8A5A3A" strokeWidth={detailed ? 7 : 9} strokeLinecap="round" fill="none" />
      {detailed && (
        <>
          <Leaf x={20} y={by + 12} rotate={20} scale={1.3} color="#5FC4A0" />
          <Leaf x={116} y={by + 6} rotate={-24} scale={1.4} color="#4FA98A" />
          <Leaf x={126} y={by + 2} rotate={30} scale={1.1} color="#5FC4A0" />
        </>
      )}
      <Garden kind="sloth" suit="diamonds" eyes="sleepy" place={standing(70, by + 4, detailed ? 70 : 84)} />
    </>
  );
}

function BeeGarden({ detailed }: BackProps) {
  const flowers: [number, number, number, string][] = detailed
    ? [[26, 34, 9, '#FFC2B0'], [112, 28, 7, '#F4A6BE'], [118, 76, 8, '#FFC2B0'], [20, 120, 8, '#F4A6BE'], [30, 166, 9, '#FFC2B0'], [110, 162, 10, '#F4A6BE'], [70, 176, 6, '#FFC2B0']]
    : [[26, 40, 16, '#FFC2B0'], [114, 160, 16, '#F4A6BE']];
  return (
    <>
      {flowers.map(([x, y, r, c]) => <Flower key={`${x}-${y}`} x={x} y={y} r={r} petal={c} />)}
      {detailed && (
        <path d="M34 46 C52 66 34 80 54 90 M106 40 C92 54 110 66 92 78" fill="none" stroke="#FFE2D6" strokeWidth={1.4} strokeDasharray="2 3.4" strokeLinecap="round" opacity={0.75} />
      )}
      <Garden kind="bee" suit="spades" eyes="happy" place={centered(70, detailed ? 104 : 98, detailed ? 62 : 74)} />
    </>
  );
}

function SnugHive({ detailed, uid }: BackProps) {
  const [cx, base, w, h] = [70, 166, detailed ? 78 : 92, detailed ? 76 : 88];
  const bands = 5;
  const dr = detailed ? 18 : 21;
  const door = `${uid}-door`;
  return (
    <>
      {detailed
        ? [[26, 28], [70, 22], [114, 30], [20, 72], [120, 76]].map(([x, y]) => <CrystalMark key={`${x}-${y}`} cx={x} cy={y} size={15} />)
        : <CrystalMark cx={70} cy={32} size={22} strokeWidth={2.4} />}
      {detailed && <Stars spots={[[46, 46, 1.4], [96, 48, 1.4], [40, 100, 1.2], [104, 104, 1.2]]} color="#DCEBFA" opacity={0.7} />}
      <path d="M0 166 C40 156 100 158 140 164 L140 196 L0 196 Z" fill="#DCEBFA" />
      {/* A straw hive of stacked rounded bands */}
      {Array.from({ length: bands }, (_, i) => {
        const t0 = i / bands;
        const t1 = (i + 1) / bands;
        const y0 = base - h * t1;
        const y1 = base - h * t0;
        const hw = (w / 2) * Math.sqrt(1 - Math.pow(t0 * 0.92, 2));
        const hw1 = (w / 2) * Math.sqrt(1 - Math.pow(t1 * 0.92, 2));
        return (
          <path
            key={i}
            d={`M${cx - hw} ${y1} C${cx - hw} ${y0 + 2} ${cx - hw1} ${y0} ${cx} ${y0} C${cx + hw1} ${y0} ${cx + hw} ${y0 + 2} ${cx + hw} ${y1} Z`}
            fill={i % 2 ? '#D9A55A' : '#E6B66A'}
            stroke="#B9843E"
            strokeWidth={1.2}
          />
        );
      })}
      <path
        d={`M${cx - w * 0.3} ${base - h * 0.86} C${cx - w * 0.2} ${base - h - 6} ${cx + w * 0.2} ${base - h - 6} ${cx + w * 0.3} ${base - h * 0.86} C${cx + w * 0.18} ${base - h * 0.8} ${cx + w * 0.1} ${base - h * 0.9} ${cx} ${base - h * 0.84} C${cx - w * 0.12} ${base - h * 0.9} ${cx - w * 0.2} ${base - h * 0.8} ${cx - w * 0.3} ${base - h * 0.86} Z`}
        fill="#F5F8FC"
      />
      <circle cx={cx} cy={base - dr + 2} r={dr} fill="#5A3A1E" />
      <clipPath id={door}><circle cx={cx} cy={base - dr + 2} r={dr} /></clipPath>
      <g clipPath={`url(#${door})`}>
        <Garden kind="bee" suit="clubs" eyes="sleepy" place={standing(cx, base + dr * 1.25, dr * 2.3)} />
      </g>
    </>
  );
}

function Honeycomb({ detailed }: BackProps) {
  const r = detailed ? 10.5 : 15;
  const dx = r * Math.sqrt(3);
  const dy = r * 1.5;
  const cells: React.ReactNode[] = [];
  for (let row = -1; row * dy < 210; row++) {
    for (let col = -1; col * dx < 160; col++) {
      const cx = col * dx + (row % 2 ? dx / 2 : 0);
      const cy = row * dy;
      if (Math.hypot(cx - 70, cy - 98) < (detailed ? 40 : 36)) continue;
      const filled = detailed && (row * 7 + col * 3) % 11 === 0;
      cells.push(
        <path
          key={`${row}-${col}`}
          d={hexPath(cx, cy, r - 1.4)}
          fill={filled ? '#F2B33D' : 'none'}
          fillOpacity={filled ? 0.75 : 0}
          stroke="#F2B33D"
          strokeOpacity={0.38}
          strokeWidth={detailed ? 1.4 : 2.2}
        />,
      );
    }
  }
  const mr = detailed ? 34 : 40;
  return (
    <>
      {cells}
      <path d={hexPath(70, 98, mr + 4)} fill="none" stroke="#F2B33D" strokeWidth={detailed ? 1.4 : 2.4} opacity={0.8} />
      <path d={hexPath(70, 98, mr)} fill="#FFF3D9" />
      <Garden kind="bee" suit="spades" eyes="sleepy" place={centered(70, 98, detailed ? 52 : 62)} />
    </>
  );
}

function Canopy({ detailed }: BackProps) {
  const vines: [number, number, number][] = detailed ? [[16, 0, 120], [34, 0, 64], [112, 0, 96], [128, 0, 140]] : [[30, 0, 90], [110, 0, 70]];
  // The sloth hangs from a vine that comes down to its raised claw (at 55, 14 in its viewBox)
  const size = detailed ? 74 : 86;
  const x0 = 70 - size / 2;
  const y0 = (detailed ? 100 : 104) - (34 * size) / 64;
  const k = size / 64;
  const clawX = x0 + 55 * k;
  const clawY = y0 + (14 + 8) * k;
  return (
    <>
      {vines.map(([x, y, len]) => {
        const leaves: number[] = [];
        for (let t = 0.2; t < 1; t += detailed ? 0.22 : 0.4) leaves.push(t);
        return (
          <g key={x}>
            <path d={`M${x} ${y} C${x + 6} ${len * 0.35} ${x - 6} ${len * 0.7} ${x} ${len}`} stroke="#3F7A55" strokeWidth={detailed ? 1.8 : 3.2} fill="none" />
            {leaves.map((t) => {
              const odd = (t * 10) % 2;
              return <Leaf key={t} x={x + (odd ? 4 : -4)} y={len * t} rotate={odd ? 40 : -40} scale={detailed ? 1 : 1.5} color={odd ? '#5E9C6B' : '#4C8A5C'} />;
            })}
          </g>
        );
      })}
      <path d={`M${clawX + 2} 0 C${clawX + 6} ${clawY * 0.4} ${clawX - 2} ${clawY * 0.7} ${clawX} ${clawY}`} stroke="#3F7A55" strokeWidth={detailed ? 2.4 : 3.4} fill="none" />
      <Garden kind="sloth" suit="hearts" eyes="sleepy" wave place={{ x: x0, y: y0, size }} />
      {detailed && (
        <>
          <Leaf x={clawX + 5} y={clawY * 0.5} rotate={30} scale={1.3} color="#5E9C6B" />
          <Leaf x={40} y={170} rotate={-20} scale={1.4} color="#C9A464" />
          <Leaf x={102} y={178} rotate={34} scale={1.2} color="#C7835A" />
        </>
      )}
    </>
  );
}

// ---------- Mushroom + Moth ----------

function LilyPond({ detailed }: BackProps) {
  const pads: [number, number, number][] = detailed ? [[22, 168, 13], [108, 160, 11], [120, 182, 14], [46, 186, 9]] : [[24, 176, 18], [118, 170, 15]];
  return (
    <>
      {detailed && <Stars spots={[[20, 20, 1.2], [56, 30, 1], [118, 22, 1.3], [96, 44, 1], [24, 66, 1]]} />}
      <rect x={0} y={detailed ? 132 : 138} width={140} height={70} fill="#123F4A" />
      <ellipse cx={70} cy={detailed ? 150 : 156} rx={detailed ? 24 : 30} ry={detailed ? 4 : 5} fill="none" stroke="#5FC4BA" strokeWidth={detailed ? 1.4 : 2.6} opacity={0.6} />
      {detailed && <ellipse cx={70} cy={150} rx={40} ry={7} fill="none" stroke="#5FC4BA" strokeWidth={1} opacity={0.35} />}
      {pads.map(([x, y, r]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y} L${x + r} ${y - r * 0.12} A${r} ${r * 0.42} 0 1 1 ${x + r * 0.9} ${y + r * 0.2} Z`} fill="#3E8F78" />
      ))}
      {detailed && (
        <>
          <Flower x={108} y={156} r={6} petal="#F4A6BE" />
          <Flower x={28} y={164} r={5} petal="#FFC2B0" />
        </>
      )}
      <Garden kind="moth" suit="spades" eyes="sleepy" place={centered(70, detailed ? 90 : 86, detailed ? 78 : 90)} />
    </>
  );
}

function FairyRing({ detailed }: BackProps) {
  const [n, rx, ry] = detailed ? [10, 48, 66] : [6, 50, 70];
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return <TinyShroom key={i} x={70 + Math.cos(a) * rx} base={104 + Math.sin(a) * ry} scale={detailed ? 1 : 1.4} cap={i % 2 ? '#F29A8A' : '#FFC2B0'} />;
      })}
      {detailed && <Stars spots={[[34, 50, 1.4], [106, 50, 1.4], [30, 148, 1.2], [110, 148, 1.2], [70, 22, 1.2]]} color="#FFE2D6" />}
      <Garden kind="mushroom" suit="hearts" eyes="happy" grass={false} place={centered(70, 96, detailed ? 58 : 66)} />
    </>
  );
}

/** Snow on a toadstool's cap, for a toadstool `size` wide whose viewBox top-left is at (x, top). */
function SnowCap({ x, top, size }: { x: number; top: number; size: number }) {
  const k = size / 64;
  return <path transform={`translate(${x} ${top + 8 * k}) scale(${k})`} d="M14 12 C20 4 44 4 50 12 C46 14 42 11 38 14 C34 11 30 14 26 12 C22 15 18 12 14 12 Z" fill="#F5F8FC" />;
}

function FrostedToadstools({ detailed }: BackProps) {
  const size = detailed ? 70 : 82;
  const cx = detailed ? 60 : 70;
  const small = standing(104, 166, 34);
  const big = standing(cx, 168, size);
  return (
    <>
      {detailed
        ? [[24, 28], [70, 20], [116, 30], [30, 76], [112, 84]].map(([x, y]) => <CrystalMark key={`${x}-${y}`} cx={x} cy={y} size={15} />)
        : (
          <>
            <CrystalMark cx={30} cy={34} size={22} strokeWidth={2.4} />
            <CrystalMark cx={110} cy={40} size={18} strokeWidth={2.4} />
          </>
        )}
      <path d="M0 162 C40 150 100 152 140 160 L140 196 L0 196 Z" fill="#DCEBFA" />
      {detailed && (
        <>
          <Garden kind="mushroom" suit="diamonds" eyes="sleepy" grass={false} place={small} />
          <SnowCap x={small.x} top={small.y} size={34} />
        </>
      )}
      <Garden kind="mushroom" suit="hearts" eyes="sleepy" grass={false} place={big} />
      <SnowCap x={big.x} top={big.y} size={size} />
    </>
  );
}

function Lamplight({ detailed, uid }: BackProps) {
  const glow = `${uid}-glow`;
  const ly = detailed ? 56 : 60;
  const line = detailed ? 1.6 : 2.6;
  return (
    <>
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#F6C35A" stopOpacity={0.55} />
          <stop offset=".6" stopColor="#F6C35A" stopOpacity={0.12} />
          <stop offset="1" stopColor="#F6C35A" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={70} cy={ly} r={detailed ? 52 : 60} fill={`url(#${glow})`} />
      {/* A hanging lantern */}
      <path d={`M70 0 V${ly - 18}`} stroke="#2E2015" strokeWidth={detailed ? 1.4 : 2.6} />
      <path d={`M62 ${ly - 18} h16 l-2 -3 h-12 Z`} fill="#2E2015" />
      <rect x={61} y={ly - 18} width={18} height={26} rx={4} fill="#FFE2A0" stroke="#2E2015" strokeWidth={line} />
      <path d={`M70 ${ly - 13} C66 ${ly - 6} 74 ${ly - 6} 70 ${ly - 13} Z`} fill="#F2B33D" />
      <path d={`M62 ${ly + 8} h16 l-2 3 h-12 Z`} fill="#2E2015" />
      {detailed && <Stars spots={[[40, 40, 1], [104, 34, 1.2], [96, 76, 1], [30, 84, 1.1], [120, 100, 1]]} color="#F6C35A" />}
      <Garden kind="moth" suit="clubs" eyes="open" place={centered(70, detailed ? 128 : 130, detailed ? 72 : 82)} />
      {detailed && (
        <>
          <path d="M0 180 C40 172 100 174 140 178 L140 196 L0 196 Z" fill="#3A281A" />
          <TinyShroom x={24} base={184} scale={1} cap="#DE8650" />
          <TinyShroom x={116} base={182} scale={0.9} cap="#D9505E" />
        </>
      )}
    </>
  );
}

function MoonlitGlade({ detailed }: BackProps) {
  return (
    <>
      {detailed ? (
        <>
          <Stars spots={[[22, 24, 1.2], [46, 16, 1], [30, 50, 0.9], [118, 66, 1.1], [16, 84, 1], [124, 108, 0.9], [60, 34, 0.8]]} />
          <circle cx={104} cy={34} r={11} fill="#F4EFD6" />
          <circle cx={109} cy={30} r={9.5} fill="#173B30" />
        </>
      ) : (
        <>
          <circle cx={108} cy={30} r={12} fill="#F4EFD6" />
          <circle cx={113} cy={26} r={10.5} fill="#173B30" />
        </>
      )}
      <path d="M0 170 C30 158 60 166 82 160 C104 154 124 160 140 156 L140 196 L0 196 Z" fill="#244C3A" />
      {detailed && (
        <>
          <Garden kind="mushroom" suit="hearts" eyes="sleepy" grass={false} place={standing(31, 176, 34)} />
          <Garden kind="mushroom" suit="diamonds" eyes="sleepy" grass={false} place={standing(110, 174, 28)} />
          <path fill="#3F7A55" d="M44 196 Q44 176 50 168 Q54 182 54 196 Z M58 196 Q60 180 66 174 Q66 186 64 196 Z M124 196 Q122 180 130 172 Q134 186 132 196 Z" />
        </>
      )}
      <Garden kind="moth" suit="clubs" eyes="sleepy" place={centered(70, detailed ? 92 : 100, detailed ? 78 : 96)} />
    </>
  );
}

const DRAW: Record<PaletteBackStyle, (p: BackProps) => React.ReactElement> = {
  sandy: SandyShallows, kelp: KelpForest, den: CozyDen, pines: PineNight,
  lazyLagoon: LazyLagoon, beeGarden: BeeGarden, hive: SnugHive, honeycomb: Honeycomb, canopy: Canopy,
  lilyPond: LilyPond, fairyRing: FairyRing, frosted: FrostedToadstools, lamplight: Lamplight, glade: MoonlitGlade,
};

/** One of the 14 backs' drawings, inside a 140×196 card. `uid` keeps its gradient and clip ids unique per card. */
export function PaletteBack({ back, detailed, uid }: { back: PaletteBackStyle } & BackProps) {
  const Draw = DRAW[back];
  return <Draw detailed={detailed} uid={uid} />;
}
