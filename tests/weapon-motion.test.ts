import { expect, it } from 'vitest';
import { WeaponMotion } from '../src/game/weapon-motion';

it('keeps muzzle light on the same simulation clock and isolates weapon changes', () => {
  const motion = new WeaponMotion();
  expect(motion.flash('pulse', 1, 0)).toBe(0);
  for (const kind of ['pulse', 'scatter', 'pierce'] as const) {
    motion.fire(kind, 2, 10);
    expect(motion.flash(kind, 2, 10)).toBe(1);
    const brightness = motion.flash(kind, 2, 10.03);
    expect(brightness).toBeGreaterThan(0);
    for (let i = 0; i < 100; i++) expect(motion.flash(kind, 2, 10.03)).toBe(brightness);
    expect(motion.flash(kind, 1, 10.03)).toBe(0);
    expect(motion.flash(kind === 'pulse' ? 'scatter' : 'pulse', 2, 10.03)).toBe(0);
    expect(motion.flash(kind, 2, 10.1)).toBe(0);
    motion.reset(); expect(motion.flash(kind, 2, 10.03)).toBe(0);
  }
});

it('freezes with simulation time and discards impulses on reset or weapon change', () => {
  const motion = new WeaponMotion();
  motion.fire('scatter', 3, 1);
  const pose = motion.sample('scatter', 3, 1.04);
  expect(pose).toBeGreaterThan(0);
  for (let i = 0; i < 100; i++) expect(motion.sample('scatter', 3, 1.04)).toBe(pose);
  expect(motion.sample('pierce', 3, 1.04)).toBe(0);
  expect(motion.sample('scatter', 2, 1.04)).toBe(0);
  expect(motion.sample('scatter', 3, 0)).toBe(0);
  motion.reset(); expect(motion.sample('scatter', 3, 1.04)).toBe(0);
});

it('separates fast recovery, spring return and heavy hold without accumulating recoil', () => {
  const motion = new WeaponMotion();
  for (const kind of ['pulse', 'scatter', 'pierce'] as const) {
    motion.fire(kind, 3, 0);
    const at100 = motion.sample(kind, 3, 0.1);
    if (kind === 'pulse') expect(at100).toBe(0);
    if (kind === 'scatter') expect(at100).toBeLessThan(0);
    if (kind === 'pierce') expect(at100).toBeGreaterThan(0);
    for (let n = 0; n < 1000; n++) {
      motion.fire(kind, 3, n / 20);
      expect(Math.abs(motion.sample(kind, 3, n / 20 + 0.04))).toBeLessThan(9);
    }
    expect(motion.sample(kind, 3, 60)).toBe(0);
  }
});

it('keeps arc discharge finite, frozen on pause and isolated from other weapons and tiers', () => {
  const motion = new WeaponMotion();
  expect(motion.discharge('arc', 3, 0)).toBe(0);
  motion.fire('arc', 3, 10);
  expect(motion.discharge('arc', 3, 10.1)).toBeGreaterThan(0);
  expect(motion.discharge('arc', 3, 10.1)).toBe(motion.discharge('arc', 3, 10.1));
  expect(motion.discharge('pulse', 3, 10.1)).toBe(0);
  expect(motion.discharge('arc', 2, 10.1)).toBe(0);
  expect(motion.discharge('arc', 3, 9)).toBe(0);
  expect(motion.discharge('arc', 3, 10.3)).toBe(0);
  expect(motion.sample('arc', 3, 10.03)).toBeGreaterThan(0);
  expect(motion.sample('arc', 3, 10.1)).toBeLessThan(0);
  expect(motion.sample('arc', 3, 10.17)).toBeGreaterThan(0);
  motion.reset(); expect(motion.discharge('arc', 3, 10.1)).toBe(0);
});
