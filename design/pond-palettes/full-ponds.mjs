// Builds design/pond-palettes/full-ponds.html: mockups of Pond Hop with the pond filling the whole circle, as the
// owner asked (Nov 4). Run: node --experimental-strip-types --no-warnings design/pond-palettes/full-ponds.mjs
// Marbles are the owner's (src/art/piecesArt.ts); the four hop lily pads are the owner's, from the ponds in
// design/art-export/08-…svg. Geometry is the game's (src/games/pondhop/board.ts).
import { readFile, writeFile } from 'node:fs/promises';
import { PIECES } from '../../src/art/piecesArt.ts';

const C = 180, R = 128, TRACK = 40, PADS = [5, 15, 25, 35], STARTS = [30, 10, 0, 20];
const POND_R = 150, ISLAND_R = 56;
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
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// --- the owner's art ---
const kebab = (k) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const nodes = (list) => list.map((n) => `<${n.tag} ${Object.entries(n.attrs).map(([k, v]) => `${kebab(k)}="${v}"`).join(' ')}/>`).join('');
const marble = (x, y, seat) => `<g transform="translate(${f(x)} ${f(y)})"><g transform="${PIECES[`marble${seat}`].transform}">${nodes(PIECES[`marble${seat}`].nodes)}</g></g>`;
const master = await readFile(new URL('../art-export/08-pieces-ponds-sky-app-icon.svg', import.meta.url), 'utf8');
const lagoon = master.slice(master.indexOf('id="Lagoon_and_Coral_Reef_Lagoon_and_Coral_Reef_pond"'), master.indexOf('id="Pond_Hop_ponds_Winter"'));
const padPaths = [...lagoon.matchAll(/<path class="st115" d="([^"]+)"/g)].map((m) => m[1]);
if (padPaths.length !== 4) throw new Error(`expected the owner's 4 lily pads, found ${padPaths.length}`);
// The Lagoon board sits at (60, 1268) at 1.5 page units per board unit
const ownerPads = (fill) => `<g transform="matrix(${f(1 / 1.5)} 0 0 ${f(1 / 1.5)} -40 -845.33)">${padPaths.map((d) => `<path d="${d}" fill="${fill}"/>`).join('')}</g>`;

// --- palettes and ponds ---
const PANEL = {
  lagoon: { light: { surface: '#FFFFFF', line: '#CFE3DF', ink: '#173B47', bg: '#E4F3F0' } },
  winter: { light: { surface: '#FFFFFF', line: '#CFDEEA', ink: '#16324A', bg: '#E8F1F8' }, dark: { surface: '#142333', line: '#26405A', ink: '#E6F0F8', bg: '#0B1521' } },
  forest: { light: { surface: '#FFFFFF', line: '#CCDAC8', ink: '#1E3324', bg: '#E8EFE3' }, dark: { surface: '#17261C', line: '#2A4233', ink: '#E4EFE4', bg: '#0E1912' } },
  honeycomb: { light: { surface: '#FFFDF9', line: '#E3D6C2', ink: '#3A2A1C', bg: '#F4EEE4' }, dark: { surface: '#2A2119', line: '#463626', ink: '#F4EADB', bg: '#1C1611' } },
};
const POND = {
  water: { light: { inner: '#CDEEEE', outer: '#A4D6D9', rim: '#8CC8CB', mark: '#FFFFFF', hop: '#5E9C6B' } },
  ice: {
    light: { inner: '#F2F9FE', outer: '#CFE5F4', rim: '#9FC3DE', mark: '#86AED0', hop: '#6F9EC4' },
    dark: { inner: '#35597B', outer: '#22405D', rim: '#5B86AC', mark: '#A4C8E6', hop: '#8CC3EC' },
  },
  leaves: {
    light: { inner: '#8FC6AE', outer: '#5E9F88', rim: '#4F8C76', mark: '#FFFFFF', hop: '#E9F5EE' },
    dark: { inner: '#2F5C4B', outer: '#1C3D31', rim: '#46775F', mark: '#CFE8DA', hop: '#8FCB9B' },
  },
  honey: {
    light: { inner: '#F8CB55', outer: '#DC931F', rim: '#B9761A', mark: '#FFFFFF', hop: '#FFF4D6' },
    dark: { inner: '#E2A633', outer: '#A8661A', rim: '#C98A2C', mark: '#FFF3D6', hop: '#FFF4D6' },
  },
};
const PALETTE_OF = { water: 'lagoon', ice: 'winter', leaves: 'forest', honey: 'honeycomb' };

const hex = (x, y, s) => Array.from({ length: 6 }, (_, i) => { const a = (60 * i) * Math.PI / 180; return `${f(x + s * Math.cos(a))},${f(y + s * Math.sin(a))}`; }).join(' ');

/** What every track hole and home spot sits on. */
function spot(kind, pond, mode, x, y, i) {
  const rot = f(rand() * 180), sx = f(1 + (rand() - 0.5) * 0.12);
  if (kind === 'stone') {
    const tone = { water: ['#DCD3C1', '#BFB4A0', '#ECE6D8'], ice: ['#B4BEC8', '#97A3AE', '#FFFFFF'], leaves: ['#B3AE9F', '#958F80', '#8DB86B'], honey: ['#FFF1C9', '#E2C88A', '#FFFAEA'] }[pond];
    const dark = mode === 'dark' && pond !== 'honey' ? 0.8 : 1;
    const mul = (c) => (dark === 1 ? c : `#${[1, 3, 5].map((k) => Math.round(parseInt(c.slice(k, k + 2), 16) * dark).toString(16).padStart(2, '0')).join('')}`);
    const top = pond === 'ice' ? `<path d="M-9 -2 Q-8 -9 0 -9.5 Q8 -9 9 -2 Q5 -4.5 0 -4 Q-5 -4.5 -9 -2Z" fill="${tone[2]}"/>`
      : pond === 'leaves' ? `<ellipse cx="-3" cy="-5.5" rx="5" ry="2.6" fill="${tone[2]}" opacity=".9"/>`
        : `<ellipse cx="-3" cy="-4" rx="4.5" ry="2.4" fill="${tone[2]}" opacity=".7"/>`;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${sx} 1)"><ellipse cx="0" cy="1.2" rx="11.2" ry="10" fill="${mul(tone[1])}"/><ellipse rx="11" ry="9.6" fill="${mul(tone[0])}"/><g transform="rotate(${-rot})">${top}</g></g>`;
  }
  if (kind === 'icehole') {
    const water = mode === 'dark' ? '#0E2133' : '#3D6C8C';
    return `<g transform="translate(${f(x)} ${f(y)})"><circle r="10.8" fill="${mode === 'dark' ? '#DCEBFA' : '#FFFFFF'}" opacity="${mode === 'dark' ? 0.5 : 0.95}"/><circle r="9.2" fill="${water}"/><path d="M-6 -4 Q-3 -6.5 1 -6.6" stroke="#FFFFFF" stroke-width="1.2" fill="none" opacity=".45" stroke-linecap="round"/></g>`;
  }
  if (kind === 'pad') {
    const g = mode === 'dark' ? '#5E9B67' : '#9DD3A3';
    const a = Math.atan2(y - C, x - C) * 180 / Math.PI + 90 + 180;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><path d="M0 0 m-10.5 0 a10.5 10.5 0 1 0 21 0 a10.5 10.5 0 1 0 -21 0 Z M0 0 L-3.6 -10.5 L3.6 -10.5 Z" fill="${g}" fill-rule="evenodd"/></g>`;
  }
  // a wax comb cell
  const fill = mode === 'dark' ? '#6E5233' : '#FFF3D1', stroke = mode === 'dark' ? '#E2B271' : '#D9A94A';
  return `<polygon points="${hex(x, y, 11.5)}" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>`;
}

function pondBody(pond, mode, id) {
  const k = POND[pond][mode];
  const out = [`<defs><radialGradient id="g${id}" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="${k.inner}"/><stop offset="1" stop-color="${k.outer}"/></radialGradient></defs>`,
    `<circle cx="${C}" cy="${C}" r="${POND_R}" fill="url(#g${id})"/>`];
  if (pond === 'water' || pond === 'leaves') {
    for (const [x, y, w] of [[C - 92, C - 60, 18], [C + 70, C - 88, 16], [C + 96, C + 40, 18], [C - 60, C + 96, 16], [C - 104, C + 22, 12], [C + 30, C + 104, 12]]) {
      out.push(`<path d="M${x} ${y} q${w / 2} -${w / 3} ${w} 0" stroke="${k.mark}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${mode === 'dark' ? 0.35 : 0.6}"/>`);
    }
  }
  if (pond === 'leaves') {
    for (const [x, y, r, c] of [[C - 80, C - 84, 30, '#E39B4B'], [C + 92, C - 60, -60, '#E8C15A'], [C - 98, C + 64, 110, '#C9653D'], [C + 74, C + 90, 200, '#8DB86B'], [C + 18, C - 104, 70, '#C9653D'], [C - 30, C + 108, -20, '#E8C15A']]) {
      out.push(`<g transform="translate(${x} ${y}) rotate(${r}) scale(1.25)"><path d="M0 -6 C4.5 -3 4.5 3 0 6 C-4.5 3 -4.5 -3 0 -6 Z" fill="${c}"/><path d="M0 -5 L0 7.5" stroke="#00000033" stroke-width=".9" stroke-linecap="round"/></g>`);
    }
  }
  if (pond === 'ice') {
    for (const d of [`M${C - 140} ${C - 30} l26 8 l18 -12 l22 6 M${C - 114} ${C - 22} l4 18`, `M${C + 60} ${C - 132} l-10 26 l14 18 l-8 18`, `M${C + 34} ${C + 140} l8 -30 l24 -12`, `M${C + 138} ${C + 40} l-24 -6 l-14 14`]) {
      out.push(`<path d="${d}" transform="translate(.9 .9)" stroke="${mode === 'dark' ? '#16293C' : '#FFFFFF'}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${k.mark}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
    for (const [x, y, l] of [[C - 70, C + 44, 16], [C - 58, C + 58, 8], [C + 64, C - 24, 14]]) out.push(`<path d="M${x} ${y} l${f(l * 0.75)} ${f(-l * 0.66)}" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="${mode === 'dark' ? 0.5 : 0.95}"/>`);
  }
  if (pond === 'honey') {
    out.push(`<ellipse cx="${C - 60}" cy="${C - 84}" rx="34" ry="10" transform="rotate(-28 ${C - 60} ${C - 84})" fill="#FFFFFF" opacity="${mode === 'dark' ? 0.3 : 0.55}"/>`);
    for (const [x, y, r] of [[C + 84, C + 70, 3.6], [C + 96, C + 82, 2.2], [C - 100, C + 50, 3], [C + 30, C - 112, 2.4], [C - 40, C + 116, 2.8]]) out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${mode === 'dark' ? '#F6C35A' : '#FFE9A8'}" stroke-width="1.2"/>`);
  }
  out.push(`<circle cx="${C}" cy="${C}" r="${POND_R}" fill="none" stroke="${k.rim}" stroke-width="2.5"/>`);
  return out.join('');
}

/** The island in the middle, where the home lanes end. */
function island(pond, mode) {
  if (pond === 'water') {
    return `<circle cx="${C}" cy="${C + 2}" r="${ISLAND_R}" fill="#D9C28C"/><circle cx="${C}" cy="${C}" r="${ISLAND_R}" fill="#EED9A6"/>`
      + `<g stroke="#7CB27F" stroke-width="2" stroke-linecap="round" fill="none"><path d="M${C - 26} ${C - 18} q-2 -7 -5 -10 M${C - 26} ${C - 18} q1 -8 3 -12 M${C + 24} ${C + 20} q-2 -7 -5 -10 M${C + 24} ${C + 20} q1 -8 3 -12"/></g>`
      + `<path d="M${C + 18} ${C - 26} l2.2 4.6 5 .7 -3.6 3.5 .9 5 -4.5 -2.4 -4.5 2.4 .9 -5 -3.6 -3.5 5 -.7Z" fill="#F2A65A"/>`;
  }
  if (pond === 'ice') {
    const shade = mode === 'dark' ? '#08111B' : '#BCD3E6', snow = mode === 'dark' ? '#E9F1FA' : '#FFFFFF';
    return `<circle cx="${C}" cy="${C + 3}" r="${ISLAND_R}" fill="${shade}"/><circle cx="${C}" cy="${C}" r="${ISLAND_R}" fill="${snow}"/>`
      + `<ellipse cx="${C - 16}" cy="${C - 18}" rx="18" ry="6" fill="${mode === 'dark' ? '#C9DCEB' : '#EAF3FA'}"/>`;
  }
  if (pond === 'leaves') {
    const moss = mode === 'dark' ? '#3E6B45' : '#86B873', edge = mode === 'dark' ? '#2D5034' : '#6A9C5B';
    return `<circle cx="${C}" cy="${C + 3}" r="${ISLAND_R}" fill="${edge}"/><circle cx="${C}" cy="${C}" r="${ISLAND_R}" fill="${moss}"/>`
      + `<g transform="translate(${C + 20} ${C - 22})"><rect x="-2" y="-2" width="4" height="9" rx="2" fill="#F3E6CF"/><path d="M-8 -1 Q-8 -10 0 -10 Q8 -10 8 -1Z" fill="#D9505E"/><circle cx="-3" cy="-6" r="1.3" fill="#FFFFFF"/><circle cx="3" cy="-4" r="1.1" fill="#FFFFFF"/></g>`
      + `<g stroke="${mode === 'dark' ? '#5E9B67' : '#4E8A55'}" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M${C - 24} ${C + 22} q-2 -7 -5 -11 M${C - 24} ${C + 22} q0 -9 0 -14 M${C - 24} ${C + 22} q2 -6 5 -9"/></g>`;
  }
  const cells = [];
  for (const [q, r] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) {
    const x = C + 17.5 * 1.5 * q, y = C + 17.5 * Math.sqrt(3) * (r + q / 2);
    const filled = (q + r) % 2 === 0;
    cells.push(`<polygon points="${hex(x, y, 16.5)}" fill="${filled ? (mode === 'dark' ? '#F2C35A' : '#F6C94E') : (mode === 'dark' ? '#4A3A28' : '#FFF0C2')}" stroke="${mode === 'dark' ? '#7A5C34' : '#D9A94A'}" stroke-width="1.6"/>`);
  }
  return `<g transform="rotate(30 ${C} ${C})">${cells.join('')}</g>`;
}

// Mid-game: you have a marble on the track and one in your home lane; blue has one on a lily pad; gold is in its lane
const STATE = [[-1, -1, 3, 41], [-1, 4, 15, -1], [-1, -1, 22, 40]];

function board({ pond, mode, look, id }) {
  seed = 11;
  const pal = PANEL[PALETTE_OF[pond]][mode];
  const k = POND[pond][mode];
  const spotKind = look === 'A' ? 'stone' : { water: 'stone', ice: 'icehole', leaves: 'pad', honey: 'cell' }[pond];
  const hole = (x, y, r = 6.6) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${spotKind === 'icehole' ? '#000000' : pal.ink}" fill-opacity="${spotKind === 'icehole' ? 0.25 : 0.16}"/>`;
  const out = [`<rect x="1" y="1" width="358" height="358" rx="36" fill="${pal.surface}" stroke="${pal.line}" stroke-width="1.5"/>`, pondBody(pond, mode, id)];
  // hops across the pond, pad to pad
  for (const [p, q] of [[5, 25], [15, 35]]) {
    const [x1, y1] = holeAt(p), [x2, y2] = holeAt(q);
    out.push(`<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${k.hop}" stroke-width="2" stroke-dasharray="3 6" stroke-linecap="round" opacity=".6"/>`);
  }
  out.push(island(pond, mode));
  for (let i = 0; i < TRACK; i++) {
    if (PADS.includes(i)) continue;
    const [x, y] = holeAt(i);
    out.push(spot(spotKind, pond, mode, x, y, i), hole(x, y));
  }
  // the owner's four lily pads carry the hop holes
  out.push(ownerPads(mode === 'dark' ? '#6FB07C' : '#7CC08A'));
  for (const i of PADS) { const [x, y] = holeAt(i); out.push(hole(x, y)); }
  STARTS.forEach((start, seat) => {
    const [x, y] = holeAt(start), [bx, by] = CORNERS[start];
    const used = seat < STATE.length;
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="9.5" fill="none" stroke="${used ? RING[seat] : pal.ink}" stroke-opacity="${used ? 1 : 0.2}" stroke-width="2.4"/>`);
    for (let j = 0; j < 4; j++) {
      const [lx, ly] = laneAt(start, j);
      out.push(spot(spotKind, pond, mode, lx, ly, 100 + j));
      out.push(`<circle cx="${f(lx)}" cy="${f(ly)}" r="7" fill="${used ? LIGHT[seat] : pal.ink}" opacity="${used ? 0.75 : 0.12}"/>`);
    }
    out.push(`<rect x="${bx - 28}" y="${by - 28}" width="56" height="56" rx="18" fill="${used ? LIGHT[seat] : pal.ink}" opacity="${used ? 0.35 : 0.07}"/>`);
    if (used) SPOTS.forEach(([dx, dy]) => out.push(`<circle cx="${bx + dx}" cy="${by + dy}" r="7" fill="${pal.ink}" fill-opacity=".13"/>`));
  });
  out.push(`<text x="42" y="284" text-anchor="middle" font-family="Fredoka, 'Arial Rounded MT Bold', sans-serif" font-weight="600" font-size="13" fill="${pal.ink}">You</text>`);
  STATE.forEach((own, seat) => own.forEach((p, i) => { const [x, y] = marbleAt(seat, i, p); out.push(marble(x, y, seat)); }));
  return `<svg viewBox="0 0 360 360" role="img" aria-label="${PALETTE_OF[pond]} pond, look ${look}, ${mode}">${out.join('')}</svg>`;
}

const NAME = { water: 'Lagoon and Coral Reef', ice: 'Winter', leaves: 'Forest', honey: 'Honeycomb' };
const fig = (pond, mode, look) => {
  const pal = PANEL[PALETTE_OF[pond]][mode];
  return `<figure style="background:${pal.bg}"><div class="board">${board({ pond, mode, look, id: `${look}${pond}${mode}` })}</div><figcaption style="color:${mode === 'dark' ? '#C9D6E0' : '#3F5560'}">${NAME[pond]}, ${mode}</figcaption></figure>`;
};
const PONDS = ['water', 'ice', 'leaves', 'honey'];
const rowA = PONDS.map((p) => fig(p, 'light', 'A')).join('');
const rowB = PONDS.map((p) => fig(p, 'light', 'B')).join('') + ['ice', 'leaves', 'honey'].map((p) => fig(p, 'dark', 'B')).join('');
const close = (pond, look) => {
  const svg = board({ pond, mode: 'light', look, id: `c${look}${pond}` }).replace('viewBox="0 0 360 360"', 'viewBox="196 196 140 140"');
  return `<figure style="background:${PANEL[PALETTE_OF[pond]].light.bg}"><div class="board">${svg}</div><figcaption>${NAME[pond]}, look ${look}</figcaption></figure>`;
};

const template = await readFile(new URL('./full-ponds.template.html', import.meta.url), 'utf8');
await writeFile(new URL('./full-ponds.html', import.meta.url), template
  .replace('<!--ROW_A-->', rowA)
  .replace('<!--ROW_B-->', rowB)
  .replace('<!--CLOSE-->', [close('water', 'A'), close('ice', 'B'), close('leaves', 'B'), close('honey', 'B')].join('')));
console.log('Wrote design/pond-palettes/full-ponds.html');
