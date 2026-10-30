import { createServer } from '/home/user/tidepool/node_modules/vite/dist/node/index.js';
import { writeFileSync } from 'node:fs';
const server = await createServer({ root: '/home/user/tidepool', configFile: '/home/user/tidepool/vite.config.ts', server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
const mod = await server.ssrLoadModule(process.argv[2]);
writeFileSync(process.argv[3], mod.default);
await server.close();
