// Made by scripts/cat-back-art.mjs from the owner's black cat seen from behind in design/art-export/13-gone-fishing.svg
// (commit 97478be). Don't edit by hand. Each shape as drawn, with one transform into the cat's frame: the bottom middle
// of its body at (0, 0), a sixth of the page's size.

export type CatBackRole = 'body' | 'tail' | 'paw' | 'head' | 'ear';
export interface CatBackShape {
  role: CatBackRole;
  tag: 'path' | 'ellipse';
  m: [number, number, number, number, number, number];
  d?: string;
  cx?: number; cy?: number; rx?: number; ry?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  linecap?: 'round' | 'butt' | 'square';
}

/** In drawing order. */
export const CAT_BACK_SHAPES: CatBackShape[] = [
  {"role":"body","tag":"ellipse","cx":1419.26,"cy":731.618,"rx":138.354,"ry":166.317,"m":[0.1667,0,0,0.1667,-236.5433,-149.6558],"fill":"#2C2A37"},
  {"role":"tail","tag":"path","d":"M 1433.09 844.472 C 1419.98 886.558 1344.968 1026.557 1454.49 1026.97","m":[0.1667,0,0,0.1667,-236.5433,-149.6558],"stroke":"#2C2A37","strokeWidth":40,"linecap":"round"},
  {"role":"paw","tag":"path","d":"M 1362.91 389.217 C 1326.24 401.226 1307.69 466.083 1313.5 509.152 C 1322.81 578.09 1338.97 573.755 1353.47 646.372","m":[0.1667,0,0,0.1667,-236.5433,-149.6558],"stroke":"#2C2A37","strokeWidth":53,"linecap":"round"},
  {"role":"head","tag":"ellipse","cx":1416.17,"cy":510.872,"rx":91.212,"ry":88.701,"m":[0.182,0,0,0.1667,-257.4733,-146.4956],"fill":"#3A3848"},
  {"role":"ear","tag":"path","d":"M 1707.368 321.579 Q 1714.183 308.916 1720.997 321.579 L 1747.451 370.739 Q 1754.265 383.402 1740.637 383.402 L 1687.728 383.402 Q 1674.1 383.402 1680.914 370.739 Z","m":[0.1556,0.0864,-0.0943,0.1425,-222.3552,-273.1614],"fill":"#3A3848"},
  {"role":"ear","tag":"path","d":"M -1641.322 -296.257 Q -1634.506 -308.92 -1627.69 -296.257 L -1601.228 -247.097 Q -1594.412 -234.434 -1608.044 -234.434 L -1660.968 -234.434 Q -1674.6 -234.434 -1667.784 -247.097 Z","m":[-0.1605,0.0785,0.0857,0.147,-250.0006,92.219],"fill":"#3A3848"},
];

/** The tip of the raised paw, in the cat's frame (where it touches the water). */
export const CAT_BACK_PAW: [number, number] = [-9.39,-84.79];
