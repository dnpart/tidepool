// New card backs: every deck gets one per palette. Coordinates on the 140×196 reference card, like the existing backs.
const at = (svgInner, x, y, size) => `<svg x="${x}" y="${y}" width="${size}" height="${(size * 68) / 64}" viewBox="0 -8 64 68" overflow="visible">${svgInner}</svg>`;
const sp = (kind, o) => SPECIES[kind](o);
// Place a character `size` wide centered on cx with its art's bottom (y 60 in the viewBox) on `bottom`
const standOn = (inner, cx, bottom, size) => at(inner, cx - size / 2, bottom - (68 * size) / 64, size);
const centerOn = (inner, cx, cy, size) => at(inner, cx - size / 2, cy - (34 * size) / 64, size);

function stars(list, color = '#FFF4D6', op = 0.8) { return list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${op}"/>`).join(''); }
function crystalAt(cx, cy, size, color, sw = 1.8) {
  const k = size / 24;
  return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${k})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1.5 V22.5 M2.9 6.75 L21.1 17.25 M2.9 17.25 L21.1 6.75"/><path d="M9.5 3.8 L12 6 L14.5 3.8 M9.5 20.2 L12 18 L14.5 20.2 M3.6 10 L6.8 10.5 L5.8 7.4 M18.2 16.6 L17.2 13.5 L20.4 14 M3.6 14 L6.8 13.5 L5.8 16.6 M18.2 7.4 L17.2 10.5 L20.4 10"/></g>`;
}
function leaf(x, y, rot, s, c) { return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 -7 C5 -4 5 4 0 8 C-5 4 -5 -4 0 -7 Z" fill="${c}"/><path d="M0 -6 L0 7" stroke="${shade(c, 0.78)}" stroke-width=".9"/></g>`; }
function flower(x, y, r, petal, mid = '#F7C948') {
  let s = '';
  for (let i = 0; i < 5; i++) { const a = (i * 72 - 90) * Math.PI / 180; s += `<circle cx="${(x + Math.cos(a) * r * 0.62).toFixed(2)}" cy="${(y + Math.sin(a) * r * 0.62).toFixed(2)}" r="${(r * 0.48).toFixed(2)}" fill="${petal}"/>`; }
  return s + `<circle cx="${x}" cy="${y}" r="${r * 0.36}" fill="${mid}"/>`;
}
function tinyShroom(x, base, s, cap, stem = '#F9D59F') {
  return `<g transform="translate(${x} ${base}) scale(${s})"><path d="M-3.4 -9 C-3.8 -5 -4 -2 -4 0 L4 0 C4 -2 3.8 -5 3.4 -9 Z" fill="${stem}"/><path d="M-8 -8 C-8 -14 -4.5 -17 0 -17 C4.5 -17 8 -14 8 -8 C8 -7 7 -6.6 6 -7.2 C3 -8.4 -3 -8.4 -6 -7.2 C-7 -6.6 -8 -7 -8 -8 Z" fill="${cap}"/><circle cx="-3.6" cy="-12" r="1.3" fill="#FFF6E3"/><circle cx="2" cy="-14" r="1.1" fill="#FFF6E3"/><circle cx="4.4" cy="-10.2" r="1" fill="#FFF6E3"/></g>`;
}
const EX = (key) => (typeof EXISTING !== 'undefined' ? EXISTING[key] : '');

const NEW_BACKS = {
  // ---------- Bee + Sloth ----------
  lazyLagoon: { name: 'Lazy lagoon', deck: 'honey', palette: 'lagoon', bg: '#123B45', border: 'rgba(255,241,194,.45)', draw(play) {
    let s = '';
    if (!play) s += stars([[22, 22, 1.2], [112, 18, 1.3], [64, 28, 1], [124, 52, 1.1], [16, 60, 1]]);
    s += `<rect x="0" y="${play ? 150 : 152}" width="140" height="60" fill="#0E2F38"/>`;
    s += `<path d="M24 ${play ? 166 : 166} h22 M88 ${play ? 172 : 174} h30 M40 184 h40" stroke="#5FC4BA" stroke-width="${play ? 3 : 1.6}" stroke-linecap="round" opacity=".55"/>`;
    // branch across the card with leaves hanging off it
    const by = play ? 118 : 116;
    s += `<path d="M-6 ${by + 6} C30 ${by - 2} 100 ${by + 4} 146 ${by - 6}" stroke="#8A5A3A" stroke-width="${play ? 9 : 7}" stroke-linecap="round" fill="none"/>`;
    if (!play) s += leaf(20, by + 12, 20, 1.3, '#5FC4A0') + leaf(116, by + 6, -24, 1.4, '#4FA98A') + leaf(126, by + 2, 30, 1.1, '#5FC4A0');
    s += standOn(sp('sloth', { suit: 'diamonds', eyes: 'sleepy' }), 70, by + 4, play ? 84 : 70);
    return s;
  } },
  beeGarden: { name: 'Bee garden', deck: 'honey', palette: 'coral', bg: '#7E2A45', border: 'rgba(255,226,214,.5)', draw(play) {
    let s = '';
    const fl = play ? [[26, 40, 16, '#FFC2B0'], [114, 160, 16, '#F4A6BE']]
      : [[26, 34, 9, '#FFC2B0'], [112, 28, 7, '#F4A6BE'], [118, 76, 8, '#FFC2B0'], [20, 120, 8, '#F4A6BE'], [30, 166, 9, '#FFC2B0'], [110, 162, 10, '#F4A6BE'], [70, 176, 6, '#FFC2B0']];
    for (const [x, y, r, c] of fl) s += flower(x, y, r, c);
    if (!play) s += `<path d="M34 46 C52 66 34 80 54 90 M106 40 C92 54 110 66 92 78" fill="none" stroke="#FFE2D6" stroke-width="1.4" stroke-dasharray="2 3.4" stroke-linecap="round" opacity=".75"/>`;
    s += centerOn(sp('bee', { suit: 'spades', eyes: 'happy' }), 70, play ? 98 : 104, play ? 74 : 62);
    return s;
  } },
  snugHive: { name: 'Snug hive', deck: 'honey', palette: 'winter', bg: '#1F4775', border: 'rgba(220,235,250,.55)', draw(play) {
    let s = '';
    if (!play) for (const [x, y] of [[26, 28], [70, 22], [114, 30], [20, 72], [120, 76]]) s += crystalAt(x, y, 15, '#DCEBFA', 1.8);
    else s += crystalAt(70, 32, 22, '#DCEBFA', 2.4);
    if (!play) s += stars([[46, 46, 1.4], [96, 48, 1.4], [40, 100, 1.2], [104, 104, 1.2]], '#DCEBFA', 0.7);
    // snowy ground
    s += `<path d="M0 166 C40 156 100 158 140 164 L140 196 L0 196 Z" fill="#DCEBFA"/>`;
    // straw skep: stacked rounded bands
    const cx = 70, base = 166, w = play ? 92 : 78, h = play ? 88 : 76;
    const bands = 5;
    for (let i = 0; i < bands; i++) {
      const t0 = i / bands, t1 = (i + 1) / bands;
      const y0 = base - h * t1, y1 = base - h * t0;
      const hw = (w / 2) * Math.sqrt(1 - Math.pow(t0 * 0.92, 2)), hw1 = (w / 2) * Math.sqrt(1 - Math.pow(t1 * 0.92, 2));
      s += `<path d="M${cx - hw} ${y1} C${cx - hw} ${y0 + 2} ${cx - hw1} ${y0} ${cx} ${y0} C${cx + hw1} ${y0} ${cx + hw} ${y0 + 2} ${cx + hw} ${y1} Z" fill="${i % 2 ? '#D9A55A' : '#E6B66A'}" stroke="#B9843E" stroke-width="1.2"/>`;
    }
    // snow cap on top
    s += `<path d="M${cx - w * 0.3} ${base - h * 0.86} C${cx - w * 0.2} ${base - h - 6} ${cx + w * 0.2} ${base - h - 6} ${cx + w * 0.3} ${base - h * 0.86} C${cx + w * 0.18} ${base - h * 0.8} ${cx + w * 0.1} ${base - h * 0.9} ${cx} ${base - h * 0.84} C${cx - w * 0.12} ${base - h * 0.9} ${cx - w * 0.2} ${base - h * 0.8} ${cx - w * 0.3} ${base - h * 0.86} Z" fill="#F5F8FC"/>`;
    // round door with a sleepy bee peeking out
    const dr = play ? 21 : 18;
    s += `<circle cx="${cx}" cy="${base - dr + 2}" r="${dr}" fill="#5A3A1E"/>`;
    s += `<clipPath id="hivedoor${play ? 'p' : 'f'}"><circle cx="${cx}" cy="${base - dr + 2}" r="${dr}"/></clipPath>`;
    s += `<g clip-path="url(#hivedoor${play ? 'p' : 'f'})">${standOn(sp('bee', { suit: 'clubs', eyes: 'sleepy' }), cx, base + dr * 1.25, dr * 2.3)}</g>`;
    return s;
  } },
  honeycomb: { name: 'Honeycomb', deck: 'honey', palette: 'honey', bg: '#6E4A2C', border: 'rgba(242,179,61,.55)', draw(play) {
    let s = '';
    const r = play ? 15 : 10.5, dx = r * Math.sqrt(3), dy = r * 1.5;
    for (let row = -1; row * dy < 210; row++) for (let col = -1; col * dx < 160; col++) {
      const cx = col * dx + (row % 2 ? dx / 2 : 0), cy = row * dy;
      if (Math.hypot(cx - 70, cy - 98) < (play ? 36 : 40)) continue;
      const filled = !play && ((row * 7 + col * 3) % 11 === 0);
      s += `<path d="${hexPath(cx, cy, r - 1.4)}" fill="${filled ? '#F2B33D' : 'none'}" fill-opacity="${filled ? 0.75 : 0}" stroke="#F2B33D" stroke-opacity=".38" stroke-width="${play ? 2.2 : 1.4}"/>`;
    }
    const mr = play ? 40 : 34;
    s += `<path d="${hexPath(70, 98, mr + 4)}" fill="none" stroke="#F2B33D" stroke-width="${play ? 2.4 : 1.4}" opacity=".8"/><path d="${hexPath(70, 98, mr)}" fill="#FFF3D9"/>`;
    s += centerOn(sp('bee', { suit: 'spades', eyes: 'sleepy' }), 70, 98, play ? 62 : 52);
    return s;
  } },
  canopy: { name: 'Canopy', deck: 'honey', palette: 'forest', bg: '#1C4232', border: 'rgba(220,240,214,.45)', draw(play) {
    let s = '';
    // hanging vines with leaves; the sloth holds one with its raised arm
    const vines = play ? [[30, 0, 90], [110, 0, 70]] : [[16, 0, 120], [34, 0, 64], [112, 0, 96], [128, 0, 140]];
    for (const [x, y, len] of vines) {
      s += `<path d="M${x} ${y} C${x + 6} ${len * 0.35} ${x - 6} ${len * 0.7} ${x} ${len}" stroke="#3F7A55" stroke-width="${play ? 3.2 : 1.8}" fill="none"/>`;
      for (let t = 0.2; t < 1; t += play ? 0.4 : 0.22) s += leaf(x + (t * 10 % 2 ? 4 : -4), len * t, t * 10 % 2 ? 40 : -40, play ? 1.5 : 1, t * 10 % 2 ? '#5E9C6B' : '#4C8A5C');
    }
    // the sloth hangs from a vine coming down to its raised claw
    const size = play ? 86 : 74, x0 = 70 - size / 2, y0 = (play ? 104 : 100) - (34 * size) / 64;
    const k = size / 64, clawX = x0 + 55 * k, clawY = y0 + (14 + 8) * k;
    s += `<path d="M${clawX + 2} 0 C${clawX + 6} ${clawY * 0.4} ${clawX - 2} ${clawY * 0.7} ${clawX} ${clawY}" stroke="#3F7A55" stroke-width="${play ? 3.4 : 2.4}" fill="none"/>`;
    s += at(sp('sloth', { suit: 'hearts', eyes: 'sleepy', wave: true }), x0, y0, size);
    if (!play) s += leaf(clawX + 5, clawY * 0.5, 30, 1.3, '#5E9C6B') + leaf(40, 170, -20, 1.4, '#C9A464') + leaf(102, 178, 34, 1.2, '#C7835A');
    return s;
  } },

  // ---------- Mushroom + Moth ----------
  lilyPond: { name: 'Lily pond', deck: 'wood', palette: 'lagoon', bg: '#0F2E3A', border: 'rgba(220,240,230,.45)', draw(play) {
    let s = '';
    if (!play) s += stars([[20, 20, 1.2], [56, 30, 1], [118, 22, 1.3], [96, 44, 1], [24, 66, 1]]);
    s += `<rect x="0" y="${play ? 138 : 132}" width="140" height="70" fill="#123F4A"/>`;
    s += `<ellipse cx="70" cy="${play ? 156 : 150}" rx="${play ? 30 : 24}" ry="${play ? 5 : 4}" fill="none" stroke="#5FC4BA" stroke-width="${play ? 2.6 : 1.4}" opacity=".6"/>`;
    if (!play) s += `<ellipse cx="70" cy="150" rx="40" ry="7" fill="none" stroke="#5FC4BA" stroke-width="1" opacity=".35"/>`;
    const pads = play ? [[24, 176, 18], [118, 170, 15]] : [[22, 168, 13], [108, 160, 11], [120, 182, 14], [46, 186, 9]];
    for (const [x, y, r] of pads) s += `<path d="M${x} ${y} L${x + r} ${y - r * 0.12} A${r} ${r * 0.42} 0 1 1 ${x + r * 0.9} ${y + r * 0.2} Z" fill="#3E8F78"/>`;
    if (!play) s += flower(108, 156, 6, '#F4A6BE', '#F7C948') + flower(28, 164, 5, '#FFC2B0', '#F7C948');
    s += centerOn(sp('moth', { suit: 'spades', eyes: 'sleepy' }), 70, play ? 86 : 90, play ? 90 : 78);
    return s;
  } },
  fairyRing: { name: 'Fairy ring', deck: 'wood', palette: 'coral', bg: '#7C2842', border: 'rgba(255,226,214,.5)', draw(play) {
    let s = '';
    const n = play ? 6 : 10, rx = play ? 50 : 48, ry = play ? 70 : 66;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      s += tinyShroom(70 + Math.cos(a) * rx, 104 + Math.sin(a) * ry, play ? 1.4 : 1, i % 2 ? '#F29A8A' : '#FFC2B0');
    }
    if (!play) s += stars([[34, 50, 1.4], [106, 50, 1.4], [30, 148, 1.2], [110, 148, 1.2], [70, 22, 1.2]], '#FFE2D6', 0.8);
    s += centerOn(sp('mushroom', { suit: 'hearts', eyes: 'happy', grass: false }), 70, 96, play ? 66 : 58);
    return s;
  } },
  frostedToadstools: { name: 'Frosted toadstools', deck: 'wood', palette: 'winter', bg: '#1F4775', border: 'rgba(220,235,250,.55)', draw(play) {
    let s = '';
    if (!play) for (const [x, y] of [[24, 28], [70, 20], [116, 30], [30, 76], [112, 84]]) s += crystalAt(x, y, 15, '#DCEBFA', 1.8);
    else s += crystalAt(30, 34, 22, '#DCEBFA', 2.4) + crystalAt(110, 40, 18, '#DCEBFA', 2.4);
    s += `<path d="M0 162 C40 150 100 152 140 160 L140 196 L0 196 Z" fill="#DCEBFA"/>`;
    const snowCap = (x, y, size) => { const k = size / 64; return `<path transform="translate(${x} ${y + 8 * k}) scale(${k})" d="M14 12 C20 4 44 4 50 12 C46 14 42 11 38 14 C34 11 30 14 26 12 C22 15 18 12 14 12 Z" fill="#F5F8FC"/>`; };
    if (!play) {
      const sx = 104, sz = 34;
      s += standOn(sp('mushroom', { suit: 'diamonds', eyes: 'sleepy', grass: false }), sx, 166, sz) + snowCap(sx - sz / 2, 166 - (68 * sz) / 64, sz);
    }
    const size = play ? 82 : 70, cx = play ? 70 : 60;
    s += standOn(sp('mushroom', { suit: 'hearts', eyes: 'sleepy', grass: false }), cx, 168, size) + snowCap(cx - size / 2, 168 - (68 * size) / 64, size);
    return s;
  } },
  lamplight: { name: 'Lamplight', deck: 'wood', palette: 'honey', bg: '#4A3322', border: 'rgba(242,179,61,.5)', draw(play) {
    let s = `<defs><radialGradient id="glow${play ? 'p' : 'f'}"><stop offset="0" stop-color="#F6C35A" stop-opacity=".55"/><stop offset=".6" stop-color="#F6C35A" stop-opacity=".12"/><stop offset="1" stop-color="#F6C35A" stop-opacity="0"/></radialGradient></defs>`;
    const ly = play ? 60 : 56;
    s += `<circle cx="70" cy="${ly}" r="${play ? 60 : 52}" fill="url(#glow${play ? 'p' : 'f'})"/>`;
    // hanging lantern
    s += `<path d="M70 0 V${ly - 18}" stroke="#2E2015" stroke-width="${play ? 2.6 : 1.4}"/>`;
    s += `<path d="M62 ${ly - 18} h16 l-2 -3 h-12 Z" fill="#2E2015"/><rect x="61" y="${ly - 18}" width="18" height="26" rx="4" fill="#FFE2A0" stroke="#2E2015" stroke-width="${play ? 2.6 : 1.6}"/><path d="M70 ${ly - 13} C66 ${ly - 6} 74 ${ly - 6} 70 ${ly - 13} Z" fill="#F2B33D"/><path d="M62 ${ly + 8} h16 l-2 3 h-12 Z" fill="#2E2015"/>`;
    if (!play) s += stars([[40, 40, 1], [104, 34, 1.2], [96, 76, 1], [30, 84, 1.1], [120, 100, 1]], '#F6C35A', 0.8);
    s += centerOn(sp('moth', { suit: 'clubs', eyes: 'open' }), 70, play ? 130 : 128, play ? 82 : 72);
    if (!play) s += `<path d="M0 180 C40 172 100 174 140 178 L140 196 L0 196 Z" fill="#3A281A"/>` + tinyShroom(24, 184, 1, '#DE8650') + tinyShroom(116, 182, 0.9, '#D9505E');
    return s;
  } },
  moonlitGlade: { name: 'Moonlit glade', deck: 'wood', palette: 'forest', bg: '#173B30', border: 'rgba(220,240,214,.45)', draw(play) {
    let s = '';
    if (!play) {
      s += stars([[22, 24, 1.2], [46, 16, 1], [30, 50, 0.9], [118, 66, 1.1], [16, 84, 1], [124, 108, 0.9], [60, 34, 0.8]]);
      s += `<circle cx="104" cy="34" r="11" fill="#F4EFD6"/><circle cx="109" cy="30" r="9.5" fill="#173B30"/>`;
    } else s += `<circle cx="108" cy="30" r="12" fill="#F4EFD6"/><circle cx="113" cy="26" r="10.5" fill="#173B30"/>`;
    s += `<path d="M0 170 C30 158 60 166 82 160 C104 154 124 160 140 156 L140 196 L0 196 Z" fill="#244C3A"/>`;
    if (!play) {
      s += standOn(sp('mushroom', { suit: 'hearts', eyes: 'sleepy', grass: false }), 31, 176, 34) + standOn(sp('mushroom', { suit: 'diamonds', eyes: 'sleepy', grass: false }), 110, 174, 28);
      s += `<path fill="#3F7A55" d="M44 196 Q44 176 50 168 Q54 182 54 196 Z M58 196 Q60 180 66 174 Q66 186 64 196 Z M124 196 Q122 180 130 172 Q134 186 132 196 Z"/>`;
    }
    s += centerOn(sp('moth', { suit: 'clubs', eyes: 'sleepy' }), 70, play ? 100 : 92, play ? 96 : 78);
    return s;
  } },

  // ---------- Octo + Manta in the new palettes ----------
  sandyShallows: { name: 'Sandy shallows', deck: 'sea', palette: 'honey', bg: '#7A5634', border: 'rgba(255,233,204,.5)', draw(play) {
    let s = '';
    if (!play) for (let y = 30; y < 196; y += 22) s += `<path d="M-4 ${y} C20 ${y - 6} 40 ${y + 6} 70 ${y} C100 ${y - 6} 120 ${y + 6} 144 ${y}" fill="none" stroke="#E8C98F" stroke-width="1.4" opacity=".3"/>`;
    const star = (x, y, r, rot) => { let d = ''; for (let i = 0; i < 10; i++) { const a = (i * 36 + rot - 90) * Math.PI / 180, rr = i % 2 ? r * 0.45 : r; d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(2)} ${(y + Math.sin(a) * rr).toFixed(2)} `; } return `<path d="${d}Z" fill="#F2B33D" stroke="#F2B33D" stroke-width="${r * 0.25}" stroke-linejoin="round"/>`; };
    const shell = (x, y, r, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 ${r * 0.5} L${-r} ${-r * 0.3} C${-r * 0.8} ${-r} ${r * 0.8} ${-r} ${r} ${-r * 0.3} Z" fill="#FFE2D6"/><path d="M0 ${r * 0.5} L${-r * 0.5} ${-r * 0.75} M0 ${r * 0.5} L0 ${-r * 0.85} M0 ${r * 0.5} L${r * 0.5} ${-r * 0.75}" stroke="#E7B7A3" stroke-width="${r * 0.14}"/></g>`;
    if (play) s += star(28, 160, 12, 10) + shell(112, 40, 10, 15);
    else s += star(26, 34, 8, 10) + star(116, 164, 9, -8) + shell(112, 36, 7, 15) + shell(26, 160, 6, -20) + shell(70, 176, 5, 0) + `<circle cx="104" cy="70" r="2" fill="none" stroke="#FFE9CC" stroke-width="1" opacity=".8"/><circle cx="110" cy="62" r="1.3" fill="none" stroke="#FFE9CC" stroke-width="1" opacity=".8"/>`;
    s += centerOn(EX('octoHappyPeach') || EX('octoHappy'), 70, 98, play ? 84 : 76);
    return s;
  } },
  kelpForest: { name: 'Kelp forest', deck: 'sea', palette: 'forest', bg: '#123A2E', border: 'rgba(220,240,214,.45)', draw(play) {
    let s = '';
    const kelp = play ? [[22, 196, 120, '#3F7A55'], [118, 196, 100, '#5E9C6B']] : [[14, 196, 150, '#3F7A55'], [30, 196, 96, '#5E9C6B'], [110, 196, 110, '#3F7A55'], [128, 196, 160, '#5E9C6B']];
    for (const [x, b, h, c] of kelp) {
      s += `<path d="M${x} ${b} C${x - 8} ${b - h * 0.3} ${x + 8} ${b - h * 0.6} ${x} ${b - h}" stroke="${c}" stroke-width="${play ? 5 : 3}" fill="none" stroke-linecap="round"/>`;
      for (let t = 0.25; t < 1; t += play ? 0.35 : 0.2) s += leaf(x + (Math.round(t * 10) % 2 ? 5 : -5), b - h * t, Math.round(t * 10) % 2 ? 50 : -50, play ? 1.6 : 1.1, c);
    }
    if (!play) s += `<g fill="none" stroke="#DCF0D6" stroke-width="1.1" opacity=".7"><circle cx="58" cy="40" r="3"/><circle cx="66" cy="28" r="2"/><circle cx="84" cy="150" r="2.4"/><circle cx="90" cy="162" r="1.6"/></g>`;
    s += centerOn(EX('manta'), 70, play ? 94 : 92, play ? 92 : 82);
    return s;
  } },

  // ---------- Fox + Owl in the new palettes ----------
  cozyDen: { name: 'Cozy den', deck: 'arctic', palette: 'honey', bg: '#5A3E28', border: 'rgba(255,233,204,.5)', draw(play) {
    let s = '';
    if (!play) s += leaf(24, 30, 30, 1.3, '#C7835A') + leaf(114, 26, -40, 1.2, '#D8B56E') + leaf(120, 62, 20, 1.1, '#C9A464') + leaf(20, 70, -25, 1.1, '#D8B56E') + leaf(30, 176, 60, 1.2, '#C9A464') + leaf(112, 174, -50, 1.3, '#C7835A');
    // den: a dark rounded opening with a warm rim, the sleepy fox curled inside
    const rx = play ? 52 : 46, ry = play ? 54 : 48, cy = play ? 112 : 108;
    s += `<ellipse cx="70" cy="${cy}" rx="${rx + 6}" ry="${ry + 6}" fill="#8A6440"/><ellipse cx="70" cy="${cy}" rx="${rx}" ry="${ry}" fill="#3A281A"/>`;
    s += `<ellipse cx="70" cy="${cy + ry * 0.62}" rx="${rx * 0.8}" ry="${ry * 0.2}" fill="#4A3322"/>`;
    s += standOn(EX('foxSleepy'), 70, cy + ry * 0.66, play ? 82 : 70);
    return s;
  } },
  pineNight: { name: 'Pine night', deck: 'arctic', palette: 'forest', bg: '#12301F', border: 'rgba(220,240,214,.45)', draw(play) {
    let s = '';
    if (!play) s += stars([[20, 20, 1.2], [52, 30, 1], [120, 54, 1.1], [16, 64, 1], [64, 14, 1]]);
    s += `<circle cx="${play ? 104 : 106}" cy="${play ? 30 : 30}" r="${play ? 13 : 11}" fill="#F4EFD6"/>`;
    const pine = (x, base, h, c) => `<path d="M${x} ${base - h} L${x - h * 0.32} ${base - h * 0.55} L${x - h * 0.16} ${base - h * 0.55} L${x - h * 0.42} ${base - h * 0.2} L${x - h * 0.2} ${base - h * 0.2} L${x - h * 0.5} ${base} L${x + h * 0.5} ${base} L${x + h * 0.2} ${base - h * 0.2} L${x + h * 0.42} ${base - h * 0.2} L${x + h * 0.16} ${base - h * 0.55} L${x + h * 0.32} ${base - h * 0.55} Z" fill="${c}"/>`;
    if (play) s += pine(22, 200, 70, '#2A5C40') + pine(120, 200, 60, '#1E4A32');
    else s += pine(18, 200, 74, '#1E4A32') + pine(42, 200, 52, '#2A5C40') + pine(104, 200, 58, '#2A5C40') + pine(126, 200, 80, '#1E4A32');
    // branch with the owl perched on it
    const by = play ? 128 : 124;
    s += `<path d="M150 ${by - 4} C110 ${by + 2} 60 ${by} 24 ${by + 8}" stroke="#6B4A2E" stroke-width="${play ? 8 : 6}" stroke-linecap="round" fill="none"/>`;
    s += standOn(EX('owlSpades'), 70, by + 2, play ? 76 : 66);
    return s;
  } },
};

function newBack(key, w = 140) {
  const B = NEW_BACKS[key], play = w < 80, clip = id('nb');
  return `<svg width="${w}" height="${(w * 1.4).toFixed(1)}" viewBox="0 0 140 196">${backFrame(B.bg, B.border, B.draw(play), play, clip)}</svg>`;
}
