import { expect, it } from 'vitest';
import { C } from '../src/core/config';
import { World } from '../src/core/world';
import { safeRoute } from '../src/core/reachability';

it('time-expanded routes detect a full-width trap, and preserve a side exit', () => {
  const world = new World();
  for (const x of [80, 220, 360, 500, 640]) { const box = world.spawn('crate', x, 850, 3); box.width = 140; }
  expect(safeRoute(360, world.bodies, [], 2)).toBeNull();
  world.bodies = world.bodies.filter(b => b.x < 500);
  expect(safeRoute(520, world.bodies, [], 2)).not.toBeNull();
});

it('boss warning geometry remains locked until the shot is emitted', () => {
  const world = new World(); world.phase = 'boss'; world.phaseTime = 3.8;
  const boss = world.spawn('boss', 360, 260); boss.timer = 0;
  world.step(C.step); const lane = boss.lane, attack = boss.attack;
  for (let i = 0; i < 82; i++) { world.player.invulnerable = 100; world.step(C.step, 650); world.drainEffects(); }
  expect(boss.lane).toBe(lane); expect(boss.attack).toBe(attack);
  expect(world.bullets.filter(b => b.hostile).every(b => attack ? [200, 360].includes(b.x) : b.x === lane)).toBe(true);
});

it('20-minute accelerated stress keeps object counts bounded across real boss cycles', () => {
  const world = new World(77);
  // Explicit test fixture: max firepower and damage immunity are injected ONLY here.
  // This validates pressure/lifetime, not legitimate progression or human survival.
  world.growth.stage = 3; world.growth.bonus = 100;
  for (let frame = 0; frame < 20 * 60 * 60; frame++) {
    world.player.invulnerable = 100;
    const boss = world.bodies.find(b => b.kind === 'boss');
    const crate = world.bodies.find(b => b.kind === 'crate' || b.kind === 'pickup');
    const gate = world.bodies.find(b => b.kind === 'gate');
    const enemy = world.bodies.filter(b => b.kind in C.enemies).sort((a, b) => b.y - a.y)[0];
    world.step(C.step, (boss ?? crate ?? gate ?? enemy)?.x ?? 360);
    world.drainEffects();
    expect(world.bodies.length).toBeLessThanOrEqual(32);
    expect(world.bullets.length).toBeLessThanOrEqual(128);
  }
  expect(world.time).toBeCloseTo(1200, 3); expect(world.round).toBeGreaterThan(5);
  expect(Number.isFinite(world.score)).toBe(true); expect(world.phase).not.toBe('dead');
}, 30000); // Full simulation stress, not a five-second host performance benchmark.

it('20 restarts begin with fresh identity, objects, score and growth', () => {
  for (let restart = 0; restart < 20; restart++) {
    const world = new World(restart + 1);
    expect(world.bodies.length).toBe(0); expect(world.bullets.length).toBe(0); expect(world.score).toBe(0);
    expect(world.growth).toEqual({ stage: 1, bonus: 0, energy: 0, overload: 0 });
    for (let i = 0; i < 600; i++) { world.step(C.step); world.drainEffects(); }
  }
});
