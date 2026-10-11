import { expect, it } from 'vitest';
import { C } from '../src/core/config';
import { World } from '../src/core/world';
import { bossWarningLanes } from '../src/core/behavior';

it('boss alternates A/B, sweeps in two timed beats, mirrors sides and keeps warnings locked', () => {
  const world = new World(); world.phase = 'boss'; world.player.x = 68;
  const boss = world.spawn('boss', 360, 260);
  const warnings: { attack: number; lane: number; time: number }[] = [];
  const batches: { xs: number[]; time: number }[] = [];
  const seen = new Set<number>();
  let previousWarning = 0, lockedLane = boss.lane;
  for (let frame = 0; frame < 55 * 60; frame++) {
    const previousCycle = boss.attackCycle;
    world.step(C.step, 68); world.drainEffects();
    if (previousWarning <= 0 && boss.warning > 0) {
      warnings.push({ attack: boss.attack, lane: boss.lane, time: world.time }); lockedLane = boss.lane;
      expect(bossWarningLanes(boss)).toEqual(boss.attack ? [boss.lane, 360] : [boss.lane]);
    } else if (boss.warning > 0 && boss.attackCycle === previousCycle) expect(boss.lane).toBe(lockedLane);
    if (boss.burst) expect(bossWarningLanes(boss)).toEqual([360]);
    const fresh = world.bullets.filter(b => b.hostile && !seen.has(b.id));
    if (fresh.length) batches.push({ xs: fresh.map(b => b.x), time: world.time });
    for (const shot of fresh) seen.add(shot.id);
    previousWarning = boss.warning;
  }
  expect(warnings.length).toBeGreaterThan(9);
  expect(warnings.map(w => w.attack)).toEqual(warnings.map((_w, i) => i % 2));
  expect(warnings.filter(w => w.attack === 1).slice(0, 4).map(w => w.lane)).toEqual([200, 520, 200, 520]);
  let index = 0;
  for (const warning of warnings) {
    const first = batches[index++]; if (!first) break;
    expect(first.time - warning.time).toBeGreaterThanOrEqual(1.35 - C.step);
    expect(first.xs).toEqual(Array(warning.attack ? 3 : 5).fill(warning.lane));
    if (warning.attack) {
      const second = batches[index++]; if (!second) break;
      expect(second.xs).toEqual([360, 360, 360]);
      expect(second.time - first.time).toBeGreaterThanOrEqual(0.35 - C.step);
      expect(second.time - first.time).toBeLessThanOrEqual(0.35 + C.step + 1e-8);
    }
  }
  expect(world.player.hp).toBe(3); expect(world.attackDeferrals).toBe(0);
});

it('entry freezes boss cooldown and victory cancels an unfinished second beat', () => {
  const world = new World(); world.phase = 'boss-entry';
  const boss = world.spawn('boss', 360, -150); boss.timer = 2.8;
  for (let i = 0; i < 60; i++) { world.step(C.step); world.drainEffects(); }
  expect(boss.timer).toBe(2.8); expect(world.bullets).toHaveLength(0);
  world.phase = 'boss'; boss.y = 260; boss.burst = 1; boss.warning = 0.35; boss.timer = 0.35; boss.hp = 1;
  world.bullets.push({ id: 9999, x: boss.x, y: 380, px: boss.x, py: 380, vx: 0, vy: -1200, damage: 4, age: 0, active: true, hostile: false });
  world.step(C.step); world.drainEffects();
  expect(world.phase).toBe('recovery'); expect(world.bodies).toHaveLength(0);
  for (let i = 0; i < 60; i++) { world.step(C.step); world.drainEffects(); }
  expect(world.bullets).toHaveLength(0); expect(world.player.hp).toBe(3);
});
