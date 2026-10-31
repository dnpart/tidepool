// Mockup pieces for the two new games: domino tiles and the marble race board. Needs art.js (and cats.js for cats).

// ---------- Dominoes ----------
// Each number has its own pip color, so matching ends is quick to see (and doesn't rely on counting alone)
const PIP_COLORS = { 1: '#D23F5B', 2: '#E8812F', 3: '#C99A12', 4: '#2E9A6E', 5: '#3B78C4', 6: '#7A5BC4' };
const PIP_SPOTS = {
  0: [], 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};
/** A domino `a | b`. Horizontal tiles are 2:1; `vertical` stands it on end. Size is the short side in px. */
function domino(a, b, { size = 26, vertical = false, glow = false, dim = false, face = '#FFFDF8', edge = '#D9CFBE' } = {}) {
  const W = vertical ? size : size * 2, H = vertical ? size * 2 : size;
  const half = (n, ox, oy) => PIP_SPOTS[n].map(([c, r]) => {
    const [x, y] = vertical ? [c, r] : [r, c];
    return `<circle cx="${ox + size * (0.24 + x * 0.26)}" cy="${oy + size * (0.24 + y * 0.26)}" r="${size * 0.085}" fill="${PIP_COLORS[n]}"/>`;
  }).join('');
  const [bx, by] = vertical ? [0, size] : [size, 0];
  let s = `<svg width="${W + 4}" height="${H + 4}" viewBox="-2 -2 ${W + 4} ${H + 4}" style="opacity:${dim ? 0.5 : 1};overflow:visible">`;
  if (glow) s += `<rect x="-2" y="-2" width="${W + 4}" height="${H + 4}" rx="${size * 0.22 + 2}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;
  s += `<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="${size * 0.2}" fill="${face}" stroke="${edge}" stroke-width="1.5"/>`;
  s += vertical ? `<path d="M${size * 0.18} ${size} H${size * 0.82}" stroke="${edge}" stroke-width="1.4"/>` : `<path d="M${size} ${size * 0.18} V${size * 0.82}" stroke="${edge}" stroke-width="1.4"/>`;
  s += half(a, 0, 0) + half(b, bx, by);
  return s + '</svg>';
}
/** A face-down domino in the deck's back color, with a little sparkle. */
function dominoBack({ size = 14, vertical = true, color = '#123B45' } = {}) {
  const W = vertical ? size : size * 2, H = vertical ? size * 2 : size;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="${size * 0.22}" fill="${color}" stroke="rgba(255,255,255,.35)"/><path d="M${W / 2} ${H / 2 - 3} l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 Z" fill="#FFF1C2" opacity=".8"/></svg>`;
}

// ---------- Marble race ----------
const MARBLE = { you: ['#E0607E', '#F7A1B4'], a: ['#3B78C4', '#8DB7EA'], b: ['#E8A317', '#F8D47A'] };
function marble(cx, cy, r, who, extra = '') {
  const [c, l] = MARBLE[who];
  return `<g ${extra}><circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/><circle cx="${cx - r * 0.3}" cy="${cy - r * 0.32}" r="${r * 0.36}" fill="${l}" opacity=".9"/><circle cx="${cx - r * 0.38}" cy="${cy - r * 0.4}" r="${r * 0.13}" fill="#FFF"/></g>`;
}
function die(n, size = 64, color = '#FFFDF8', pip = '#2B3350') {
  const spots = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n];
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64"><rect x="3" y="3" width="58" height="58" rx="14" fill="${color}" stroke="#D9CFBE" stroke-width="2"/>${spots.map(([c, r]) => `<circle cx="${16 + c * 16}" cy="${16 + r * 16}" r="5.4" fill="${pip}"/>`).join('')}</svg>`;
}
