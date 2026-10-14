import { expect, it } from 'vitest';
import { WeaponMotion } from '../src/game/weapon-motion';

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
