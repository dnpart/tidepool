// Mockup art for the Bee + Sloth and Mushroom + Moth decks. Same 0 -8 64 68 viewBox as the octopus and manta,
// so crowns, faces and card layouts line up with the existing decks.
const VB = '0 -8 64 68';
const INK = '#3E4A5A';
const GOLD = '#F6C752', GOLD_STROKE = '#D49A22', JEWEL = '#E0607E';
let uid = 0;
const id = (p) => `${p}${++uid}`;

function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgb2hex(r) { return '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function shade(h, f) { return rgb2hex(hex2rgb(h).map((v) => v * f)); }
function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v + (B[i] - v) * t)); }

const SUIT = {
  hearts: 'M12 21 C5 15 2 11.5 2 8 C2 5 4.5 3 7 3 C9 3 11 4.3 12 6 C13 4.3 15 3 17 3 C19.5 3 22 5 22 8 C22 11.5 19 15 12 21 Z',
  diamonds: 'M12 2 L20 12 L12 22 L4 12 Z',
  spades: 'M12 2 C16 7 21 10 21 14 C21 17 19 18.5 16.8 18.5 C15 18.5 13.6 17.6 13 16.5 C13.3 18.8 14.2 20.5 15.5 22 L8.5 22 C9.8 20.5 10.7 18.8 11 16.5 C10.4 17.6 9 18.5 7.2 18.5 C5 18.5 3 17 3 14 C3 10 8 7 12 2 Z',
  clubs: 'M7.8 7 a4.2 4.2 0 1 0 8.4 0 a4.2 4.2 0 1 0 -8.4 0 Z M2.8 13.5 a4.2 4.2 0 1 0 8.4 0 a4.2 4.2 0 1 0 -8.4 0 Z M12.8 13.5 a4.2 4.2 0 1 0 8.4 0 a4.2 4.2 0 1 0 -8.4 0 Z M12 10 L9.2 22 L14.8 22 Z M9 12 L12 16.5 L15 12 Z',
};

// ---------- shared parts ----------
function face({ x = 32, y, mustacheY, gap = 6.5, eyes = 'open', cheekGap, cheekY, cheek = '#FF8C9E', cheekOp = 0.55, lashes, mustache, mouth = true, eyeInk = INK, light }) {
  const L = `fill="none" stroke="${eyeInk}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;
  const cg = cheekGap ?? gap + 4.6, cy = cheekY ?? y + 4;
  let s = `<ellipse cx="${x - cg}" cy="${cy}" rx="2.7" ry="1.7" fill="${cheek}" opacity="${cheekOp}"/><ellipse cx="${x + cg}" cy="${cy}" rx="2.7" ry="1.7" fill="${cheek}" opacity="${cheekOp}"/>`;
  for (const ex of [x - gap, x + gap]) {
    if (eyes === 'open') s += `<ellipse cx="${ex}" cy="${y}" rx="2.1" ry="2.4" fill="${eyeInk}"/><circle cx="${ex + 0.7}" cy="${y - 0.8}" r="0.75" fill="#FFF"/>`;
    if (eyes === 'happy') s += `<path ${L} d="M${ex - 2.6} ${y + 1} Q${ex} ${y - 2.2} ${ex + 2.6} ${y + 1}"/>`;
    if (eyes === 'sleepy') s += `<path ${L} d="M${ex - 2.4} ${y - 0.4} Q${ex} ${y + 2.2} ${ex + 2.4} ${y - 0.4}"/>`;
  }
  if (lashes) s += `<path ${L} stroke-width="1.3" d="M${x - gap - 1.9} ${y - 1.3} L${x - gap - 3.7} ${y - 2.1} M${x - gap - 1.2} ${y - 2.1} L${x - gap - 2.4} ${y - 3.6} M${x + gap + 1.9} ${y - 1.3} L${x + gap + 3.7} ${y - 2.1} M${x + gap + 1.2} ${y - 2.1} L${x + gap + 2.4} ${y - 3.6}"/>`;
  if (mustache) s += `<path fill="${eyeInk}" transform="translate(${x - 32} ${(mustacheY ?? y + 5) - 33.3})" d="M32 33 Q29.5 31 26.5 33.5 Q29 35.2 32 33.6 Q35 35.2 37.5 33.5 Q34.5 31 32 33 Z"/>`;
  else if (mouth) s += `<path ${L} d="M${x - 2.2} ${y + 3.8} Q${x} ${y + 5.9} ${x + 2.2} ${y + 3.8}"/>`;
  return s;
}

function crown(hat, dy, jewel = JEWEL) {
  const g = `fill="${GOLD}" stroke="${GOLD_STROKE}" stroke-width="1" stroke-linejoin="round"`;
  if (hat === 'king') return `<g transform="translate(0 ${dy})"><path ${g} d="M21 15 L22.5 4 L27.5 10 L32 2 L36.5 10 L41.5 4 L43 15 Z"/><circle cx="32" cy="11" r="1.8" fill="${jewel}"/></g>`;
  if (hat === 'queen') return `<g transform="translate(0 ${dy})"><path ${g} d="M23 14.5 Q23.5 9 27.5 9.5 Q29 5 32 4.5 Q35 5 36.5 9.5 Q40.5 9 41 14.5 Z"/><circle cx="27.5" cy="9.5" r="1.7" fill="#FFF"/><circle cx="32" cy="4.5" r="1.7" fill="#FFF"/><circle cx="36.5" cy="9.5" r="1.7" fill="#FFF"/><circle cx="32" cy="11" r="1.5" fill="${jewel}"/></g>`;
  return '';
}

function bowtie(cx, cy, c) {
  const w = `fill="${c}" stroke="${c}" stroke-width="1.2" stroke-linejoin="round"`;
  return `<path ${w} d="M${cx - 1.4} ${cy} L${cx - 6} ${cy - 3.2} Q${cx - 6.8} ${cy} ${cx - 6} ${cy + 3.2} Z"/><path ${w} d="M${cx + 1.4} ${cy} L${cx + 6} ${cy - 3.2} Q${cx + 6.8} ${cy} ${cx + 6} ${cy + 3.2} Z"/><rect x="${cx - 1.7}" y="${cy - 1.9}" width="3.4" height="3.8" rx="1" fill="${shade(c, 0.75)}"/>`;
}
const badge = (suit, color, tx, ty, s) => `<path transform="translate(${tx} ${ty}) scale(${s})" d="${SUIT[suit]}" fill="${color}"/>`;

// Light half on the right, like the reference art (a soft vertical split instead of an outline).
function lightHalf(shapeSvg, splitPath, color) {
  const c = id('c');
  return `<clipPath id="${c}">${shapeSvg.replace(/fill="[^"]*"/, '')}</clipPath><path clip-path="url(#${c})" fill="${color}" d="${splitPath}"/>`;
}

// ---------- Sloth (red team) ----------
const SLOTH = {
  hearts: { fur: '#DFA28E', dark: '#C9826D', toe: '#FFF1DA', leaf: '#E8788C' },
  diamonds: { fur: '#E6A774', dark: '#CC8752', toe: '#FFF1DA', leaf: '#F0A04B' },
};
function sloth({ suit = 'hearts', eyes = 'happy', hat, wave, badgeColor, bowtieColor, jewel }) {
  const P = SLOTH[suit];
  const furLight = mix(P.fur, '#FFFFFF', 0.16);
  let s = '';
  // body and feet
  s += `<ellipse cx="24" cy="57" rx="5.6" ry="3.2" fill="${P.dark}"/><ellipse cx="40" cy="57" rx="5.6" ry="3.2" fill="${P.dark}"/>`;
  const body = `<ellipse cx="32" cy="45" rx="17" ry="14" fill="${P.fur}"/>`;
  s += body + lightHalf(body, 'M34 28 C40 36 41 50 36 62 L64 62 L64 28 Z', furLight);
  // head with a fuzzy fringe
  const head = `<path fill="${P.fur}" d="M32 4.5 C42.5 4.5 50.5 12.5 50.5 23 C50.5 33.5 42.5 41 32 41 C21.5 41 13.5 33.5 13.5 23 C13.5 12.5 21.5 4.5 32 4.5 Z"/>`;
  s += `<path fill="${P.fur}" d="M24.5 8 Q26.5 2.6 29.5 6 Q32 1.4 34.6 6 Q37.6 2.6 39.6 8 Z"/>`;
  s += head + lightHalf(head, 'M36 0 C44 10 46 26 40 44 L64 44 L64 0 Z', furLight);
  // face mask, split light on the right
  const mask = `<path fill="#F8DC9F" d="M32 13.5 C40.5 13.5 46 19 46 25.5 C46 32.5 39.8 37 32 37 C24.2 37 18 32.5 18 25.5 C18 19 23.5 13.5 32 13.5 Z"/>`;
  s += mask + lightHalf(mask, 'M34.5 10 C29.5 18 29 29 33.5 40 L64 40 L64 10 Z', '#FFEFD0');
  // eye patches
  s += `<ellipse cx="24.6" cy="24.4" rx="5.4" ry="3.9" transform="rotate(-18 24.6 24.4)" fill="#7F8DA3"/><ellipse cx="39.4" cy="24.4" rx="5.4" ry="3.9" transform="rotate(18 39.4 24.4)" fill="#8C99AD"/>`;
  s += face({ y: 24.2, gap: 7.4, eyes, cheekGap: 12.6, cheekY: 30.2, mustacheY: 34, lashes: hat === 'queen', mustache: hat === 'king', mouth: false, eyeInk: '#2C3443' });
  // nose and mouth
  s += `<path fill="#5F6A80" d="M29.3 28.7 Q32 27.6 34.7 28.7 Q34.2 31.4 32 32 Q29.8 31.4 29.3 28.7 Z"/>`;
  if (hat !== 'king') s += `<path fill="none" stroke="#2C3443" stroke-width="1.4" stroke-linecap="round" d="M29.8 33.9 Q32 35.5 34.2 33.9"/>`;
  // arms hugging the tummy, or one raised
  const arm = `fill="none" stroke="${P.dark}" stroke-width="7" stroke-linecap="round"`;
  const claws = (x, y, dir) => `<path fill="none" stroke="${P.toe}" stroke-width="1.2" stroke-linecap="round" d="M${x + dir * 1.6} ${y - 2.4} l${dir * 2.2} -0.8 M${x + dir * 2} ${y} l${dir * 2.4} 0 M${x + dir * 1.6} ${y + 2.4} l${dir * 2.2} 0.8"/>`;
  s += `<path ${arm} d="M18.5 37 Q18 47.5 27.5 48.5"/>` + claws(27.5, 48.5, 1);
  if (wave) s += `<path ${arm} d="M45.5 37 Q53.5 33 55 21"/><path fill="none" stroke="${P.toe}" stroke-width="1.2" stroke-linecap="round" d="M52.4 17.6 l-0.6 -2.4 M55 17 l0 -2.6 M57.6 17.6 l0.6 -2.4"/>`;
  else s += `<path ${arm} d="M45.5 37 Q46 47.5 36.5 48.5"/>` + claws(36.5, 48.5, -1);
  if (badgeColor) s += badge(suit, badgeColor, 28.4, 7.2, 0.3);
  if (bowtieColor) s += bowtie(32, 40.4, bowtieColor);
  s += crown(hat, -8.5, jewel);
  return s;
}

// ---------- Bee (black team) ----------
const BEE = {
  spades: { stripe: '#34425E', wing: '#DCE6F6' },
  clubs: { stripe: '#2E4B41', wing: '#DDF1E6' },
};
function bee({ suit = 'spades', eyes = 'open', hat, wave, badgeColor, bowtieColor, jewel }) {
  const P = BEE[suit];
  const Y = '#FFCD2E', YD = '#F5A623', YL = '#FFDB5C';
  let s = '';
  // wings behind
  s += `<ellipse cx="17" cy="15" rx="8.5" ry="11" transform="rotate(-32 17 15)" fill="${P.wing}"/><ellipse cx="47" cy="15" rx="8.5" ry="11" transform="rotate(32 47 15)" fill="${P.wing}"/>`;
  s += `<path fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".9" d="M14.5 21 Q13 13 17 8 M49.5 21 Q51 13 47 8"/>`;
  // antennae
  const ax = hat ? 3 : 0;
  s += `<path fill="none" stroke="${P.stripe}" stroke-width="1.8" stroke-linecap="round" d="M27.5 14 Q25 6 ${20 - ax} ${2.5 + ax / 2} M36.5 14 Q39 6 ${44 + ax} ${2.5 + ax / 2}"/>`;
  s += `<circle cx="${20 - ax}" cy="${2.5 + ax / 2}" r="2.5" fill="#F7A21B"/><circle cx="${44 + ax}" cy="${2.5 + ax / 2}" r="2.5" fill="#F7A21B"/>`;
  // stinger
  s += `<path fill="${P.stripe}" d="M29.4 52 L32 59 L34.6 52 Z"/>`;
  // body, shaded orange underneath, stripes across the bottom half
  const body = `<circle cx="32" cy="33" r="21" fill="${Y}"/>`;
  s += body;
  const c = id('b');
  s += `<clipPath id="${c}"><circle cx="32" cy="33" r="21"/></clipPath><g clip-path="url(#${c})">`;
  s += `<path fill="${YL}" d="M38 8 C46 16 48 30 44 56 L60 56 L60 8 Z" opacity=".7"/>`;
  s += `<ellipse cx="32" cy="58" rx="26" ry="9" fill="${YD}"/>`;
  s += `<path fill="${P.stripe}" d="M8 38 Q32 44.5 56 38 L56 44.6 Q32 51 8 44.6 Z M8 48.4 Q32 54.8 56 48.4 L56 56 L8 56 Z"/>`;
  s += `</g>`;
  if (wave) s += `<path fill="none" stroke="${YD}" stroke-width="5" stroke-linecap="round" d="M50 31 Q56 27 57 19"/>`;
  else s += `<path fill="none" stroke="${YD}" stroke-width="4.4" stroke-linecap="round" d="M12.6 36 Q10.4 39 11.6 42 M51.4 36 Q53.6 39 52.4 42"/>`;
  s += face({ y: 27, gap: 6.6, eyes, cheekY: 31.4, cheek: '#FF7E8A', cheekOp: 0.6, lashes: hat === 'queen', mustache: hat === 'king', eyeInk: '#26303D' });
  if (badgeColor) s += badge(suit, badgeColor, 28.4, 15, 0.3);
  if (bowtieColor) s += bowtie(32, 36.6, bowtieColor);
  s += crown(hat, -1.5, jewel);
  return s;
}

// ---------- Mushroom (red team) ----------
const SHROOM = {
  hearts: { cap: '#D9505E', light: '#E8737F', gill: '#F7B3A6' },
  diamonds: { cap: '#DE8650', light: '#E9A06F', gill: '#FFB862' },
};
function mushroom({ suit = 'hearts', eyes = 'happy', hat, wave, badgeColor, bowtieColor, jewel, grass = true }) {
  const P = SHROOM[suit];
  let s = '';
  if (grass) s += `<path fill="#94CF78" d="M5 60 Q3.5 47 9.5 40 Q14 49 17 60 Z"/><path fill="#ABDD8F" d="M59 60 Q60.5 47 54.5 40 Q50 49 47 60 Z"/>`;
  const stem = `<path fill="#F9D59F" d="M20.5 27 C18.5 37 16.5 49 16.5 60 L47.5 60 C47.5 49 45.5 37 43.5 27 Z"/>`;
  s += stem + lightHalf(stem, 'M33.5 26 C29.5 36 29.5 49 33.5 61 L64 61 L64 26 Z', '#FFE8BF');
  if (grass) s += `<path fill="#ABDD8F" d="M11 60 Q12 52 17.5 48.5 Q18.5 55 18 60 Z"/><path fill="#94CF78" d="M53 60 Q52 52 46.5 48.5 Q45.5 55 46 60 Z"/>`;
  s += `<ellipse cx="32" cy="27.6" rx="22.5" ry="4.8" fill="${P.gill}"/>`;
  const cap = `<path fill="${P.cap}" d="M6 26.5 C6 12 17.5 3 32 3 C46.5 3 58 12 58 26.5 C58 29.4 55.4 30 52.6 28.6 C45 25.4 19 25.4 11.4 28.6 C8.6 30 6 29.4 6 26.5 Z"/>`;
  s += cap + lightHalf(cap, 'M39 0 C46 9 50 19 50.5 32 L64 32 L64 0 Z', P.light);
  s += `<g fill="#FFF6E3"><circle cx="15.5" cy="17.5" r="3.1"/><circle cx="25" cy="9.6" r="2.5"/><circle cx="33.5" cy="17" r="4.4"/><circle cx="45.5" cy="10.5" r="3.3"/><circle cx="51" cy="19.5" r="2.3"/></g>`;
  if (wave) s += `<path fill="none" stroke="#F6CF95" stroke-width="5" stroke-linecap="round" d="M44.5 46 Q51.5 43 53 35.5"/>`;
  s += face({ y: 41.5, gap: 6.4, eyes, cheekY: 45.6, cheek: '#FF8C9E', cheekOp: 0.6, lashes: hat === 'queen', mustache: hat === 'king', eyeInk: '#4A3C3C' });
  if (badgeColor) s += badge(suit, badgeColor, 28.4, 30.6, 0.3);
  if (bowtieColor) s += bowtie(32, 52, bowtieColor);
  s += crown(hat, -10, jewel);
  return s;
}

// ---------- Luna moth (black team) ----------
const MOTH = {
  clubs: { wing: '#BFE7B0', dark: '#9CCF8C', edge: '#7DB46E' },
  spades: { wing: '#CDD7F6', dark: '#A9B7E6', edge: '#8796D2' },
};
function moth({ suit = 'clubs', eyes = 'open', hat, wave, badgeColor, bowtieColor, jewel }) {
  const P = MOTH[suit];
  let s = '';
  // feathery antennae
  const fa = '#D8B47A', fs = '#B88E52';
  const ax = hat ? 2.5 : 0;
  for (const dir of [-1, 1]) {
    const tx = 32 + dir * (17 + ax), ty = 1 - ax / 2, bx = 32 + dir * 3, by = 13.4;
    s += `<path fill="${fa}" d="M${bx} ${by} Q${32 + dir * 12} ${8 - ax / 2} ${tx} ${ty} Q${32 + dir * 6} ${4 - ax / 2} ${bx - dir * 0.6} ${by - 0.6} Z"/>`;
    let ticks = '';
    for (let t = 0.25; t < 0.95; t += 0.14) {
      const px = bx + (tx - bx) * t, py = by + (ty - by) * t - 1.6 * Math.sin(Math.PI * t);
      ticks += `M${(px - dir * 1.5).toFixed(2)} ${(py - 1.5).toFixed(2)} L${px.toFixed(2)} ${py.toFixed(2)} L${(px + dir * 0.4).toFixed(2)} ${(py + 2).toFixed(2)} `;
    }
    s += `<path fill="none" stroke="${fs}" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round" d="${ticks}"/>`;
  }
  // hindwings with long curling tails
  s += `<path fill="${P.dark}" d="M29 33 C21 34.5 15.5 40 15 46 C14.6 51 16 55 11.5 59.5 C18 59 22.5 54.5 24.5 50 C27 45 29 40 30 35 Z"/><path fill="${P.dark}" d="M35 33 C43 34.5 48.5 40 49 46 C49.4 51 48 55 52.5 59.5 C46 59 41.5 54.5 39.5 50 C37 45 35 40 34 35 Z"/>`;
  s += `<circle cx="21" cy="44.5" r="2.4" fill="#F5E3A2"/><circle cx="43" cy="44.5" r="2.4" fill="#F5E3A2"/>`;
  // forewings with eyespots and a darker leading edge
  const lw = `<path fill="${P.wing}" d="M29.5 21 C22.5 13 11.5 9.5 5.5 12.5 C1.8 15 3 25 9 30.5 C15 35.5 24.5 36 30.5 32 Z"/>`;
  const rw = `<path fill="${P.wing}" d="M34.5 21 C41.5 13 52.5 9.5 58.5 12.5 C62.2 15 61 25 55 30.5 C49 35.5 39.5 36 33.5 32 Z"/>`;
  s += lw + rw;
  s += `<path fill="none" stroke="${P.edge}" stroke-width="1.7" stroke-linecap="round" d="M28.5 20 C22 13.4 12 10.6 6.4 13 M35.5 20 C42 13.4 52 10.6 57.6 13"/>`;
  s += `<path fill="${P.dark}" d="M30.5 32 C24.5 36 15 35.5 9 30.5 C15 32.5 22 32.4 29.5 28 Z" opacity=".55"/><path fill="${P.dark}" d="M33.5 32 C39.5 36 49 35.5 55 30.5 C49 32.5 42 32.4 34.5 28 Z" opacity=".55"/>`;
  for (const ex of [14.5, 49.5]) s += `<circle cx="${ex}" cy="21.5" r="3.3" fill="#F5E3A2" stroke="#C78B74" stroke-width="1.1"/><circle cx="${ex}" cy="21.5" r="1.1" fill="#8E5A4C"/>`;
  // fuzzy body and head
  const body = `<ellipse cx="32" cy="38" rx="6" ry="12" fill="#F7F3E6"/>`;
  s += body + `<path fill="none" stroke="#E2DCC8" stroke-width="1.1" stroke-linecap="round" d="M28 36 Q32 38 36 36 M28.4 41 Q32 43 35.6 41 M29.4 46 Q32 47.6 34.6 46"/>`;
  if (wave) s += `<path fill="none" stroke="#EFE9D6" stroke-width="3" stroke-linecap="round" d="M36.5 34 Q44 31 46 24"/>`;
  const head = `<circle cx="32" cy="22" r="10" fill="#FFFDF5"/>`;
  s += `<circle cx="32" cy="22" r="10.8" fill="#F2EDDC"/>` + head;
  s += face({ y: 22.2, gap: 4.8, eyes, cheekGap: 7.6, cheekY: 25.8, cheek: '#FF8C9E', cheekOp: 0.55, lashes: hat === 'queen', mustache: hat === 'king', eyeInk: '#2F3A46' });
  if (badgeColor) s += badge(suit, badgeColor, 29, 36.5, 0.25);
  if (bowtieColor) s += bowtie(32, 33.4, bowtieColor);
  s += crown(hat, -4.8, jewel);
  return s;
}

const SPECIES = { sloth, bee, mushroom, moth };
function char(kind, opts = {}, size = 64, extra = '') {
  const h = (size * 68) / 64;
  return `<svg ${extra} width="${size}" height="${h.toFixed(1)}" viewBox="${VB}" overflow="visible">${SPECIES[kind](opts)}</svg>`;
}

// ---------- decks ----------
const DECKS = {
  honey: {
    name: 'Bee + Sloth', blurb: 'Bumblebees and sloths', friends: 'honey friends',
    face: '#FFFBF2', border: '#E2D2B6',
    red: 'sloth', black: 'bee',
    suits: {
      hearts: { symbol: '#B5364A', rank: '#A32F42', tint: '#F6D7CF', frame: '#D98A80', ace: ['#EE9A8E', 0.3], note: 'Sloth team, rosy fur' },
      diamonds: { symbol: '#B24E16', rank: '#9E4512', tint: '#F8DFC0', frame: '#DB9A5C', ace: ['#F2B277', 0.3], note: 'Sloth team, golden fur' },
      spades: { symbol: '#2B3A55', rank: '#2B3A55', tint: '#B9C6DC', frame: '#5F7397', ace: ['#B9C6DC', 1], note: 'Bee team, slate stripes' },
      clubs: { symbol: '#264A3E', rank: '#264A3E', tint: '#B5D2BE', frame: '#5A8A70', ace: ['#B5D2BE', 1], note: 'Bee team, pine stripes' },
    },
  },
  wood: {
    name: 'Mushroom + Moth', blurb: 'Toadstools and luna moths', friends: 'forest friends',
    face: '#FCFBF5', border: '#D3D6C3',
    red: 'mushroom', black: 'moth',
    suits: {
      hearts: { symbol: '#B03044', rank: '#A02A3D', tint: '#F6D6D3', frame: '#D9848A', ace: ['#EE939B', 0.3], note: 'Toadstool team, red cap' },
      diamonds: { symbol: '#B04D18', rank: '#9C4413', tint: '#F7DEC3', frame: '#D99862', ace: ['#F0AE78', 0.3], note: 'Toadstool team, amber cap' },
      spades: { symbol: '#2E3664', rank: '#2E3664', tint: '#3A4687', frame: '#A3AEDF', faceInk: '#FFFDF5', ace: ['#3A4687', 1], note: 'Moth team, moonlit blue' },
      clubs: { symbol: '#1F4A33', rank: '#1F4A33', tint: '#2F5E3F', frame: '#8FC79B', faceInk: '#FFFDF5', ace: ['#2F5E3F', 1], note: 'Moth team, luna green' },
    },
  },
};
const RED = (s) => s === 'hearts' || s === 'diamonds';
const RANKS = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

function charFor(deckId, suit, rank, extra = {}) {
  const D = DECKS[deckId], S = D.suits[suit];
  const kind = RED(suit) ? D.red : D.black;
  const o = { suit, ...extra };
  if (rank === 11) { o.bowtieColor = S.symbol; o.eyes = 'open'; }
  if (rank === 12) { o.hat = 'queen'; o.eyes = 'open'; }
  if (rank === 13) { o.hat = 'king'; o.eyes = 'open'; }
  if (rank === 1) { o.badgeColor = S.symbol; o.eyes = 'happy'; }
  return [kind, o];
}

function pipPositions(n) {
  const L = 42, C = 70, R = 98, rows = (a) => a;
  const P = {
    2: [[C, 40], [C, 156]], 3: [[C, 40], [C, 98], [C, 156]],
    4: [[L, 40], [R, 40], [L, 156], [R, 156]], 5: [[L, 40], [R, 40], [C, 98], [L, 156], [R, 156]],
    6: [[L, 40], [R, 40], [L, 98], [R, 98], [L, 156], [R, 156]],
    7: [[L, 40], [R, 40], [C, 69], [L, 98], [R, 98], [L, 156], [R, 156]],
    8: [[L, 40], [R, 40], [C, 69], [L, 98], [R, 98], [C, 127], [L, 156], [R, 156]],
    9: [[L, 40], [R, 40], [L, 79], [R, 79], [C, 98], [L, 117], [R, 117], [L, 156], [R, 156]],
    10: [[L, 40], [R, 40], [C, 60], [L, 79], [R, 79], [L, 117], [R, 117], [C, 136], [L, 156], [R, 156]],
  };
  return rows(P[n]).map(([x, y]) => [x, 34 + ((y - 40) / 116) * 104, y > 98]);
}

function card(deckId, rank, suit, w = 140) {
  const D = DECKS[deckId], S = D.suits[suit];
  const isFace = rank > 10;
  const bg = isFace ? S.tint : D.face;
  const c = id('k');
  let s = `<svg width="${w}" height="${(w * 1.4).toFixed(1)}" viewBox="0 0 140 196"><clipPath id="${c}"><rect x="0" y="0" width="140" height="196" rx="14"/></clipPath>`;
  s += `<rect x=".75" y=".75" width="138.5" height="194.5" rx="13.5" fill="${bg}" stroke="${D.border}" stroke-width="1.5"/>`;
  const label = RANKS[rank] ?? String(rank);
  const ink = isFace && S.faceInk ? S.faceInk : S.rank, sym = isFace && S.faceInk ? S.faceInk : S.symbol;
  const idx = `<text x="${label.length > 1 ? 18 : 17}" y="31" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="22" fill="${ink}">${label}</text><path transform="translate(9.5 36) scale(.625)" d="${SUIT[suit]}" fill="${sym}"/>`;
  s += idx + `<g transform="rotate(180 70 98)">${idx}</g>`;
  const [kind, o] = charFor(deckId, suit, rank);
  if (rank === 1) {
    s += `<path transform="translate(12 40) scale(${116 / 24})" d="${SUIT[suit]}" fill="${S.ace[0]}" opacity="${S.ace[1]}"/>`;
    s += `<g transform="translate(28 ${98 - 44.6})">${char(kind, o, 84)}</g>`;
  } else if (isFace) {
    s += `<rect x="36" y="24" width="68" height="148" rx="10" fill="none" stroke="${S.frame}" stroke-width="1.5"/>`;
    s += `<g transform="translate(41 ${90 - 30.8})">${char(kind, o, 58)}</g>`;
    s += `<path transform="translate(61 121) scale(.75)" d="${SUIT[suit]}" fill="${sym}"/>`;
  } else {
    for (const [x, y, flip] of pipPositions(rank)) s += `<path transform="translate(${x - 9} ${y - 9}) scale(.75)${flip ? ' rotate(180 12 12)' : ''}" d="${SUIT[suit]}" fill="${S.symbol}"/>`;
    s += `<g clip-path="url(#${c})"><g transform="translate(42 ${196 - 0.6 * 59.5})">${char(kind, { suit, eyes: 'open' }, 56)}</g></g>`;
  }
  return s + '</svg>';
}

function playCard(deckId, rank, suit) {
  const D = DECKS[deckId], S = D.suits[suit];
  const bg = rank > 10 ? S.tint : D.face;
  const label = RANKS[rank] ?? String(rank);
  const [kind, o] = charFor(deckId, suit, rank);
  const ink = rank > 10 && S.faceInk ? S.faceInk : S.rank, sym = rank > 10 && S.faceInk ? S.faceInk : S.symbol;
  return `<svg width="52" height="72.8" viewBox="0 0 52 72.8"><rect x=".75" y=".75" width="50.5" height="71.3" rx="7.5" fill="${bg}" stroke="${D.border}" stroke-width="1.5"/>
  <text x="5" y="15" font-family="Fredoka" font-weight="600" font-size="13" fill="${ink}">${label}</text>
  <path transform="translate(${label.length > 1 ? 21 : 14} 5.5) scale(.42)" d="${SUIT[suit]}" fill="${sym}"/>
  <g transform="translate(9 26)">${char(kind, o, 34)}</g></svg>`;
}

// ---------- card backs ----------
function hexPath(cx, cy, r) {
  let d = '';
  for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i + Math.PI / 6; d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)} `; }
  return d + 'Z';
}
function backFrame(bg, border, inner, play, clip) {
  const rx = play ? 8 : 14, inset = play ? 4 : 8, irx = play ? 5 : 9;
  return `<clipPath id="${clip}"><rect width="140" height="196" rx="${rx}"/></clipPath><rect width="140" height="196" rx="${rx}" fill="${bg}"/><g clip-path="url(#${clip})">${inner}</g><rect x="${inset}" y="${inset}" width="${140 - 2 * inset}" height="${196 - 2 * inset}" rx="${irx}" fill="none" stroke="${border}" stroke-width="${play ? 2.4 : 1.5}"/>`;
}
function honeycombBack(w = 140) {
  const play = w < 80, clip = id('h');
  let inner = '';
  const r = play ? 15 : 10.5, dx = r * Math.sqrt(3), dy = r * 1.5;
  for (let row = -1; row * dy < 210; row++) for (let col = -1; col * dx < 160; col++) {
    const cx = col * dx + (row % 2 ? dx / 2 : 0), cy = row * dy;
    const dist = Math.hypot(cx - 70, cy - 98);
    if (dist < (play ? 36 : 40)) continue;
    const filled = !play && ((row * 7 + col * 3) % 11 === 0);
    inner += `<path d="${hexPath(cx, cy, r - 1.4)}" fill="${filled ? '#F2B33D' : 'none'}" fill-opacity="${filled ? 0.75 : 0}" stroke="#F2B33D" stroke-opacity=".38" stroke-width="${play ? 2.2 : 1.4}"/>`;
  }
  const mr = play ? 40 : 34;
  inner += `<path d="${hexPath(70, 98, mr + 4)}" fill="none" stroke="#F2B33D" stroke-width="${play ? 2.4 : 1.4}" opacity=".8"/><path d="${hexPath(70, 98, mr)}" fill="#FFF3D9"/>`;
  const bs = play ? 62 : 52;
  inner += `<g transform="translate(${70 - bs / 2} ${98 - (bs * 68) / 64 / 2 + 1})">${char('bee', { suit: 'spades', eyes: 'sleepy' }, bs)}</g>`;
  return `<svg width="${w}" height="${(w * 1.4).toFixed(1)}" viewBox="0 0 140 196">${backFrame('#6E4A2C', 'rgba(242,179,61,.55)', inner, play, clip)}</svg>`;
}
function moonlitBack(w = 140) {
  const play = w < 80, clip = id('m');
  let inner = `<defs><radialGradient id="${clip}g"><stop offset="0" stop-color="#F4EFD6" stop-opacity=".35"/><stop offset="1" stop-color="#F4EFD6" stop-opacity="0"/></radialGradient></defs>`;
  if (!play) {
    for (const [x, y, r] of [[22, 24, 1.2], [46, 16, 1], [30, 50, 0.9], [118, 66, 1.1], [16, 84, 1], [124, 108, 0.9], [60, 34, 0.8]]) inner += `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF4D6" opacity=".8"/>`;
    inner += `<circle cx="104" cy="34" r="26" fill="url(#${clip}g)"/><circle cx="104" cy="34" r="11" fill="#F4EFD6"/><circle cx="109" cy="30" r="9.5" fill="#173B30"/>`;
  }
  // forest floor
  inner += `<path d="M0 ${play ? 168 : 170} C30 158 60 166 82 160 C104 154 124 160 140 156 L140 196 L0 196 Z" fill="#244C3A"/>`;
  if (!play) {
    inner += `<g transform="translate(14 140)">${char('mushroom', { suit: 'hearts', eyes: 'sleepy', grass: false }, 34)}</g><g transform="translate(96 146)">${char('mushroom', { suit: 'diamonds', eyes: 'sleepy', grass: false }, 28)}</g>`;
    inner += `<path fill="#3F7A55" d="M44 196 Q44 176 50 168 Q54 182 54 196 Z M58 196 Q60 180 66 174 Q66 186 64 196 Z M124 196 Q122 180 130 172 Q134 186 132 196 Z"/>`;
  }
  const ms = play ? 84 : 78;
  inner += `<g transform="translate(${70 - ms / 2} ${(play ? 92 : 90) - (ms * 68) / 64 / 2})">${char('moth', { suit: 'clubs', eyes: 'sleepy' }, ms)}</g>`;
  return `<svg width="${w}" height="${(w * 1.4).toFixed(1)}" viewBox="0 0 140 196">${backFrame('#173B30', 'rgba(220,240,214,.45)', inner, play, clip)}</svg>`;
}
