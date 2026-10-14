import { expect, it } from 'vitest';
import { World } from '../src/core/world';
import { C } from '../src/core/config';

it.each(['crate', 'drone'] as const)('records lethal %s contact without changing damage and resets on a new run', kind => {
  const w = new World(); w.player.hp = 1;
  w.spawn(kind, w.player.x, C.playerY);
  w.step(C.step, w.player.x);
  expect(w.phase).toBe('dead'); expect(w.player.hp).toBe(0);
  expect(w.lastDamageCause).toBe(kind === 'crate' ? 'crate' : 'enemy');
  expect(new World().lastDamageCause).toBeNull();
});

it('does not let an invulnerable collision overwrite the effective enemy-bullet cause', () => {
  const w = new World();
  w.bullets.push({ id: 999, x: 360, y: C.playerY, px: 360, py: C.playerY,
    vx: 0, vy: 0, damage: 1, age: 0, active: true, hostile: true });
  w.step(C.step, 360);
  expect(w.player.hp).toBe(2); expect(w.lastDamageCause).toBe('bullet');
  w.spawn('crate', 360, C.playerY); w.step(C.step, 360);
  expect(w.player.hp).toBe(2); expect(w.lastDamageCause).toBe('bullet');
});
