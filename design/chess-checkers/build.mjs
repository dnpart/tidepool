// Builds mockup.tsx into one self-contained page, pieces.html, with Vite.
import { readFile, writeFile, rm } from 'node:fs/promises';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const dir = new URL('.', import.meta.url).pathname;
const out = `${dir}.build`;
await build({
  configFile: false,
  logLevel: 'warn',
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: { outDir: out, emptyOutDir: true, lib: { entry: `${dir}mockup.tsx`, formats: ['iife'], name: 'mockup', fileName: () => 'mockup.js' } },
});
const js = await readFile(`${out}/mockup.js`, 'utf8');
await rm(out, { recursive: true });
await writeFile(`${dir}pieces.html`, `<title>Checkers and Chess Pieces</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;700&display=swap">
<style>
/* Tidepool's Lagoon palette, light and dark; one narrow phone column */
:root { --bg: #E4F3F0; --surface: #FFFFFF; --ink: #173B47; --sub: #4A6670; --accent: #2A7C76; --on-accent: #FFFFFF; --soft: #CFEAE5;
  --line: #CFE3DF; --felt: rgba(255,255,255,.55); --target: rgba(42,124,118,.08);
  --display: Fredoka, 'Nunito', system-ui, sans-serif; --body: Nunito, system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #0D1A2B; --surface: #16283D; --ink: #E8F5F2; --sub: #A6C0C6;
  --accent: #5FC4BA; --on-accent: #0D1A2B; --soft: #1E3A4E; --line: #24405A; --felt: #0D1A2B; --target: rgba(95,196,186,.1); color-scheme: dark } }
:root[data-theme="dark"] { --bg: #0D1A2B; --surface: #16283D; --ink: #E8F5F2; --sub: #A6C0C6; --accent: #5FC4BA; --on-accent: #0D1A2B;
  --soft: #1E3A4E; --line: #24405A; --felt: #0D1A2B; --target: rgba(95,196,186,.1); color-scheme: dark }
body { background: var(--bg); color: var(--ink); font-family: var(--body);
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
button { cursor: pointer } button:disabled { opacity: .45; cursor: default } button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px }
/* The mockup paints the palette the viewer picks, so the app layer sets its own colors over the page's */
body { padding-left: 0; padding-right: 0 }
.app { background: var(--bg); color: var(--ink); min-height: 100vh; padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 16px 32px; transition: background 250ms ease }
main { max-width: 420px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px }
h1 { font-family: var(--display); font-weight: 600; font-size: 26px; line-height: 1.15; margin: 4px 0 0; text-wrap: balance }
.intro, .note { margin: 0; color: var(--sub); font-size: 15px; line-height: 1.45 }
.note { min-height: 3em }
.row { display: flex; flex-direction: column; gap: 6px }
.label { font-size: 13px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--sub) }
.chips { display: flex; flex-wrap: wrap; gap: 6px }
.chip { min-height: 40px; padding: 0 14px; border-radius: 999px; border: 2px solid var(--line); background: var(--surface);
  color: var(--ink); font: inherit; font-weight: 700; font-size: 14px }
.chip[aria-checked="true"] { background: var(--accent); border-color: var(--accent); color: var(--on-accent) }
.status { padding: 9px 12px; border-radius: 14px; background: var(--soft); font-weight: 700; font-size: 14px; text-align: center }
.table { padding: 10px; border-radius: 22px; background: var(--surface); border: 2px solid var(--line) }
@media (prefers-reduced-motion: reduce) { * { transition: none !important } }
</style>
<div id="root"></div><script>${js.replace(/<\/script/g, '<\\/script')}</script>
`);
console.log('wrote pieces.html', Math.round(js.length / 1024), 'KB');
