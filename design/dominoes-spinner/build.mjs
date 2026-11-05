// Builds mockup.tsx into one self-contained page, spinner.html, with Vite.
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
await writeFile(`${dir}spinner.html`, `<title>Dominoes Spinner Mockup</title>
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
@media (prefers-reduced-motion: reduce) { * { transition: none !important } }
</style>
<div id="root"></div><script>${js.replace(/<\/script/g, '<\\/script')}</script>
`);
console.log('wrote spinner.html', Math.round(js.length / 1024), 'KB');
