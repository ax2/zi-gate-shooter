import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'build/qa/Stage-11'; await mkdir(out, { recursive: true });
await build({ entryPoints: ['tools/boss-visual-fixture.ts'], outfile: `${out}/boss-fixture.js`, bundle: true, format: 'esm', target: 'es2022' });
await writeFile(`${out}/boss-fixture.html`, '<!doctype html><html lang="zh-CN"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stage-11 首领击破夹具</title><script type="module" src="boss-fixture.js"></script></html>');
