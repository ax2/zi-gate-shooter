import { expect, it } from 'vitest';
import { World } from '../src/core/world';
import { C } from '../src/core/config';
import type { WeaponKind } from '../src/core/weapons';

function damage(kind: WeaponKind, y: number) {
  const w = new World(); w.weaponKind = kind; w.growth.stage = 3;
  const target = w.spawn('armor', 360, y);
  target.hp = target.maxHp = 10000; target.speed = 0; target.timer = 1000;
  for (let i = 0; i < 60; i++) { w.step(C.step, 360); w.drainEffects(); }
  return target.maxHp - target.hp;
}

it('scatter rewards point-blank pellet convergence while blast retains ranged single-target advantage', () => {
  expect(damage('scatter', 900)).toBeGreaterThan(damage('blast', 900));
  expect(damage('scatter', 400)).toBeLessThan(damage('blast', 400));
});

it('upgraded scatter clears a scrolling light row without having to aim at each enemy', () => {
  const w = new World(); w.weaponKind = 'scatter'; w.growth.stage = 3;
  for (const x of [260, 360, 460]) w.spawn('drone', x, 500);
  for (let i = 0; i < 60; i++) { w.step(C.step, 360); w.drainEffects(); }
  expect(w.kills).toBe(3);
  expect(w.player.hp).toBe(3);
});
