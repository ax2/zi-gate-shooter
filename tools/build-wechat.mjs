import { build } from 'esbuild';
import { mkdir, cp, writeFile, readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const output = path.resolve('build/wechat'); await mkdir(output, { recursive: true });
await build({ entryPoints: ['src/wechat.ts'], bundle: true, outfile: path.join(output, 'game.js'), platform: 'neutral', format: 'iife', target: 'es2018', minify: true, sourcemap: false });
await cp('public/assets', path.join(output, 'assets'), { recursive: true });
await writeFile(path.join(output, 'game.json'), JSON.stringify({ deviceOrientation: 'portrait', showStatusBar: false }, null, 2));
let previousAppId = '';
try { previousAppId = JSON.parse(await readFile(path.join(output, 'project.config.json'), 'utf8')).appid || ''; } catch { /* First build. */ }
await writeFile(path.join(output, 'project.config.json'), JSON.stringify({ description: '原创数字门射击游戏', projectname: 'zi-gate-shooter', compileType: 'game', appid: process.env.WECHAT_APPID || previousAppId, setting: { es6: false, minified: false } }, null, 2));
const list = [];
async function walk(dir) { for (const file of await readdir(dir)) { if (file === 'BUILD_MANIFEST.json') continue; const full = path.join(dir, file); const meta = await stat(full); if (meta.isDirectory()) await walk(full); else list.push({ file: path.relative(output, full).replaceAll('\\', '/'), bytes: meta.size, sha256: createHash('sha256').update(await readFile(full)).digest('hex') }); } }
await walk(output); const bytes = list.reduce((sum, entry) => sum + entry.bytes, 0);
await writeFile(path.join(output, 'BUILD_MANIFEST.json'), JSON.stringify({ version: '0.1.0', totalBytes: bytes, manifestExcluded: true, files: list, deviceVerified: false, reviewSubmitted: false }, null, 2));
console.log(`WeChat candidate bundle: ${output}, ${bytes} bytes. AppID and device validation still required.`);
