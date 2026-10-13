import { expect, it } from 'vitest';
import { C } from '../src/core/config';
import { World } from '../src/core/world';

function shot(world: World, y: number, hostile = false) {
  world.bullets.push({ id: 999, x: 360, y, px: 360, py: y, vx: 0, vy: -1200, age: 0, damage: 100,
    active: true, hostile });
}

it('a shot crossing its range endpoint cannot kill a target beyond that endpoint', () => {
  const world = new World();
  const target = world.spawn('drone', 360, C.playerShotTop - 45); target.speed = 0;
  shot(world, C.playerShotTop + 10);
  world.step(C.step);
  expect(target.hp).toBe(target.maxHp); expect(world.kills).toBe(0);
  expect(world.bullets.some(b => b.id === 999)).toBe(false);
});

it('a moving target reached before the clipped endpoint still takes the hit', () => {
  const world = new World();
  const target = world.spawn('drone', 360, C.playerShotTop - 35); target.speed = 60;
  shot(world, C.playerShotTop + 10);
  world.step(C.step);
  expect(world.kills).toBe(1); expect(target.hp).toBe(0);
  expect(world.drainEffects().some(e => e.type === 'kill')).toBe(true);
});

it('a target moving across the endpoint after the shot expires cannot be hit late', () => {
  const world = new World();
  // Body bottom starts 2px above the range endpoint, arrives 2px below it
  // by the full step, but is still above when the shot ends a quarter through.
  const target = world.spawn('drone', 360, C.playerShotTop - 40); target.speed = 240;
  shot(world, C.playerShotTop + 5);
  world.step(C.step);
  expect(target.hp).toBe(target.maxHp); expect(world.kills).toBe(0);
});

it('a hostile projectile is unaffected by the player-only range endpoint', () => {
  const world = new World(); shot(world, C.playerShotTop - 30, true);
  world.step(C.step);
  expect(world.bullets.some(b => b.id === 999 && b.hostile)).toBe(true);
});
