import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'build/qa/Stage-10';
await mkdir(out, { recursive: true });
await build({ entryPoints: ['tools/explosion-visual-fixture.ts'], outfile: `${out}/explosion-fixture.js`, bundle: true, format: 'esm', target: 'es2022' });
await writeFile(`${out}/explosion-fixture.html`, '<!doctype html><html lang="zh-CN"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stage-10 渲染夹具</title><script type="module" src="explosion-fixture.js"></script></html>');
