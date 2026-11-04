// Builds design/pond-palettes/koi-ponds.html (Nov 4, round three): Pond Hop with no shore and no coves. The track's
// stones are the pond's rocky edge, the home lanes run out on piers, and there's a new koi pond, with a mockup of a
// Koi palette made to go with the Cats deck (real app screens with the palette's colors swapped in).
// Run with the preview server up (npm run build && npx vite preview --port 4173):
//   node --experimental-strip-types --no-warnings design/pond-palettes/koi-ponds.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { PIECES } from '../../src/art/piecesArt.ts';

const { chromium } = createRequire(import.meta.url)('playwright');
const C = 180, R = 128, TRACK = 40, PADS = [5, 15, 25, 35], STARTS = [30, 10, 0, 20];
const WATER_R = 126;
const CORNERS = { 30: [42, 318, -1, 0], 0: [42, 42, 0, -1], 10: [318, 42, 1, 0], 20: [318, 318, 0, 1] };
const SPOTS = [[-12, -12], [12, -12], [-12, 12], [12, 12]];
const LIGHT = ['#F7A1B4', '#8DB7EA', '#F8D47A', '#B9A6EA'];
const RING = ['#E0607E', '#3B78C4', '#E8A317', '#7A5BC4'];
const f = (n) => Math.round(n * 100) / 100;
const holeAt = (h, r = R) => { const a = ((h * 360) / TRACK - 90) * Math.PI / 180; return [C + Math.cos(a) * r, C + Math.sin(a) * r]; };
const laneAt = (start, k) => { const [, , ax, ay] = CORNERS[start]; const r = 108 - k * 16; return [C + ax * r, C + ay * r]; };
function marbleAt(seat, i, p) {
  const start = STARTS[seat];
  if (p === -1) { const [bx, by] = CORNERS[start]; return [bx + SPOTS[i][0], by + SPOTS[i][1]]; }
  return p >= 40 ? laneAt(start, p - 40) : holeAt((start + p) % TRACK);
}
const hex = (x, y, s, rot = 0) => Array.from({ length: 6 }, (_, i) => { const a = (60 * i + rot) * Math.PI / 180; return `${f(x + s * Math.cos(a))},${f(y + s * Math.sin(a))}`; }).join(' ');
let seed = 1;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const kebab = (k) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const nodes = (list) => list.map((n) => `<${n.tag} ${Object.entries(n.attrs).map(([k, v]) => `${kebab(k)}="${v}"`).join(' ')}/>`).join('');
const marble = (x, y, seat) => `<g transform="translate(${f(x)} ${f(y)})"><g transform="${PIECES[`marble${seat}`].transform}">${nodes(PIECES[`marble${seat}`].nodes)}</g></g>`;
const master = await readFile(new URL('../art-export/08-pieces-ponds-sky-app-icon.svg', import.meta.url), 'utf8');
const lagoon = master.slice(master.indexOf('id="Lagoon_and_Coral_Reef_Lagoon_and_Coral_Reef_pond"'), master.indexOf('id="Pond_Hop_ponds_Winter"'));
const padPaths = [...lagoon.matchAll(/<path class="st115" d="([^"]+)"/g)].map((m) => m[1]);
const ownerPads = (fill) => `<g transform="matrix(${f(1 / 1.5)} 0 0 ${f(1 / 1.5)} -40 -845.33)">${padPaths.map((d) => `<path d="${d}" fill="${fill}"/>`).join('')}</g>`;

// The proposed Koi palette (light and dark), next to the palettes' board colors from src/theme/tokens.ts
export const KOI = {
  light: { bg: '#EEF2EC', surface: '#FFFFFF', ink: '#1E3533', sub: '#4F6764', accent: '#B8432C', onAccent: '#FFFFFF', accentSoft: '#F3DED6', line: '#D3DED8' },
  dark: { bg: '#0F1A1C', surface: '#182729', ink: '#E9F0EC', sub: '#A9BDB8', accent: '#F08C6C', onAccent: '#0F1A1C', accentSoft: '#2E2A26', line: '#2A4140' },
};
const PANEL = {
  lagoon: { light: { surface: '#FFFFFF', line: '#CFE3DF', ink: '#173B47', bg: '#E4F3F0' } },
  winter: { light: { surface: '#FFFFFF', line: '#CFDEEA', ink: '#16324A', bg: '#E8F1F8' }, dark: { surface: '#142333', line: '#26405A', ink: '#E6F0F8', bg: '#0B1521' } },
  forest: { light: { surface: '#FFFFFF', line: '#CCDAC8', ink: '#1E3324', bg: '#E8EFE3' }, dark: { surface: '#17261C', line: '#2A4233', ink: '#E4EFE4', bg: '#0E1912' } },
  honeycomb: { light: { surface: '#FFFDF9', line: '#E3D6C2', ink: '#3A2A1C', bg: '#F4EEE4' }, dark: { surface: '#2A2119', line: '#463626', ink: '#F4EADB', bg: '#1C1611' } },
  koi: { light: KOI.light, dark: KOI.dark },
};
/** Water, the edge stones (or comb), and the piers, per pond. */
const LOOK = {
  water: { light: { inner: '#CDEEEE', outer: '#9FD3D6', mark: '#FFFFFF', hop: '#5E9C6B', stone: ['#DCD3C1', '#BDB29D', '#EEE8DB'], pier: '#C69C6D', plank: '#A57E52' } },
  ice: {
    light: { inner: '#F2F9FE', outer: '#CFE5F4', mark: '#86AED0', hop: '#6F9EC4', stone: ['#B4BEC8', '#94A0AC', '#FFFFFF'], pier: '#9C8571', plank: '#7E6A57' },
    dark: { inner: '#35597B', outer: '#22405D', mark: '#A4C8E6', hop: '#8CC3EC', stone: ['#7D8C9A', '#5E6B78', '#DCEBFA'], pier: '#7C6A5A', plank: '#5E4F42' },
  },
  leaves: {
    light: { inner: '#8FC6AE', outer: '#5E9F88', mark: '#FFFFFF', hop: '#E9F5EE', stone: ['#B3AE9F', '#938D7E', '#8DB86B'], pier: '#8A6A4A', plank: '#6E5238' },
    dark: { inner: '#2F5C4B', outer: '#1C3D31', mark: '#CFE8DA', hop: '#8FCB9B', stone: ['#7C786C', '#5E5A50', '#5E9B67'], pier: '#6E5238', plank: '#523C28' },
  },
  honey: {
    light: { inner: '#F8CB55', outer: '#DC931F', mark: '#FFFFFF', hop: '#FFF4D6', stone: ['#FFF0C2', '#D9A94A'], pier: '#FFF0C2', plank: '#D9A94A' },
    dark: { inner: '#E2A633', outer: '#A8661A', mark: '#FFF3D6', hop: '#FFF4D6', stone: ['#5A4630', '#9C7A44'], pier: '#5A4630', plank: '#9C7A44' },
  },
  koi: {
    light: { inner: '#7FC3B5', outer: '#3E8579', mark: '#FFFFFF', hop: '#E6F4EF', stone: ['#C3C6C0', '#9EA39C', '#E2E4DF'], pier: '#B8432C', plank: '#8E3320' },
    dark: { inner: '#2A5E57', outer: '#163A35', mark: '#CFE8E1', hop: '#9FD3C6', stone: ['#7F837D', '#5E625C', '#A9ADA6'], pier: '#A13C28', plank: '#72281A' },
  },
};
const PALETTE_OF = { water: 'lagoon', ice: 'winter', leaves: 'forest', honey: 'honeycomb', koi: 'koi' };

/** One rock of the pond's edge, a little different each time. */
function stone(pond, k, x, y) {
  const r = 10.6 + rand() * 1.6, rot = f(rand() * 180), sx = f(1 + (rand() - 0.5) * 0.18);
  if (pond === 'honey') return `<polygon points="${hex(x, y, 11.8, rot)}" fill="${k.stone[0]}" stroke="${k.stone[1]}" stroke-width="1.6"/>`;
  const top = pond === 'ice' ? `<path d="M-9 -2 Q-8 -9.5 0 -10 Q8 -9.5 9 -2 Q5 -4.8 0 -4.2 Q-5 -4.8 -9 -2Z" fill="${k.stone[2]}"/>`
    : pond === 'leaves' ? `<ellipse cx="-3" cy="-5.6" rx="5.5" ry="2.8" fill="${k.stone[2]}" opacity=".9"/>`
      : `<ellipse cx="-3.5" cy="-4.5" rx="4.5" ry="2.2" fill="${k.stone[2]}" opacity=".75"/>`;
  return `<g transform="translate(${f(x)} ${f(y)})"><g transform="rotate(${rot}) scale(${sx} 1)"><ellipse cy="1.4" rx="${f(r + 0.3)}" ry="${f(r * 0.9)}" fill="${k.stone[1]}"/><ellipse rx="${f(r)}" ry="${f(r * 0.86)}" fill="${k.stone[0]}"/></g>${top}</g>`;
}

/** A koi, nose toward angle `a`, `s` long. */
function koi(x, y, a, s, colors) {
  const [body, patch, fin] = colors;
  return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s / 30})">
    <path d="M-15 0 L-21 -5 Q-19 0 -21 5 Z" fill="${fin}" opacity=".9"/>
    <path d="M-2 -4 L-6 -9 L0 -5Z M-2 4 L-6 9 L0 5Z" fill="${fin}" opacity=".85"/>
    <path d="M14 0 C14 -4.5 6 -6 -2 -5 C-9 -4 -15 -1.5 -16 0 C-15 1.5 -9 4 -2 5 C6 6 14 4.5 14 0Z" fill="${body}"/>
    ${patch ? `<path d="M9 -3 C5 -5 1 -3 2 0 C3 3 7 3.5 10 2Z" fill="${patch}"/><ellipse cx="-6" cy="-1.5" rx="3.5" ry="2" fill="${patch}"/>` : ''}
    <circle cx="10.5" cy="-2.2" r=".9" fill="#1E2A2A"/></g>`;
}

function water(pond, mode, id, k) {
  const out = [`<defs><radialGradient id="g${id}" cx="${C}" cy="${C}" r="${WATER_R + 14}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${k.inner}"/><stop offset="1" stop-color="${k.outer}"/></radialGradient></defs>`,
    `<circle cx="${C}" cy="${C}" r="${WATER_R}" fill="url(#g${id})"/>`];
  if (pond === 'water' || pond === 'leaves' || pond === 'koi') {
    for (const [x, y, w] of [[C - 64, C - 34, 16], [C + 40, C - 66, 14], [C + 62, C + 28, 16], [C - 34, C + 64, 14]]) {
      out.push(`<path d="M${x} ${y} q${w / 2} -${w / 3} ${w} 0" stroke="${k.mark}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${mode === 'dark' ? 0.35 : 0.55}"/>`);
    }
  }
  if (pond === 'koi') {
    out.push(koi(C - 58, C - 70, 24, 30, ['#FFF6EE', '#E0552F', '#F2C6B4']));
    out.push(koi(C + 66, C + 58, 205, 28, ['#F08A3A', null, '#F6B887']));
    out.push(koi(C - 70, C + 62, 140, 24, ['#F4F1EA', '#2C2C2C', '#D9D4C9']));
  }
  if (pond === 'leaves') {
    for (const [x, y, r, c] of [[C - 50, C - 70, 30, '#E39B4B'], [C + 72, C - 44, -60, '#E8C15A'], [C - 74, C + 46, 110, '#C9653D'], [C + 48, C + 74, 200, '#8DB86B']]) {
      out.push(`<g transform="translate(${x} ${y}) rotate(${r}) scale(1.2)"><path d="M0 -6 C4.5 -3 4.5 3 0 6 C-4.5 3 -4.5 -3 0 -6 Z" fill="${c}"/><path d="M0 -5 L0 7.5" stroke="#00000033" stroke-width=".9" stroke-linecap="round"/></g>`);
    }
  }
  if (pond === 'ice') {
    for (const d of [`M${C - 100} ${C - 20} l22 6 l16 -10 l18 5`, `M${C + 44} ${C - 96} l-8 22 l12 15`, `M${C + 28} ${C + 100} l6 -24 l20 -10`, `M${C - 70} ${C + 70} l18 -6 l8 -16`]) {
      out.push(`<path d="${d}" transform="translate(.9 .9)" stroke="${mode === 'dark' ? '#16293C' : '#FFFFFF'}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${k.mark}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
  }
  if (pond === 'honey') {
    out.push(`<ellipse cx="${C - 46}" cy="${C - 62}" rx="26" ry="8" transform="rotate(-28 ${C - 46} ${C - 62})" fill="#FFFFFF" opacity="${mode === 'dark' ? 0.3 : 0.55}"/>`);
    for (const [x, y, r] of [[C + 62, C + 52, 3.2], [C + 72, C + 62, 2], [C - 72, C + 40, 2.6]]) out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${mode === 'dark' ? '#F6C35A' : '#FFE9A8'}" stroke-width="1.2"/>`);
  }
  return out.join('');
}

function pier(pond, mode, k, start) {
  const [, , ax, ay] = CORNERS[start];
  const angle = Math.atan2(ay, ax) * 180 / Math.PI;
  const from = 50, to = 118, w = 19;
  const g = [];
  if (pond === 'leaves') {
    g.push(`<rect x="${from}" y="${-w / 2}" width="${to - from}" height="${w}" rx="${w / 2}" fill="${k.plank}"/><rect x="${from}" y="${-w / 2 + 1}" width="${to - from}" height="${w - 4}" rx="${(w - 4) / 2}" fill="${k.pier}"/>`);
    for (let x = from + 14; x < to - 6; x += 16) g.push(`<path d="M${x} -5 l7 0 M${x + 5} 3 l6 0" stroke="${k.plank}" stroke-width="1.4" stroke-linecap="round"/>`);
    g.push(`<ellipse cx="${from + 3}" cy="0" rx="4" ry="${w / 2 - 0.5}" fill="${mode === 'dark' ? '#A88A62' : '#D9B98A'}"/><ellipse cx="${from + 3}" cy="0" rx="2" ry="${w / 4}" fill="none" stroke="${k.plank}" stroke-width="1"/>`);
  } else if (pond === 'honey') {
    g.push(`<rect x="${from - 2}" y="${-w / 2 + 1}" width="${to - from + 4}" height="${w - 2}" rx="5" fill="${k.plank}" opacity=".55"/>`);
    for (const r of [60, 76, 92, 108]) g.push(`<polygon points="${hex(r, 0, 9.6, 30)}" fill="${k.pier}" stroke="${k.plank}" stroke-width="1.4"/>`);
  } else if (pond === 'koi') {
    // a garden bridge: pale boards between red rails, so the home spots stay easy to see
    const deck = mode === 'dark' ? '#B59A7A' : '#EAD7B8', line = mode === 'dark' ? '#8C7558' : '#C9AE88';
    g.push(`<rect x="${from}" y="${-w / 2 - 1.5}" width="${to - from}" height="${w + 3}" rx="3" fill="${k.plank}"/>`);
    g.push(`<rect x="${from}" y="${-w / 2 + 2}" width="${to - from}" height="${w - 4}" fill="${deck}"/>`);
    for (let x = from + 6; x < to; x += 6) g.push(`<path d="M${x} ${-w / 2 + 2} L${x} ${w / 2 - 2}" stroke="${line}" stroke-width=".9"/>`);
    g.push(`<rect x="${from - 1}" y="${-w / 2 - 3}" width="4" height="${w + 6}" rx="1.5" fill="${k.pier}"/>`);
  } else {
    g.push(`<rect x="${from}" y="${-w / 2 + 1.5}" width="${to - from}" height="${w}" rx="2.5" fill="${k.plank}"/><rect x="${from}" y="${-w / 2}" width="${to - from}" height="${w}" rx="2.5" fill="${k.pier}"/>`);
    for (let x = from + 6; x < to; x += 6) g.push(`<path d="M${x} ${-w / 2} L${x} ${w / 2}" stroke="${k.plank}" stroke-width=".9" opacity=".7"/>`);
    g.push(`<circle cx="${from + 2.5}" cy="${-w / 2 - 1}" r="2.6" fill="${k.plank}"/><circle cx="${from + 2.5}" cy="${w / 2 + 1}" r="2.6" fill="${k.plank}"/>`);
    if (pond === 'ice') g.push(`<path d="M${from + 1} ${-w / 2 + 1} L${to} ${-w / 2 + 1}" stroke="${mode === 'dark' ? '#DCEBFA' : '#FFFFFF'}" stroke-width="3.2" stroke-linecap="round"/>`);
  }
  return `<g transform="translate(${C} ${C}) rotate(${f(angle)})">${g.join('')}</g>`;
}

function hopMark(pond, mode, k) {
  const [x1, y1] = holeAt(5), [x2, y2] = holeAt(25);
  const at = (t) => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  if (pond === 'ice') return [-2, 2].map((s) => `<path d="M${f(x1 + s)} ${f(y1 + s)} L${f(at(0.55)[0] + s)} ${f(at(0.55)[1] + s)}" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity=".95"/>`).join('');
  if (pond === 'honey') return `<path d="M${f(x1)} ${f(y1)} L${f(at(0.55)[0])} ${f(at(0.55)[1])}" stroke="${mode === 'dark' ? '#6E3D08' : '#A9620F'}" stroke-width="4.5" stroke-linecap="round" opacity=".7"/>`;
  return [[0.25, 8], [0.4, 6], [0.52, 3.5]].map(([t, r]) => { const [x, y] = at(t); return `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="none" stroke="${k.mark}" stroke-width="1.5" opacity=".85"/>`; }).join('');
}

const STATE = [[-1, -1, 3, 41], [-1, 4, 15, -1], [-1, -1, 22, 40]];

function board({ pond, mode, id, hop }) {
  seed = 5;
  const pal = PANEL[PALETTE_OF[pond]][mode];
  const k = LOOK[pond][mode];
  const hole = (x, y, r = 6.6) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${pal.ink}" fill-opacity=".18"/>`;
  const out = [`<rect x="1" y="1" width="358" height="358" rx="36" fill="${pal.surface}" stroke="${pal.line}" stroke-width="1.5"/>`, water(pond, mode, id, k)];
  for (const [p, q] of [[5, 25], [15, 35]]) {
    const [x1, y1] = holeAt(p), [x2, y2] = holeAt(q);
    out.push(`<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${k.hop}" stroke-width="2" stroke-dasharray="3 6" stroke-linecap="round" opacity=".6"/>`);
  }
  if (hop) out.push(hopMark(pond, mode, k));
  STARTS.forEach((start) => out.push(pier(pond, mode, k, start)));
  // the edge: one rock per track hole (comb cells in honey), and the owner's lily pads afloat where the hops are
  for (let i = 0; i < TRACK; i++) {
    if (PADS.includes(i)) continue;
    const [x, y] = holeAt(i);
    out.push(stone(pond, k, x, y), hole(x, y));
  }
  out.push(ownerPads(mode === 'dark' ? '#6FB07C' : '#7CC08A'));
  for (const i of PADS) { const [x, y] = holeAt(i); out.push(hole(x, y)); }
  STARTS.forEach((start, seat) => {
    const [x, y] = holeAt(start), [bx, by] = CORNERS[start];
    const used = seat < STATE.length;
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="9.5" fill="none" stroke="${used ? RING[seat] : pal.ink}" stroke-opacity="${used ? 1 : 0.25}" stroke-width="2.4"/>`);
    for (let j = 0; j < 4; j++) {
      const [lx, ly] = laneAt(start, j);
      out.push(`<circle cx="${f(lx)}" cy="${f(ly)}" r="6.6" fill="${used ? LIGHT[seat] : pal.ink}" opacity="${used ? 0.85 : 0.14}"/>`);
    }
    out.push(`<rect x="${bx - 28}" y="${by - 28}" width="56" height="56" rx="18" fill="${used ? LIGHT[seat] : pal.ink}" opacity="${used ? 0.35 : 0.07}"/>`);
    if (used) SPOTS.forEach(([dx, dy]) => out.push(`<circle cx="${bx + dx}" cy="${by + dy}" r="7" fill="${pal.ink}" fill-opacity=".13"/>`));
  });
  out.push(`<text x="42" y="284" text-anchor="middle" font-family="Fredoka, 'Arial Rounded MT Bold', sans-serif" font-weight="600" font-size="13" fill="${pal.ink}">You</text>`);
  STATE.forEach((own, seat) => own.forEach((p, i) => {
    if (hop && seat === 1 && i === 2) return;
    const [x, y] = marbleAt(seat, i, p); out.push(marble(x, y, seat));
  }));
  if (hop) { const [x1, y1] = holeAt(5), [x2, y2] = holeAt(25); out.push(marble(x1 + (x2 - x1) * 0.6, y1 + (y2 - y1) * 0.6, 1)); }
  return `<svg viewBox="0 0 360 360" role="img" aria-label="${PALETTE_OF[pond]} pond, ${mode}${hop ? ', mid-hop' : ''}">${out.join('')}</svg>`;
}

const NAME = { water: 'Lagoon and Coral Reef', ice: 'Winter', leaves: 'Forest', honey: 'Honeycomb', koi: 'Koi (new)' };
const fig = (pond, mode, hop = false) => {
  const pal = PANEL[PALETTE_OF[pond]][mode];
  return `<figure style="background:${pal.bg}"><div class="board">${board({ pond, mode, id: `${pond}${mode}${hop}`, hop })}</div><figcaption style="color:${mode === 'dark' ? '#C9D6E0' : '#3F5560'}">${NAME[pond]}, ${mode}${hop ? ', mid-hop' : ''}</figcaption></figure>`;
};

// --- the Koi palette in the real app: Home and Solitaire with the Cats deck and the palette's colors swapped in ---
const PETALS = (n, w, h) => {
  seed = 9;
  return Array.from({ length: n }, () => {
    const x = f(rand() * w), y = f(rand() * h * 0.9), r = f(rand() * 360), s = f(0.7 + rand() * 0.6);
    return `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0 -5 C4 -4 4 3 0 5 C-1 3 -1.5 1 0 0 C-1.5 -1 -1 -3 0 -5Z" fill="#F4B8C4" opacity=".85"/>`;
  }).join('');
};
const LANTERNS = (w, h) => [[0.82, 0.08], [0.12, 0.42], [0.9, 0.7]].map(([x, y]) => `<g transform="translate(${f(x * w)} ${f(y * h)})"><circle r="16" fill="#F7B27A" opacity=".18"/><rect x="-6" y="-8" width="12" height="16" rx="5" fill="#F08C6C" opacity=".9"/><rect x="-6" y="-2" width="12" height="2" fill="#B8432C" opacity=".7"/></g>`).join('');

async function screens() {
  const browser = await chromium.launch();
  const shots = [];
  for (const [label, route, mode, settle] of [['Home, light', '', 'light'], ['Home, dark', '', 'dark'], ['Solitaire, light', 'play/solitaire', 'light'], ['Pond Hop today, dark', 'play/pondhop', 'dark']]) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 });
    await ctx.addInitScript((m) => { if (!sessionStorage.s) { sessionStorage.s = 1; localStorage.setItem('tidepool.settings', JSON.stringify({ v: 2, deck: 'cats', palette: 'lagoon', mode: m, reduceMotion: true, name: 'Night' })); } }, mode);
    const page = await ctx.newPage();
    await page.goto(`http://localhost:4173/tidepool/#/${route}`);
    await page.waitForTimeout(800);
    await page.evaluate((t) => {
      const root = document.documentElement;
      const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      for (const [k, v] of Object.entries(t)) root.style.setProperty(`--${kebab(k)}`, v);
      root.style.setProperty('--dash', `${t.accent}78`);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg);
      const sky = document.querySelector('[data-reduced][aria-hidden="true"]');
      if (sky) sky.style.display = 'none';
    }, KOI[mode]);
    await page.waitForTimeout(300);
    const png = await page.screenshot({ type: 'jpeg', quality: 82 });
    shots.push({ label, mode, src: `data:image/jpeg;base64,${png.toString('base64')}` });
    await ctx.close();
  }
  // A calico for the card back sketch, drawn by the app
  const page = await browser.newPage();
  await page.goto('http://localhost:4173/tidepool/#/art');
  await page.waitForSelector('[data-art]');
  const cat = await page.evaluate(() => {
    const fig = [...document.querySelectorAll('[data-art]')].find((f) => f.dataset.name === 'Happy calico');
    const svg = fig.querySelector('svg');
    return { vb: svg.getAttribute('viewBox'), inner: svg.innerHTML };
  });
  await browser.close();
  return { shots, cat };
}

const { shots, cat } = await screens();
const phone = (s) => `<figure class="phone" style="background:${KOI[s.mode].bg}"><div class="screen"><img src="${s.src}" alt="${s.label} in the Koi palette">`
  + `<svg class="sky" viewBox="0 0 360 740" aria-hidden="true">${s.mode === 'dark' ? LANTERNS(360, 740) : PETALS(9, 360, 740)}</svg></div><figcaption>${s.label}</figcaption></figure>`;

// A sketch of the Cats deck's back for the Koi palette: a calico on a rock, two koi below
const back = `<svg viewBox="0 0 140 196" class="back" role="img" aria-label="Card back sketch: a calico on a rock watching koi">
  <rect width="140" height="196" rx="12" fill="#1F4A47"/>
  <circle cx="70" cy="122" r="58" fill="#2A6159"/>
  ${koi(48, 112, 20, 26, ['#FFF6EE', '#E0552F', '#F2C6B4'])}${koi(92, 140, 200, 24, ['#F08A3A', null, '#F6B887'])}
  <path d="M100 94 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z M100 94 L97 85 L103 85 Z" fill="#7CC08A" fill-rule="evenodd"/>
  <ellipse cx="70" cy="180" rx="44" ry="14" fill="#9EA39C"/><ellipse cx="70" cy="177" rx="40" ry="11" fill="#C3C6C0"/>
  <svg x="40" y="${180 - 66}" width="60" height="${60 * 68 / 64}" viewBox="${cat.vb}" overflow="visible">${cat.inner}</svg>
  ${PETALS(5, 140, 70)}
  <rect x="6" y="6" width="128" height="184" rx="8" fill="none" stroke="#F3DED6" stroke-opacity=".6" stroke-width="1.5"/>
</svg>`;

const PONDS = ['water', 'ice', 'leaves', 'honey', 'koi'];
const swatches = (mode) => Object.entries(KOI[mode]).map(([name, c]) => `<div class="swatch"><span style="background:${c}"></span><b>${name}</b><code>${c}</code></div>`).join('');
const template = await readFile(new URL('./koi-ponds.template.html', import.meta.url), 'utf8');
await writeFile(new URL('./koi-ponds.html', import.meta.url), template
  .replace('<!--LIGHT-->', PONDS.map((p) => fig(p, 'light')).join(''))
  .replace('<!--DARK-->', ['ice', 'leaves', 'honey', 'koi'].map((p) => fig(p, 'dark')).join(''))
  .replace('<!--HOP-->', ['water', 'koi', 'ice', 'honey'].map((p) => fig(p, 'light', true)).join(''))
  .replace('<!--PHONES-->', shots.map(phone).join(''))
  .replace('<!--BACK-->', back)
  .replace('<!--SWATCH_LIGHT-->', swatches('light'))
  .replace('<!--SWATCH_DARK-->', swatches('dark')));
console.log('Wrote design/pond-palettes/koi-ponds.html');
