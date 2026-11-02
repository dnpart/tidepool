// Illustrator's SVG export sometimes writes a curve with the "s" shorthand, which tells the browser the first handle is
// the previous handle mirrored at the same length. When the owner's handles are lined up but of different lengths, the
// browser then draws the wrong curve (a sharp point on a tentacle tip), though Illustrator itself shows it right.
//
// The owner copies shapes from cell to cell, and other copies often carry the real handle written out in full ("c").
// `repairSmoothCurves` finds every such path's twins (the same shape anywhere in the file: same segments, same end
// points and second handles) and, where this copy only had "s", takes a twin's written-out first handle if it points
// the same way and only its length differs (a handle turned another way is the owner's own change, kept as it is).
// Paths with nothing to repair are left exactly as written.

/** Splits path data into commands with their numbers ("1.2.3" is 1.2 and .3, "-1-2" is -1 and -2). */
function tokens(d) {
  const out = [];
  for (const m of d.matchAll(/([MmCcSsLlHhVvZzQqTtAa])([^MmCcSsLlHhVvZzQqTtAa]*)/g)) {
    const nums = (m[2].match(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) ?? []).map(Number);
    out.push([m[1], nums]);
  }
  return out;
}

const ARITY = { m: 2, c: 6, s: 4, l: 2, h: 1, v: 1, z: 0, q: 4, t: 2, a: 7 };

/**
 * The path as absolute segments, relative to its first point: { type: 'C', p: [x1,y1,x2,y2,x,y], short } (short when
 * written as "s"), { type: 'L', p: [x, y] }, or { type: 'Z' }. Returns null for anything else (arcs, quadratics).
 */
function segments(d) {
  const segs = [];
  let x = 0, y = 0, sx = 0, sy = 0, start = null, lastCp = null;
  for (const [cmd, nums] of tokens(d)) {
    const lower = cmd.toLowerCase();
    const rel = cmd === lower;
    const n = ARITY[lower];
    if (n === undefined || 'qta'.includes(lower)) return null;
    if (n === 0) {
      segs.push({ type: 'Z' });
      x = sx; y = sy; lastCp = null;
      continue;
    }
    for (let i = 0; i < nums.length; i += n) {
      const a = nums.slice(i, i + n);
      const ox = rel ? x : 0, oy = rel ? y : 0;
      if (lower === 'm' && i === 0) {
        x = ox + a[0]; y = oy + a[1]; sx = x; sy = y;
        if (!start) start = [x, y];
        else segs.push({ type: 'M', p: [x, y] });
        lastCp = null;
      } else if (lower === 'm' || lower === 'l') {
        x = ox + a[0]; y = oy + a[1]; segs.push({ type: 'L', p: [x, y] }); lastCp = null;
      } else if (lower === 'h') {
        x = ox + a[0]; segs.push({ type: 'L', p: [x, y] }); lastCp = null;
      } else if (lower === 'v') {
        y = oy + a[0]; segs.push({ type: 'L', p: [x, y] }); lastCp = null;
      } else if (lower === 'c') {
        const p = [ox + a[0], oy + a[1], ox + a[2], oy + a[3], ox + a[4], oy + a[5]];
        segs.push({ type: 'C', p, short: false });
        [x, y] = [p[4], p[5]]; lastCp = [p[2], p[3]];
      } else {
        const c1 = lastCp ? [2 * x - lastCp[0], 2 * y - lastCp[1]] : [x, y];
        const p = [c1[0], c1[1], ox + a[0], oy + a[1], ox + a[2], oy + a[3]];
        segs.push({ type: 'C', p, short: true });
        [x, y] = [p[4], p[5]]; lastCp = [p[2], p[3]];
      }
    }
  }
  if (!start) return null;
  // Relative to the first point, so copies of a shape in different cells compare equal
  for (const s of segs) if (s.p) s.p = s.p.map((v, i) => v - start[i % 2]);
  return { start, segs };
}

const close = (a, b, tol) => Math.abs(a - b) <= tol;

/** Twins: the same segments in the same order, with end points and second handles within `tol`. */
function twins(a, b, tol = 0.35) {
  if (a.segs.length !== b.segs.length) return false;
  return a.segs.every((s, i) => {
    const t = b.segs[i];
    if (s.type !== t.type) return false;
    if (!s.p) return true;
    const from = s.type === 'C' ? 2 : 0;
    for (let k = from; k < s.p.length; k++) if (!close(s.p[k], t.p[k], tol)) return false;
    return true;
  });
}

const fmt = (v) => String(Math.round(v * 1000) / 1000);

function write({ start, segs }) {
  let d = `M${fmt(start[0])},${fmt(start[1])}`;
  for (const s of segs) {
    if (s.type === 'Z') d += 'Z';
    else {
      const abs = s.p.map((v, i) => v + start[i % 2]);
      d += `${s.type}${abs.map(fmt).join(',')}`;
    }
  }
  return d;
}

/**
 * Repairs every "s" curve that has a twin with the handle written out. Returns the new SVG and a list of repairs
 * (`moved`: how far the first handle moved, in the file's units).
 */
export function repairSmoothCurves(svg) {
  const found = [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => ({ d: m[1], shape: segments(m[1]) }));
  const shapes = found.filter((f) => f.shape);
  const repairs = [];
  const replaced = new Map();
  for (const f of shapes) {
    if (!f.shape.segs.some((s) => s.short)) continue;
    const others = shapes.filter((o) => o !== f && twins(f.shape, o.shape));
    let changed = false;
    const segs = f.shape.segs.map((s, i) => {
      if (!s.short) return s;
      // The segment's start point: the previous segment's end (or the path's first point)
      const prev = f.shape.segs.slice(0, i).reverse().find((t) => t.p);
      const [px, py] = prev ? prev.p.slice(-2) : [0, 0];
      const ours = [s.p[0] - px, s.p[1] - py];
      // A twin's written-out handle pointing the same way as the mirrored one but a different length: the export bug.
      // Anything else (a handle turned another way) is the owner's own change to that copy, so it's left alone.
      const donor = others.map((o) => o.shape.segs[i]).find((t) => {
        if (t.short) return false;
        const theirs = [t.p[0] - px, t.p[1] - py];
        const la = Math.hypot(...ours), lb = Math.hypot(...theirs);
        if (la < 0.5 || lb < 0.5) return false;
        const cos = (ours[0] * theirs[0] + ours[1] * theirs[1]) / (la * lb);
        return cos > 0.998 && Math.abs(la - lb) > 0.5;
      });
      if (!donor) return s;
      const moved = Math.hypot(donor.p[0] - s.p[0], donor.p[1] - s.p[1]);
      changed = true;
      repairs.push({ at: f.shape.start.map(fmt).join(','), segment: i, moved: Math.round(moved * 100) / 100 });
      return { ...s, p: [donor.p[0], donor.p[1], ...s.p.slice(2)], short: false };
    });
    if (changed) replaced.set(f.d, write({ start: f.shape.start, segs }));
  }
  let out = svg;
  for (const [from, to] of replaced) out = out.split(` d="${from}"`).join(` d="${to}"`);
  return { svg: out, repairs };
}
