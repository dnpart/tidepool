// Builds design/pond-palettes/shore-ponds.html: Pond Hop with the track on the pond's shore and the home lanes on piers
// (Nov 4, after the owner's notes on full-ponds.html: a hop can't ripple over an island, and stones around the ring
// crowd). Run: node --experimental-strip-types --no-warnings design/pond-palettes/shore-ponds.mjs
// Marbles are the owner's (src/art/piecesArt.ts); the four hop lily pads are the owner's, from design/art-export/08.
import { readFile, writeFile } from 'node:fs/promises';
import { PIECES } from '../../src/art/piecesArt.ts';

const C = 180, R = 128, TRACK = 40, PADS = [5, 15, 25, 35], STARTS = [30, 10, 0, 20];
const POND_R = 113, SHORE_R = 147, COVE_R = 19;
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

const kebab = (k) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const nodes = (list) => list.map((n) => `<${n.tag} ${Object.entries(n.attrs).map(([k, v]) => `${kebab(k)}="${v}"`).join(' ')}/>`).join('');
const marble = (x, y, seat) => `<g transform="translate(${f(x)} ${f(y)})"><g transform="${PIECES[`marble${seat}`].transform}">${nodes(PIECES[`marble${seat}`].nodes)}</g></g>`;
const master = await readFile(new URL('../art-export/08-pieces-ponds-sky-app-icon.svg', import.meta.url), 'utf8');
const lagoon = master.slice(master.indexOf('id="Lagoon_and_Coral_Reef_Lagoon_and_Coral_Reef_pond"'), master.indexOf('id="Pond_Hop_ponds_Winter"'));
const padPaths = [...lagoon.matchAll(/<path class="st115" d="([^"]+)"/g)].map((m) => m[1]);
const ownerPads = (fill) => `<g transform="matrix(${f(1 / 1.5)} 0 0 ${f(1 / 1.5)} -40 -845.33)">${padPaths.map((d) => `<path d="${d}" fill="${fill}"/>`).join('')}</g>`;

const PANEL = {
  lagoon: { light: { surface: '#FFFFFF', line: '#CFE3DF', ink: '#173B47', bg: '#E4F3F0' } },
  winter: { light: { surface: '#FFFFFF', line: '#CFDEEA', ink: '#16324A', bg: '#E8F1F8' }, dark: { surface: '#142333', line: '#26405A', ink: '#E6F0F8', bg: '#0B1521' } },
  forest: { light: { surface: '#FFFFFF', line: '#CCDAC8', ink: '#1E3324', bg: '#E8EFE3' }, dark: { surface: '#17261C', line: '#2A4233', ink: '#E4EFE4', bg: '#0E1912' } },
  honeycomb: { light: { surface: '#FFFDF9', line: '#E3D6C2', ink: '#3A2A1C', bg: '#F4EEE4' }, dark: { surface: '#2A2119', line: '#463626', ink: '#F4EADB', bg: '#1C1611' } },
};
/** Water (or ice, or honey), the shore the track runs on, and the piers the home lanes run out on. */
const LOOK = {
  water: { light: { inner: '#CDEEEE', outer: '#9FD3D6', rim: '#86C2C6', mark: '#FFFFFF', shore: '#EED9A6', shoreEdge: '#D9C28C', hop: '#5E9C6B', pier: '#C69C6D', plank: '#A57E52' } },
  ice: {
    light: { inner: '#F2F9FE', outer: '#CFE5F4', rim: '#9FC3DE', mark: '#86AED0', shore: '#EDF4FA', shoreEdge: '#C9DBEA', hop: '#6F9EC4', pier: '#9C8571', plank: '#7E6A57' },
    dark: { inner: '#35597B', outer: '#22405D', rim: '#5B86AC', mark: '#A4C8E6', shore: '#3F5F7B', shoreEdge: '#2B4560', hop: '#8CC3EC', pier: '#7C6A5A', plank: '#5E4F42' },
  },
  leaves: {
    light: { inner: '#8FC6AE', outer: '#5E9F88', rim: '#4F8C76', mark: '#FFFFFF', shore: '#A9D08A', shoreEdge: '#86B36A', hop: '#E9F5EE', pier: '#8A6A4A', plank: '#6E5238' },
    dark: { inner: '#2F5C4B', outer: '#1C3D31', rim: '#46775F', mark: '#CFE8DA', shore: '#3E6B45', shoreEdge: '#2D5034', hop: '#8FCB9B', pier: '#6E5238', plank: '#523C28' },
  },
  honey: {
    light: { inner: '#F8CB55', outer: '#DC931F', rim: '#B9761A', mark: '#FFFFFF', shore: '#FFF0C2', shoreEdge: '#E2C17A', hop: '#FFF4D6', pier: '#FFF0C2', plank: '#D9A94A' },
    dark: { inner: '#E2A633', outer: '#A8661A', rim: '#C98A2C', mark: '#FFF3D6', shore: '#4A3A28', shoreEdge: '#7A5C34', hop: '#FFF4D6', pier: '#5A4630', plank: '#9C7A44' },
  },
};
const PALETTE_OF = { water: 'lagoon', ice: 'winter', leaves: 'forest', honey: 'honeycomb' };

/** The pond: one circle plus a little cove at each lily pad, so the pads float in water at the shore's edge. */
function pondShape(r, extra, fill) {
  const coves = PADS.map((p) => { const [x, y] = holeAt(p); return `<circle cx="${f(x)}" cy="${f(y)}" r="${COVE_R + extra}" fill="${fill}"/>`; });
  return `<circle cx="${C}" cy="${C}" r="${r + extra}" fill="${fill}"/>${coves.join('')}`;
}

function shore(pond, mode, k) {
  const out = [`<circle cx="${C}" cy="${C + 2}" r="${SHORE_R}" fill="${k.shoreEdge}"/><circle cx="${C}" cy="${C}" r="${SHORE_R}" fill="${k.shore}"/>`];
  if (pond === 'honey') {
    // the shore is comb: one wax cell around each track hole
    for (let i = 0; i < TRACK; i++) {
      if (PADS.includes(i)) continue;
      const [x, y] = holeAt(i);
      out.push(`<polygon points="${hex(x, y, 10.6, (i * 9) + 30)}" fill="none" stroke="${k.shoreEdge}" stroke-width="1.4"/>`);
    }
  }
  if (pond === 'leaves') {
    for (const a of [12, 58, 102, 148, 196, 242, 288, 334]) {
      const t = a * Math.PI / 180, x = f(C + Math.cos(t) * 141), y = f(C + Math.sin(t) * 141);
      out.push(`<g stroke="${mode === 'dark' ? '#5E9B67' : '#5E9C4E'}" stroke-width="1.5" stroke-linecap="round" fill="none"><path d="M${x} ${y} q-1.5 -4 -3.5 -6 M${x} ${y} q0 -5 0 -7.5 M${x} ${y} q1.5 -3.5 3.5 -5"/></g>`);
    }
  }
  if (pond === 'water') {
    for (const a of [20, 80, 130, 200, 250, 310]) {
      const t = a * Math.PI / 180;
      out.push(`<circle cx="${f(C + Math.cos(t) * 142)}" cy="${f(C + Math.sin(t) * 142)}" r="1.3" fill="${k.shoreEdge}"/>`);
    }
  }
  return out.join('');
}

function pondBody(pond, mode, id, k) {
  const out = [pondShape(POND_R, 2.5, k.rim),
    `<defs><radialGradient id="g${id}" cx="${C}" cy="${C}" r="${SHORE_R}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${k.inner}"/><stop offset="1" stop-color="${k.outer}"/></radialGradient></defs>`,
    pondShape(POND_R, 0, `url(#g${id})`)];
  if (pond === 'water' || pond === 'leaves') {
    for (const [x, y, w] of [[C - 64, C - 34, 16], [C + 40, C - 66, 14], [C + 62, C + 28, 16], [C - 34, C + 64, 14]]) {
      out.push(`<path d="M${x} ${y} q${w / 2} -${w / 3} ${w} 0" stroke="${k.mark}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${mode === 'dark' ? 0.35 : 0.6}"/>`);
    }
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
    for (const [x, y, l] of [[C - 58, C + 30, 14], [C - 48, C + 40, 7], [C + 50, C - 20, 12]]) out.push(`<path d="M${x} ${y} l${f(l * 0.75)} ${f(-l * 0.66)}" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="${mode === 'dark' ? 0.5 : 0.95}"/>`);
  }
  if (pond === 'honey') {
    out.push(`<ellipse cx="${C - 46}" cy="${C - 62}" rx="26" ry="8" transform="rotate(-28 ${C - 46} ${C - 62})" fill="#FFFFFF" opacity="${mode === 'dark' ? 0.3 : 0.55}"/>`);
    for (const [x, y, r] of [[C + 62, C + 52, 3.2], [C + 72, C + 62, 2], [C - 72, C + 40, 2.6], [C - 30, C + 84, 2.4]]) out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${mode === 'dark' ? '#F6C35A' : '#FFE9A8'}" stroke-width="1.2"/>`);
  }
  return out.join('');
}

/** A pier from the shore out into the pond, carrying one home lane: boards, a snowy boardwalk, a log, or comb. */
function pier(pond, mode, k, start) {
  const [, , ax, ay] = CORNERS[start];
  const angle = Math.atan2(ay, ax) * 180 / Math.PI; // along the pier, outward
  const from = 50, to = 122, w = 19;
  const g = [];
  if (pond === 'leaves') {
    // a fallen log, cut end out in the water
    g.push(`<rect x="${from}" y="${-w / 2}" width="${to - from}" height="${w}" rx="${w / 2}" fill="${k.plank}"/>`);
    g.push(`<rect x="${from}" y="${-w / 2 + 1}" width="${to - from}" height="${w - 4}" rx="${(w - 4) / 2}" fill="${k.pier}"/>`);
    for (let x = from + 14; x < to - 6; x += 16) g.push(`<path d="M${x} ${-5} l7 0 M${x + 5} ${3} l6 0" stroke="${k.plank}" stroke-width="1.4" stroke-linecap="round"/>`);
    g.push(`<ellipse cx="${from + 3}" cy="0" rx="4" ry="${w / 2 - 0.5}" fill="${mode === 'dark' ? '#A88A62' : '#D9B98A'}"/><ellipse cx="${from + 3}" cy="0" rx="2" ry="${w / 4}" fill="none" stroke="${k.plank}" stroke-width="1"/>`);
  } else if (pond === 'honey') {
    // a strip of comb: one wax cell per home spot
    g.push(`<rect x="${from - 2}" y="${-w / 2 + 1}" width="${to - from + 4}" height="${w - 2}" rx="5" fill="${k.plank}" opacity=".55"/>`);
    for (const r of [60, 76, 92, 108]) g.push(`<polygon points="${hex(r, 0, 9.6, 30)}" fill="${k.pier}" stroke="${k.plank}" stroke-width="1.4"/>`);
  } else {
    g.push(`<rect x="${from}" y="${-w / 2 + 1.5}" width="${to - from}" height="${w}" rx="2.5" fill="${k.plank}"/>`);
    g.push(`<rect x="${from}" y="${-w / 2}" width="${to - from}" height="${w}" rx="2.5" fill="${k.pier}"/>`);
    for (let x = from + 6; x < to; x += 6) g.push(`<path d="M${x} ${-w / 2} L${x} ${w / 2}" stroke="${k.plank}" stroke-width=".9" opacity=".7"/>`);
    g.push(`<circle cx="${from + 2.5}" cy="${-w / 2 - 1}" r="2.6" fill="${k.plank}"/><circle cx="${from + 2.5}" cy="${w / 2 + 1}" r="2.6" fill="${k.plank}"/>`);
    if (pond === 'ice') g.push(`<path d="M${from + 1} ${-w / 2 + 1} L${to} ${-w / 2 + 1}" stroke="${mode === 'dark' ? '#DCEBFA' : '#FFFFFF'}" stroke-width="3.2" stroke-linecap="round"/>`);
  }
  return `<g transform="translate(${C} ${C}) rotate(${f(angle)})">${g.join('')}</g>`;
}

/** What a hop leaves on the pond, for the mid-hop board: ripples, a skate mark, or a honey trail. */
function hopMark(pond, mode, k) {
  const [x1, y1] = holeAt(5), [x2, y2] = holeAt(25);
  const at = (t) => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  if (pond === 'ice') return [-2, 2].map((s) => `<path d="M${f(x1 + s)} ${f(y1 + s)} L${f(at(0.55)[0] + s)} ${f(at(0.55)[1] + s)}" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity=".95"/>`).join('');
  if (pond === 'honey') return `<path d="M${f(x1)} ${f(y1)} L${f(at(0.55)[0])} ${f(at(0.55)[1])}" stroke="${mode === 'dark' ? '#6E3D08' : '#A9620F'}" stroke-width="4.5" stroke-linecap="round" opacity=".7"/>`;
  return [[0.25, 8], [0.4, 6], [0.52, 3.5]].map(([t, r]) => { const [x, y] = at(t); return `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="none" stroke="${k.mark}" stroke-width="1.5" opacity=".85"/>`; }).join('');
}

const STATE = [[-1, -1, 3, 41], [-1, 4, 15, -1], [-1, -1, 22, 40]];

function board({ pond, mode, id, hop }) {
  const pal = PANEL[PALETTE_OF[pond]][mode];
  const k = LOOK[pond][mode];
  const hole = (x, y, r = 6.6) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${pal.ink}" fill-opacity=".16"/>`;
  const out = [`<rect x="1" y="1" width="358" height="358" rx="36" fill="${pal.surface}" stroke="${pal.line}" stroke-width="1.5"/>`,
    shore(pond, mode, k), pondBody(pond, mode, id, k)];
  for (const [p, q] of [[5, 25], [15, 35]]) {
    const [x1, y1] = holeAt(p), [x2, y2] = holeAt(q);
    out.push(`<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${k.hop}" stroke-width="2" stroke-dasharray="3 6" stroke-linecap="round" opacity=".6"/>`);
  }
  if (hop) out.push(hopMark(pond, mode, k));
  STARTS.forEach((start) => out.push(pier(pond, mode, k, start)));
  for (let i = 0; i < TRACK; i++) {
    if (PADS.includes(i)) continue;
    const [x, y] = holeAt(i);
    out.push(hole(x, y));
  }
  out.push(ownerPads(mode === 'dark' ? '#6FB07C' : '#7CC08A'));
  for (const i of PADS) { const [x, y] = holeAt(i); out.push(hole(x, y)); }
  STARTS.forEach((start, seat) => {
    const [x, y] = holeAt(start), [bx, by] = CORNERS[start];
    const used = seat < STATE.length;
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="9.5" fill="none" stroke="${used ? RING[seat] : pal.ink}" stroke-opacity="${used ? 1 : 0.2}" stroke-width="2.4"/>`);
    for (let j = 0; j < 4; j++) {
      const [lx, ly] = laneAt(start, j);
      out.push(`<circle cx="${f(lx)}" cy="${f(ly)}" r="6.6" fill="${used ? LIGHT[seat] : pal.ink}" opacity="${used ? 0.85 : 0.14}"/>`);
    }
    out.push(`<rect x="${bx - 28}" y="${by - 28}" width="56" height="56" rx="18" fill="${used ? LIGHT[seat] : pal.ink}" opacity="${used ? 0.35 : 0.07}"/>`);
    if (used) SPOTS.forEach(([dx, dy]) => out.push(`<circle cx="${bx + dx}" cy="${by + dy}" r="7" fill="${pal.ink}" fill-opacity=".13"/>`));
  });
  out.push(`<text x="42" y="284" text-anchor="middle" font-family="Fredoka, 'Arial Rounded MT Bold', sans-serif" font-weight="600" font-size="13" fill="${pal.ink}">You</text>`);
  STATE.forEach((own, seat) => own.forEach((p, i) => {
    if (hop && seat === 1 && i === 2) return; // the blue marble is mid-hop
    const [x, y] = marbleAt(seat, i, p); out.push(marble(x, y, seat));
  }));
  if (hop) { const [x1, y1] = holeAt(5), [x2, y2] = holeAt(25); out.push(marble(x1 + (x2 - x1) * 0.6, y1 + (y2 - y1) * 0.6, 1)); }
  return `<svg viewBox="0 0 360 360" role="img" aria-label="${PALETTE_OF[pond]} pond with a shore and piers, ${mode}${hop ? ', mid-hop' : ''}">${out.join('')}</svg>`;
}

const NAME = { water: 'Lagoon and Coral Reef', ice: 'Winter', leaves: 'Forest', honey: 'Honeycomb' };
const fig = (pond, mode, hop = false) => {
  const pal = PANEL[PALETTE_OF[pond]][mode];
  return `<figure style="background:${pal.bg}"><div class="board">${board({ pond, mode, id: `${pond}${mode}${hop}`, hop })}</div><figcaption style="color:${mode === 'dark' ? '#C9D6E0' : '#3F5560'}">${NAME[pond]}, ${mode}${hop ? ', mid-hop' : ''}</figcaption></figure>`;
};
const PONDS = ['water', 'ice', 'leaves', 'honey'];
const template = await readFile(new URL('./shore-ponds.template.html', import.meta.url), 'utf8');
await writeFile(new URL('./shore-ponds.html', import.meta.url), template
  .replace('<!--LIGHT-->', PONDS.map((p) => fig(p, 'light')).join(''))
  .replace('<!--DARK-->', ['ice', 'leaves', 'honey'].map((p) => fig(p, 'dark')).join(''))
  .replace('<!--HOP-->', PONDS.map((p) => fig(p, 'light', true)).join('')));
console.log('Wrote design/pond-palettes/shore-ponds.html');
