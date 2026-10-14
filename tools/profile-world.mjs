import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const root = `build/qa/runs/${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}/world-profile`;
await mkdir(root, { recursive: true });
await build({ stdin: { contents: `
import { World } from './src/core/world';
import { C } from './src/core/config';
import { progressionTarget } from './tests/helpers/progression-driver';
export { World, C, progressionTarget };`, resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'esm', outfile: `${root}/subject.mjs` });
const { World, C, progressionTarget } = await import(pathToFileURL(resolve(root, 'subject.mjs')).href);
const world = new World(1337), stepTimes = [], driverTimes = [], worstSteps = [];
let target = 360;
for (let frame = 0; frame < 1200 * 60 && world.phase !== 'dead'; frame++) {
  if (frame % 6 === 0) {
    const began = performance.now(); target = progressionTarget(world, 'scatter');
    driverTimes.push(performance.now() - began);
  }
  const began = performance.now(); world.step(C.step, target); world.drainEffects();
  const elapsed = performance.now() - began; stepTimes.push(elapsed);
  if (worstSteps.length < 10 || elapsed > worstSteps.at(-1).ms) {
    worstSteps.push({ ms: elapsed, time: world.time, round: world.round, phase: world.phase,
      bodies: world.bodies.length, bullets: world.bullets.length });
    worstSteps.sort((a, b) => b.ms - a.ms); worstSteps.length = Math.min(10, worstSteps.length);
  }
}
function distribution(values) {
  values.sort((a, b) => a - b);
  return { samples: values.length, p50Ms: values[Math.floor(values.length * .5)],
    p95Ms: values[Math.floor(values.length * .95)], p99Ms: values[Math.floor(values.length * .99)], maxMs: values.at(-1),
    over16Ms: values.filter(x => x > 16.67).length, over250Ms: values.filter(x => x > 250).length };
}
const result = { scope: 'Node wall-clock profiling; no rendering/audio, not browser or device performance acceptance',
  simulatedSeconds: world.time, round: world.round, hp: world.player.hp,
  worldStep: distribution(stepTimes), testDriver: distribution(driverTimes), worstSteps };
await writeFile(`${root}/report.json`, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ path: `${root}/report.json`, ...result }, null, 2));
