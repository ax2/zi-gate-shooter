import { expect, it } from 'vitest';
import { C } from '../src/core/config';
import { World } from '../src/core/world';
import type { Bullet } from '../src/core/world';
import { dangerTimeline, safeRoute } from '../src/core/reachability';
import { Random } from '../src/core/director';

const projectile = (x: number, y: number, vy: number): Bullet => ({ id: 999, x, y, px: x, py: y, vx: 0, vy, damage: 1, age: 0, active: true, hostile: true });

it('future emissions reserve danger before any bullet exists, without mutating the world', () => {
  const world = new World(); const enemy = world.spawn('armor', 360, 500);
  enemy.timer = 0.1;
  const before = JSON.stringify(world.bodies);
  const forecast = dangerTimeline(world.bodies, [], 3);
  // The body cannot arrive in 3s; this reservation can only be its future shot.
  expect(forecast.some(intervals => intervals.some(([lo, hi]) => lo < 360 && hi > 360))).toBe(true);
  expect(JSON.stringify(world.bodies)).toBe(before); expect(world.bullets).toHaveLength(0);
});

it('reaction delay cannot be bypassed by quantizing the starting position', () => {
  const bullet = projectile(351, C.playerY - 100, 280);
  expect(safeRoute(351, [], [bullet], 0.5)).toBeNull();
  const path = safeRoute(351, [], [bullet], 0.5, { reaction: 0 });
  expect(path).not.toBeNull();
  if (path) expect(Math.abs(path[0] - 351)).toBeLessThanOrEqual(C.moveSpeed * 0.1);
  expect(safeRoute(351, [], [], 0.3)).toEqual([351, 351, 351]);
});

it('forecast intervals cover actual fixed-step future bullets and charger bodies', () => {
  const world = new World(); world.phase = 'boss'; world.phaseTime = 7;
  const boss = world.spawn('boss', 360, 260); boss.timer = 0.05;
  const armor = world.spawn('armor', 200, 450); armor.timer = 0.1;
  const charger = world.spawn('charger', 520, 400); charger.age = 2.4;
  const forecast = dangerTimeline(world.bodies, [], 5, { phase: 'boss', phaseTime: 7 });
  let crossings = 0;
  for (let frame = 0; frame < 300; frame++) {
    // Test observer remains off every attack lane; no damage immunity injection.
    world.step(C.step, 68); world.drainEffects();
    const intervals = forecast[Math.floor(frame / 6)];
    for (const bullet of world.bullets.filter(b => b.hostile)) {
      if (Math.min(bullet.py, bullet.y) - 31 <= C.playerY && Math.max(bullet.py, bullet.y) + 31 >= C.playerY) {
        expect(intervals.some(([lo, hi]) => lo <= bullet.x - 27 && hi >= bullet.x + 27)).toBe(true); crossings++;
      }
    }
    if (charger.active && Math.abs(charger.y - C.playerY) <= charger.height / 2 + C.playerRadius)
      expect(intervals.some(([lo, hi]) => lo <= charger.x && hi >= charger.x)).toBe(true);
  }
  expect(crossings).toBeGreaterThan(0); expect(world.player.hp).toBe(3);
});

it('unsafe queued rewards are delayed and eventually admitted, not silently dropped', () => {
  const world = new World(); world.roundTime = 7.99;
  // A synthetic full-width old threat makes every newly queued spawn unsafe.
  const trap = world.spawn('drone', 360, C.playerY); trap.width = 1200; trap.speed = 0;
  world.step(C.step); world.drainEffects();
  expect(world.fallbackCount).toBeGreaterThan(0);
  expect(world.bodies.some(b => b.kind === 'crate')).toBe(false);
  trap.active = false;
  for (let frame = 0; frame < 40; frame++) { world.step(C.step); world.drainEffects(); }
  expect(world.bodies.some(b => b.kind === 'crate' && b.stage === 2)).toBe(true);
});

it('new boss warnings wait when existing danger leaves no safe reaction path', () => {
  const world = new World(); world.phase = 'boss';
  const boss = world.spawn('boss', 360, 260); boss.timer = 0;
  world.bullets.push(projectile(360, C.playerY - 48, 280));
  world.step(C.step);
  expect(world.attackDeferrals).toBe(1); expect(boss.warning).toBe(0);
  expect(world.bullets.some(b => b.hostile)).toBe(true);
});

it('queued crates wait for reward capacity without deleting existing rewards', () => {
  const world = new World(); world.roundTime = 7.99;
  const existing = Array.from({ length: C.limits.rewards }, () => world.spawn('pickup', 500, 100));
  world.step(C.step); world.drainEffects();
  expect(world.bodies.filter(b => b.kind === 'pickup')).toHaveLength(C.limits.rewards);
  expect(world.bodies.some(b => b.kind === 'crate')).toBe(false);
  existing[0].active = false;
  world.step(C.step); world.drainEffects();
  expect(world.bodies.some(b => b.kind === 'crate')).toBe(true);
  expect(world.bodies.filter(b => ['gate', 'crate', 'pickup'].includes(b.kind))).toHaveLength(C.limits.rewards);
});

it('100 seeds x 3 threat fixtures replay predicted escape paths without kills or immunity', () => {
  let moved = 0;
  for (let seed = 1; seed <= 100; seed++) for (const profile of [1, 5, 9]) {
    const random = new Random(seed * 113 + profile);
    const world = new World(seed); world.phase = 'boss'; world.round = profile;
    world.phaseTime = random.next() * 40;
    world.player.x = 100 + random.next() * 520; world.player.px = world.player.x;
    if (profile === 9) {
      const boss = world.spawn('boss', 360, 260); boss.timer = 0.1;
    } else {
      for (const x of [180, 540]) { const armor = world.spawn('armor', x, 450); armor.timer = 0.1; }
      const charger = world.spawn('charger', 360, 200); charger.age = 2.4;
      world.spawn('crate', 430, 550, 3);
      world.bullets.push(projectile(world.player.x, 100, 280));
    }
    const start = world.player.x;
    const path = safeRoute(start, world.bodies, world.bullets, 5, { phase: world.phase, phaseTime: world.phaseTime });
    expect(path, `seed ${seed} profile ${profile}`).not.toBeNull();
    if (!path) continue;
    if (path.some(x => Math.abs(x - start) > 20)) moved++;
    for (let frame = 0; frame < 300; frame++) {
      const target = frame * C.step < 0.45 ? start : path[Math.floor(frame / 6)];
      world.step(C.step, target); world.drainEffects();
      // Remove player shots immediately after emission, before they travel into
      // targets. This fixture tests an escape that does not depend on firepower.
      world.bullets = world.bullets.filter(b => b.hostile);
      expect(world.player.hp, `seed ${seed} profile ${profile} frame ${frame}`).toBe(3);
    }
    expect(world.kills).toBe(0); expect(world.cratesBroken).toBe(0);
  }
  expect(moved).toBeGreaterThan(100);
}, 20000);

it.each([1, 2, 3, 5])('100 seeds of round %i retain a no-kill escape through boss entry', round => {
  for (let seed = 1; seed <= 100; seed++) {
    // Later rounds are explicit isolated replay fixtures at T1/zero bonus, not
    // a claim that a no-kill player legitimately beat the previous boss.
    const world = new World(seed, round); let path: number[] = [];
    world.player.x = [68, 360, 652][seed % 3]; world.player.px = world.player.x;
    for (let frame = 0; frame < 100 * 60 && world.phase === 'running'; frame++) {
      if (frame % 60 === 0) {
        // Continuous planner already observes existing threats; admission itself
        // separately reserves 450ms reaction for each new object.
        const route = safeRoute(world.player.x, world.bodies, world.bullets, 8, { reaction: frame ? 0 : 0.45 });
        expect(route, `no route seed ${seed} round ${round} at ${world.time}`).not.toBeNull();
        path = route ?? [];
      }
      world.step(C.step, path[Math.floor(frame % 60 / 6)] ?? world.player.x);
      world.drainEffects(); world.bullets = world.bullets.filter(b => b.hostile);
      expect(world.player.hp, `damage seed ${seed} round ${round} at ${world.time}`).toBe(3);
      expect(world.bodies.filter(b => ['gate', 'crate', 'pickup'].includes(b.kind)).length).toBeLessThanOrEqual(C.limits.rewards);
      expect(world.bodies.length).toBeLessThanOrEqual(C.limits.enemies + C.limits.rewards);
    }
    expect(world.phase, `stalled seed ${seed}`).toBe('boss-entry');
    expect(world.kills).toBe(0); expect(world.cratesBroken).toBe(0);
  }
}, 60000);
