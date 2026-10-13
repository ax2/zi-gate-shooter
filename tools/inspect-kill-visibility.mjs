import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

await mkdir('build/qa/Stage-31', { recursive: true });
const baseline = '7ab72f93fd386c2547d8c4d634c5b7fb99b7b93b';
for (const version of ['baseline', 'fixed']) {
const outfile = path.resolve(`build/qa/Stage-31/inspect-${version}.mjs`);
const plugins = version === 'baseline' ? [{ name: 'committed-baseline', setup(bundle) {
  for (const file of ['world', 'config']) bundle.onLoad({ filter: new RegExp(`src[\\\\/]core[\\\\/]${file}\\.ts$`) }, () => ({
    contents: execFileSync('git', ['show', `${baseline}:src/core/${file}.ts`], { encoding: 'utf8' }), loader: 'ts',
  }));
} }] : [];
await build({ stdin: { resolveDir: process.cwd(), contents: `
import { World } from './src/core/world.ts';
import { progressionTarget } from './tests/helpers/progression-driver.ts';
import { writeFileSync } from 'node:fs';
const world = new World(), rounds = {};
let target = 360;
for (let frame = 0; frame < 600 * 60; frame++) {
  if (frame % 6 === 0) target = progressionTarget(world);
  world.step(1/60, target);
  for (const event of world.drainEffects()) if (event.type === 'kill') {
    const record = rounds[world.round] ??= { kills: 0, aboveZero: 0, underHud: 0, ys: [] };
    record.kills++;
    if (event.y < 0) record.aboveZero++;
    if (event.y < 160) record.underHud++;
    record.ys.push({ kind: event.enemyKind, y: +event.y.toFixed(2) });
  }
}
const report = { version: '${version}', baselineCommit: '${baseline}', seed: 1337, simulatedSeconds: 600, rounds };
writeFileSync('build/qa/Stage-31/kill-visibility-${version}.json', JSON.stringify(report, null, 2));
console.log('${version}', JSON.stringify(Object.entries(rounds).map(([round, r]) => ({ round, kills: r.kills, aboveZero: r.aboveZero, underHud: r.underHud }))));
` }, bundle: true, platform: 'node', format: 'esm', outfile, plugins });
await import(pathToFileURL(outfile).href);
}
