import { build } from 'esbuild';
import { mkdir, cp, writeFile } from 'node:fs/promises';
const output = 'build/android-web';
await mkdir(output, { recursive: true });
await build({ entryPoints: ['src/android.ts'], outfile: `${output}/game.js`, bundle: true, minify: true, format: 'iife', target: 'es2020', platform: 'browser' });
await cp('public/assets', `${output}/assets`, { recursive: true });
await cp('THIRD_PARTY_NOTICES.md', `${output}/THIRD_PARTY_NOTICES.md`);
await writeFile(`${output}/index.html`, '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>火力突围</title></head><body><script src="game.js"></script></body></html>');
console.log('Android local web payload built; no server URL or Phaser runtime.');
