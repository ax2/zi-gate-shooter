import { World } from '../src/core/world';
import { C } from '../src/core/config';
import { weaponNames, type WeaponKind } from '../src/core/weapons';

// Synthetic coverage study: real firing/collision, intentionally stationary,
// durable targets. This is not a normal-level or human balance acceptance test.
const layouts: Record<string, number[][]> = {
  singleFar: [[360, 400]],
  singleNear: [[360, 820]],
  singlePointBlank: [[360, 900]],
  column: [[360, 400], [360, 560], [360, 720]],
  tightRow: [[260, 600], [360, 600], [460, 600]],
  wideRow: [[180, 600], [360, 600], [540, 600]],
  chainStagger: [[360, 720], [490, 650], [600, 550]],
};
const rows = [];
for (const [layout, positions] of Object.entries(layouts)) {
  for (const stage of [1, 2, 3]) for (const weapon of Object.keys(weaponNames) as WeaponKind[]) {
    const world = new World(1337);
    // Isolate the comparison from normal level spawns; production is untouched.
    (world as unknown as { scheduled: unknown[] }).scheduled = [];
    world.weaponKind = weapon;
    world.growth.stage = stage;
    const targets = positions.map(([x, y]) => {
      const body = world.spawn('armor', x, y);
      body.hp = body.maxHp = 100000;
      body.speed = 0;
      body.timer = 1000;
      return body;
    });
    for (let tick = 0; tick < 600; tick++) {
      world.step(C.step, 360);
      world.drainEffects();
    }
    const damage = targets.map(body => Math.round((body.maxHp - body.hp) * 100) / 100);
    if (world.player.hp !== 3 || world.growth.overload !== 0 || targets.some(t => !t.active)) {
      throw new Error('Study isolation failed');
    }
    rows.push({ layout, stage, weapon, name: weaponNames[weapon], damage,
      totalDamage: Math.round(damage.reduce((a, b) => a + b, 0) * 100) / 100,
      hitTargets: damage.filter(d => d > 0).length });
  }
}
console.log(JSON.stringify({ scope: 'synthetic stationary armor coverage, not normal gameplay',
  seconds: 10, seed: 1337, bonus: 0, overload: false, layouts, rows }, null, 2));
