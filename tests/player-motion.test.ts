import { expect, it } from 'vitest';
import { PlayerMotion } from '../src/game/player-motion';

it('keeps idle legs planted and freezes every pose component at unchanged simulation time', () => {
  const motion = new PlayerMotion();
  expect(motion.sample(360, 1)).toEqual({ left: 0, right: -0, bob: -0 });
  const pose = motion.sample(388, 1.05);
  expect(pose.left).toBeGreaterThan(0);
  expect(pose.right).toBe(-pose.left);
  for (let i = 0; i < 100; i++) expect(motion.sample(388, 1.05)).toEqual(pose);
  expect(Math.abs(motion.sample(388, 2).left)).toBeLessThan(0.001);
  motion.reset(); expect(motion.sample(360, 0).left).toBe(0);
});

it('bounds the gait while reversing and produces matching poses at 30 and 60 Hz for constant velocity', () => {
  function run(hz: number) {
    const m = new PlayerMotion();
    let pose = m.sample(360, 0);
    for (let i = 1; i <= hz / 2; i++) pose = m.sample(360 + 400 * i / hz, i / hz);
    return pose;
  }
  const slow = run(30), fast = run(60);
  expect(slow.left).toBeCloseTo(fast.left, 8); expect(slow.bob).toBeCloseTo(fast.bob, 8);
  const m = new PlayerMotion();
  for (let i = 1; i < 360; i++) {
    const p = m.sample(360 + Math.sin(i / 12) * 200, i / 60);
    expect(Math.abs(p.left)).toBeLessThanOrEqual(4);
    expect(Math.abs(p.right)).toBeLessThanOrEqual(4);
    expect(Math.abs(p.bob)).toBeLessThanOrEqual(1);
  }
  expect(m.sample(360, 0).left).toBe(0);
});
