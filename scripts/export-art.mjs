// Gathers every drawn asset from the hidden #/art page into one SVG for Illustrator:
// design/art-export/tidepool-art.svg, plus manifest.json saying where each piece sits and where it lives in the code.
//
//   npm run build && npx vite preview --port 4173 &
//   node scripts/export-art.mjs                       (every file the owner hasn't redrawn)
//   node scripts/export-art.mjs --only 09-pond-hop-ponds.svg   (just that one)
//
// The page is opened once per deck (game icons follow the deck). Each piece's SVG is copied with the colors the
// browser actually used written onto every shape (CSS variables and classes resolved), nested <svg>s turned into
// groups with the same placement and clipping, and ids made unique, so Illustrator shows it exactly as the app does.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

// Playwright comes with the cloud sessions' Chromium; require() finds it where an import would not
const { chromium } = createRequire(import.meta.url)('playwright');

const URL = process.env.ART_URL ?? 'http://localhost:4173/tidepool/#/art';
const OUT = new globalThis.URL('../design/art-export/', import.meta.url);
const DECKS = ['sea', 'arctic', 'honey', 'woodland', 'cats'];

/** Runs in the page: every [data-art] figure as { section, group, name, note, source, scale, vb, size, markup }. */
function collect() {
  const SHAPE_PROPS = [
    'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin',
    'stroke-dasharray', 'stroke-dashoffset', 'stroke-miterlimit', 'opacity',
  ];
  const TEXT_PROPS = ['font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline', 'letter-spacing'];
  const SKIP_ATTRS = /^(class|style|role|tabindex|focusable|data-.*|aria-.*|on.*)$/;
  const DEFAULTS = {
    'fill-opacity': '1', 'stroke-opacity': '1', opacity: '1', 'stroke-dasharray': 'none', 'stroke-dashoffset': '0px',
    'stroke-miterlimit': '4', 'fill-rule': 'nonzero', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter',
    'letter-spacing': 'normal', 'dominant-baseline': 'auto', 'text-anchor': 'start',
  };
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const escText = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let clipCount = 0;
  /** "rgb(…)" / "rgba(…)" as [hex, alpha]; anything else (none, url(#…)) unchanged with alpha 1. */
  const hex = (v) => {
    const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(v.trim());
    if (!m) return [v, 1];
    const h = [m[1], m[2], m[3]].map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('').toUpperCase();
    return [`#${h}`, m[4] === undefined ? 1 : Number(m[4])];
  };
  /** Writes fill / stroke / stop-color as hex, folding any alpha into the matching opacity (Illustrator reads rgba as black). */
  const setColor = (attrs, prop, value, opacityProp, cs) => {
    const [c, a] = hex(value);
    attrs[prop] = c;
    if (a < 1) {
      const base = cs ? parseFloat(cs.getPropertyValue(opacityProp)) || 1 : 1;
      attrs[opacityProp] = +(base * a).toFixed(3);
    }
  };

  function piece(fig, prefix) {
    const root = fig.querySelector('svg');
    const rename = (v) => v.replace(/url\(["']?#([^"')]+)["']?\)/g, (_, id) => `url(#${prefix}${id})`);
    const num = (el, a, d = 0) => (el.hasAttribute(a) ? parseFloat(el.getAttribute(a)) : d);

    /** A nested <svg>: a group placing its viewBox into its box, clipped to the box like the browser does. */
    function nestedSvg(el, inner) {
      const x = num(el, 'x'), y = num(el, 'y');
      const w = num(el, 'width', 0) || el.getBBox().width, h = num(el, 'height', 0) || el.getBBox().height;
      const vb = el.viewBox.baseVal;
      if (!vb || !vb.width) return `<g transform="translate(${x} ${y})">${inner}</g>`;
      const par = el.getAttribute('preserveAspectRatio') ?? 'xMidYMid meet';
      let sx = w / vb.width, sy = h / vb.height, tx = x, ty = y;
      if (par !== 'none') {
        const s = par.includes('slice') ? Math.max(sx, sy) : Math.min(sx, sy);
        const align = par.split(' ')[0];
        const ax = align.includes('xMid') ? 0.5 : align.includes('xMax') ? 1 : 0;
        const ay = align.includes('YMid') ? 0.5 : align.includes('YMax') ? 1 : 0;
        tx += (w - vb.width * s) * ax;
        ty += (h - vb.height * s) * ay;
        sx = sy = s;
      }
      const clip = `${prefix}clip${clipCount++}`;
      return `<clipPath id="${clip}"><rect x="${vb.x}" y="${vb.y}" width="${vb.width}" height="${vb.height}"/></clipPath>`
        + `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy}) translate(${-vb.x} ${-vb.y})"><g clip-path="url(#${clip})">${inner}</g></g>`;
    }

    function walk(el, inDefs) {
      if (el.nodeType === 3) return el.parentElement?.closest('text') ? escText(el.textContent) : '';
      if (el.nodeType !== 1) return '';
      const tag = el.tagName;
      if (['animate', 'animateTransform', 'set', 'title', 'desc', 'foreignObject', 'script', 'style'].includes(tag)) return '';
      const cs = getComputedStyle(el);
      const defsLike = inDefs || ['defs', 'clipPath', 'mask', 'linearGradient', 'radialGradient', 'pattern', 'filter', 'symbol', 'marker'].includes(tag);
      if (!defsLike && (cs.display === 'none' || cs.visibility === 'hidden')) return '';
      const kids = [...el.childNodes].map((c) => walk(c, defsLike)).join('');
      if (tag === 'svg' && el !== root) return nestedSvg(el, kids);
      if (tag === 'svg') return kids;
      const attrs = {};
      for (const a of el.attributes) {
        if (SKIP_ATTRS.test(a.name)) continue;
        let v = a.value;
        if (a.name === 'id') v = prefix + v;
        else if (a.name === 'href' || a.name === 'xlink:href') v = v.startsWith('#') ? `#${prefix}${v.slice(1)}` : v;
        else v = rename(v);
        attrs[a.name] = v;
      }
      // Attributes written with CSS variables (stroke="var(--accent)") take the value the browser worked out
      for (const [k, v] of Object.entries(attrs)) {
        if (!v.includes('var(')) continue;
        const cv = cs.getPropertyValue(k);
        delete attrs[k];
        if (cv && (k === 'fill' || k === 'stroke' || k === 'stop-color')) setColor(attrs, k, rename(cv), k === 'stop-color' ? 'stop-opacity' : `${k}-opacity`, null);
        else if (cv) attrs[k] = rename(cv);
      }
      // A CSS transform (style or class) wins over the attribute; write it out as a matrix around its origin
      if (el.getAttribute('style')?.includes('transform') && cs.transform && cs.transform !== 'none') {
        const [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);
        attrs.transform = `translate(${ox || 0} ${oy || 0}) ${cs.transform} translate(${-(ox || 0)} ${-(oy || 0)})`;
      }
      const shape = ['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'text', 'tspan', 'use'].includes(tag);
      if (shape && !defsLike) {
        for (const p of SHAPE_PROPS) {
          const v = cs.getPropertyValue(p);
          if (!v || DEFAULTS[p] === v || ((p === 'fill-opacity' || p === 'stroke-opacity') && attrs[p] !== undefined)) continue;
          if (p === 'fill' || p === 'stroke') setColor(attrs, p, rename(v), `${p}-opacity`, cs);
          else attrs[p] = p === 'stroke-width' || p === 'stroke-dashoffset' ? parseFloat(v) : rename(v.replace(/px/g, ''));
        }
        if (tag === 'text' || tag === 'tspan') for (const p of TEXT_PROPS) {
          const v = cs.getPropertyValue(p);
          if (v && DEFAULTS[p] !== v) attrs[p] = p === 'font-size' ? parseFloat(v) : v;
        }
      } else if (shape || tag === 'stop') {
        // inside defs (clip paths, gradients): only what decides the look
        if (tag === 'stop') {
          setColor(attrs, 'stop-color', cs.getPropertyValue('stop-color'), 'stop-opacity', cs);
          const so = cs.getPropertyValue('stop-opacity');
          if (attrs['stop-opacity'] === undefined && so && so !== '1') attrs['stop-opacity'] = so;
        } else {
          for (const p of ['fill', 'stroke', 'stroke-width', 'opacity', 'fill-rule']) {
            const v = cs.getPropertyValue(p);
            if (!v || DEFAULTS[p] === v || (p === 'stroke' && v === 'none')) continue;
            if (p === 'fill' || p === 'stroke') setColor(attrs, p, rename(v), `${p}-opacity`, cs);
            else attrs[p] = p === 'stroke-width' ? parseFloat(v) : rename(v);
          }
        }
      } else if (tag === 'g' && cs.opacity !== '1') attrs.opacity = cs.opacity;
      if (tag === 'g' && cs.getPropertyValue('clip-path') !== 'none' && !attrs['clip-path']) attrs['clip-path'] = rename(cs.getPropertyValue('clip-path'));
      if (cs.getPropertyValue('filter') !== 'none' && !attrs.filter && !defsLike) attrs.filter = rename(cs.getPropertyValue('filter'));
      const open = `<${tag}${Object.entries(attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')}`;
      return kids ? `${open}>${kids}</${tag}>` : `${open}/>`;
    }

    const box = root.getBoundingClientRect();
    const vb = root.viewBox.baseVal?.width ? root.viewBox.baseVal : { x: 0, y: 0, width: box.width, height: box.height };
    // Fill the frame the way the browser fits the viewBox into the drawn box (meet, centered)
    const s = Math.min(box.width / vb.width, box.height / vb.height);
    return {
      section: fig.dataset.section, group: fig.dataset.group, name: fig.dataset.name, note: fig.dataset.note,
      source: fig.dataset.source, scale: Number(fig.dataset.scale), backdrop: fig.dataset.backdrop,
      vb: [vb.x, vb.y, vb.width, vb.height], size: [box.width, box.height], fit: s,
      markup: walk(root, false),
    };
  }
  return [...document.querySelectorAll('[data-art]')].map((fig, i) => piece(fig, `p${i}_`));
}

const browser = await chromium.launch();
const all = [];
for (const deck of DECKS) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  await ctx.addInitScript((deck) => {
    localStorage.setItem('tidepool.settings', JSON.stringify({ v: 2, deck, palette: 'lagoon', mode: 'light', reduceMotion: true }));
  }, deck);
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForSelector('[data-art]');
  await page.waitForTimeout(500);
  const pieces = await page.evaluate(collect);
  // Only the game icons change with the deck; everything else is taken from the first pass
  for (const p of pieces) if (deck === DECKS[0] || p.section === 'Game icons') all.push({ ...p, deck });
  await ctx.close();
}
await browser.close();

// Drop repeats (the same drawing under another name, or a game icon that is the same in every deck)
const unique = [];
/** The markup with its ids numbered in order of appearance, so two copies of one drawing compare equal. */
const strip = (m) => {
  const ids = [...m.matchAll(/ id="([^"]+)"/g)].map((x) => x[1]);
  let out = m;
  ids.forEach((id, i) => { out = out.split(`"${id}"`).join(`"#${i}"`).split(`#${id})`).join(`#${i})`).split(`"#${id}"`).join(`"##${i}"`); });
  return out;
};
for (const p of all) {
  const twin = unique.find((u) => u.section === p.section && strip(u.markup) === strip(p.markup));
  if (twin) {
    if (p.section === 'Game icons') twin.decks.push(p.deck);
    else if (twin.name !== p.name) twin.also.push(p.name);
    continue;
  }
  unique.push({ ...p, decks: [p.deck], also: [] });
}
for (const p of unique) {
  if (p.section !== 'Game icons') continue;
  const names = { sea: 'Octo + Manta', arctic: 'Fox + Owl', honey: 'Bee + Sloth', woodland: 'Mushroom + Moth', cats: 'Cats' };
  p.group = p.decks.length === DECKS.length ? 'Every deck' : p.decks.map((d) => names[d]).join(', ');
}

// App icon: a static file
const icon = await readFile(new globalThis.URL('../public/icon.svg', import.meta.url), 'utf8');
const iconVb = icon.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
unique.push({
  section: 'App icon', group: 'Home screen icon', name: 'App icon', note: 'Also icon-192.png, icon-512.png, apple-touch-icon.png',
  source: 'public/icon.svg (the PNGs are made from it)', scale: 4, vb: iconVb, size: [iconVb[2], iconVb[3]], fit: 1,
  markup: icon.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<!--[\s\S]*?-->/g, ''), decks: [], also: [],
});

// --- layout: one file per deck's characters, then card backs, game icons, and the rest; in each file the sections run
// down the page, each group a block of framed cells with labels, blocks side by side where they fit ---
const FILES = [
  ...['Octo + Manta', 'Fox + Owl', 'Bee + Sloth', 'Mushroom + Moth', 'Cats'].map((deck, i) => ({
    file: `${String(i + 1).padStart(2, '0')}-characters-${deck.toLowerCase().replace(/[^a-z]+/g, '-')}.svg`,
    title: `Characters: ${deck}`, sections: ['Characters'], only: (p) => p.group === deck,
  })),
  { file: '06-card-backs.svg', title: 'Card backs', sections: ['Card backs'] },
  { file: '07-game-icons.svg', title: 'Game icons', sections: ['Game icons'] },
  { file: '08-pieces-ponds-sky-app-icon.svg', title: 'Game pieces, ponds, sky and app icon', sections: ['Game pieces', 'Pond Hop ponds', 'Sky', 'App icon'] },
  // The ponds as redesigned with the owner (Nov 4): rocky edge, piers, and Koi Garden's koi pond
  { file: '09-pond-hop-ponds.svg', title: 'Pond Hop ponds', sections: ['Pond Hop ponds'] },
  // Koi Garden's own art (Nov 4); its pond is in file 09
  { file: '10-koi-garden.svg', title: 'Koi Garden', sections: ['Koi Garden'] },
];
const PAGE_W = 3600, PAD = 60, GAP = 36, LABEL = 46, GROUP_HEAD = 50;
const idOf = (s) => s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const text = (x, ty, size, body, weight = 400, fill = '#1E2A33') =>
  `<text x="${+x.toFixed(1)}" y="${+ty.toFixed(1)}" font-family="Arial, Helvetica, sans-serif" font-size="${size}"${weight !== 400 ? ` font-weight="${weight}"` : ''} fill="${fill}">${esc(body)}</text>`;

await mkdir(OUT, { recursive: true });
const manifest = [];
const summary = [];
// Files the owner has redrawn are the masters for their art now; the export never writes over them, and their entries
// in manifest.json stay exactly as they were (the imports map the owner's drawings by those frames).
const OWNER_FILES = new Set(['01-characters-octo-manta.svg', '02-characters-fox-owl.svg', '08-pieces-ponds-sky-app-icon.svg']);
// `--only <file>` writes just that file (and its manifest entries), so files the owner may be redrawing don't shift
const onlyArg = process.argv.indexOf('--only');
const ONLY = onlyArg > 0 ? process.argv[onlyArg + 1] : null;
const previous = JSON.parse(await readFile(new globalThis.URL('manifest.json', OUT), 'utf8').catch(() => '[]'));
const keep = (file) => OWNER_FILES.has(file) || (ONLY && file !== ONLY);
for (const { file, title, sections, only } of FILES) {
  if (keep(file)) {
    manifest.push(...previous.filter((m) => m.file === file));
    summary.push(`${file}: kept as it is${OWNER_FILES.has(file) ? " (the owner's drawings)" : ''}`);
    continue;
  }
  const used = new Set();
  const uniqueId = (s) => { let id = idOf(s), n = 2; while (used.has(id)) id = `${idOf(s)}_${n++}`; used.add(id); return id; };
  let y = PAD + 150;
  const art = [], frames = [], labels = [];
  labels.push(text(PAD, PAD + 60, 64, `Tidepool art: ${title}`, 700));
  labels.push(text(PAD, PAD + 110, 26, "Redraw inside each dashed frame and keep each group's name (the Layers panel shows them). See README.md next to this file.", 400, '#55606A'));
  let count = 0;
  for (const section of sections) {
    const items = unique.filter((p) => p.section === section && (!only || only(p)));
    if (!items.length) continue;
    if (sections.length > 1) {
      y += 40;
      labels.push(text(PAD, y + 44, 48, section, 700));
      y += 80;
    } else y += 30;
    const blocks = [...new Set(items.map((p) => p.group))].map((group) => {
      const cells = [];
      let x = 0, cy = GROUP_HEAD, rowH = 0, width = 0;
      for (const p of items.filter((i) => i.group === group)) {
        const f = p.scale * p.fit;
        const w = p.vb[2] * f, h = p.vb[3] * f;
        if (x + w > PAGE_W - 2 * PAD && x > 0) { x = 0; cy += rowH + LABEL + GAP; rowH = 0; }
        cells.push({ p, f, w, h, x, y: cy });
        width = Math.max(width, x + w);
        x += w + GAP;
        rowH = Math.max(rowH, h);
      }
      // Room for the group's heading too (about 17px a character at 30px bold)
      return { group, cells, width: Math.max(width, only ? 0 : group.length * 17), height: cy + rowH + LABEL };
    });
    let bx = PAD, shelfH = 0;
    const sectionGroups = [];
    for (const b of blocks) {
      if (bx + b.width > PAGE_W - PAD && bx > PAD) { bx = PAD; y += shelfH + GAP * 2; shelfH = 0; }
      if (!only) labels.push(text(bx, y + 28, 30, b.group, 700, '#3A4652'));
      const groupCells = [];
      for (const { p, f, w, h, x: cx, y: cy } of b.cells) {
        const x = bx + cx, top = y + cy;
        const id = uniqueId(`${only ? '' : `${b.group === p.name ? '' : `${b.group} `}`}${p.name}`);
        groupCells.push(`<g id="${id}" transform="translate(${+x.toFixed(2)} ${+top.toFixed(2)}) scale(${+f.toFixed(5)}) translate(${-p.vb[0]} ${-p.vb[1]})">${p.markup}</g>`);
        frames.push(`<rect x="${+x.toFixed(2)}" y="${+top.toFixed(2)}" width="${+w.toFixed(2)}" height="${+h.toFixed(2)}" fill="${p.backdrop ?? 'none'}" stroke="#B8C2CC" stroke-width="1.5" stroke-dasharray="8 6"/>`);
        const sub = [p.note, p.also.length ? `also: ${p.also.join(', ')}` : ''].filter(Boolean).join(' · ');
        const room = Math.max(24, Math.floor(w / 7.2));
        labels.push(text(x, top + h + 22, 18, p.name, 700));
        if (sub) labels.push(text(x, top + h + 42, 14, sub.length > room ? `${sub.slice(0, room - 1)}…` : sub, 400, '#6A7580'));
        manifest.push({ file, id, section, group: b.group, name: p.name, note: p.note, also: p.also.length ? p.also : undefined,
          decks: p.section === 'Game icons' ? p.decks : undefined, source: p.source,
          frame: { x: +x.toFixed(2), y: +top.toFixed(2), width: +w.toFixed(2), height: +h.toFixed(2) }, viewBox: p.vb, scale: +f.toFixed(5) });
        count++;
      }
      sectionGroups.push(`<g id="${uniqueId(`${section} ${b.group}`)}">${groupCells.join('')}</g>`);
      bx += b.width + GAP * 3;
      shelfH = Math.max(shelfH, b.height);
    }
    y += shelfH + GAP * 2;
    art.push(sections.length > 1 ? `<g id="${uniqueId(section)}">${sectionGroups.join('')}</g>` : sectionGroups.join(''));
  }
  const height = Math.ceil(y + PAD);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${PAGE_W} ${height}" width="${PAGE_W}" height="${height}">
<rect id="Background" x="0" y="0" width="${PAGE_W}" height="${height}" fill="#FFFFFF"/>
<g id="Frames_guides">${frames.join('')}</g>
<g id="Art">${art.join('')}</g>
<g id="Labels">${labels.join('')}</g>
</svg>
`;
  await writeFile(new globalThis.URL(file, OUT), svg);
  summary.push(`${file}: ${count} pieces, ${PAGE_W} × ${height}, ${(svg.length / 1e6).toFixed(2)} MB`);
}
await writeFile(new globalThis.URL('manifest.json', OUT), `${JSON.stringify(manifest, null, 1)}\n`);
console.log(summary.join('\n'));
