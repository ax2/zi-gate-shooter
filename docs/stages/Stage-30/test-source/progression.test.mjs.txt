import { writeFileSync, mkdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { C } from '../src/core/config';
import { World } from '../src/core/world';
import { progressionTarget } from './helpers/progression-driver';

it.each([{ seed: 1337, openingX: 360 }, { seed: 1, openingX: C.minX }, { seed: 77, openingX: C.maxX }])(
  '20-minute normal growth and boss cycles: seed $seed / opening $openingX', ({ seed, openingX }) => {
    const seconds = 1200;
    const world = new World(seed);
    const milestones = [];
    const victories = [], stages = [], crateLanes = new Set(), firstEquipmentEvents = [];
    const hostileIds = new Set();
    let target = world.player.x, overloads = 0, bossKills = 0, hurt = 0;
    let invalidState = false;
    expect(world.growth).toEqual({ stage: 1, bonus: 0, energy: 0, overload: 0 });
    expect(world.player).toMatchObject({ x: 360, hp: 3, invulnerable: 0 });
    for (let frame = 0; frame < seconds * 60; frame++) {
      if (frame % 6 === 0) target = frame < 60 ? openingX : progressionTarget(world);
      const beforeStage = world.growth.stage, beforeRound = world.round, beforePickups = world.pickups;
      world.step(C.step, target);
      for (const event of world.drainEffects()) {
        if (event.type === 'overload') overloads++;
        if (event.type === 'boss-kill') { bossKills++; victories.push(+world.time.toFixed(3)); }
        if (event.type === 'hurt') hurt++;
        if (['crate-break', 'upgrade'].includes(event.type) && firstEquipmentEvents.length < 4)
          firstEquipmentEvents.push({ event: event.type, time: +world.time.toFixed(3), stage: world.growth.stage, pickups: world.pickups });
      }
      for (const body of world.bodies) if (body.kind === 'crate') crateLanes.add(body.x);
      for (const bullet of world.bullets) if (bullet.hostile) hostileIds.add(bullet.id);
      if (beforeStage !== world.growth.stage) stages.push(world.time);
      if (beforeStage !== world.growth.stage || beforeRound !== world.round)
        milestones.push({ time: +world.time.toFixed(3), stage: world.growth.stage, round: world.round, hp: world.player.hp, bonus: world.growth.bonus,
          pickups: world.pickups, gates: world.gatesTaken, cratesBroken: world.cratesBroken });
      invalidState ||= ![world.score, world.player.x, world.growth.bonus, world.growth.energy, world.growth.overload].every(Number.isFinite)
        || world.growth.bonus < 0 || world.growth.bonus > 100 || world.growth.energy < 0 || world.growth.energy > 100
        || world.player.hp < 0 || world.player.hp > 3 || world.growth.overload < 0 || world.growth.overload > 6
        || world.growth.stage < 1 || world.growth.stage > 3
        || (beforeStage !== world.growth.stage && world.pickups !== beforePickups + 1)
        || world.bodies.some(b => ![b.x, b.y, b.hp, b.energy].every(Number.isFinite))
        || world.bullets.some(b => ![b.x, b.y, b.damage].every(Number.isFinite));
      if (world.phase === 'dead') break;
    }
    const result = { seed, openingX, requestedSeconds: seconds, time: +world.time.toFixed(3), phase: world.phase, round: world.round,
      stage: world.growth.stage, hp: world.player.hp, bonus: world.growth.bonus, score: world.score,
      pickups: world.pickups, gates: world.gatesTaken, overloads, bossKills, hurt, hostileProjectilesObserved: hostileIds.size,
      crateLanes: [...crateLanes].sort(), victories, firstEquipmentEvents,
      peakBodies: world.peakBodies, peakBullets: world.peakBullets, milestones,
      scope: 'fixed-step simulation; omniscient test operator; no rendered, human or device acceptance' };
    mkdirSync('build/qa/Stage-30/progression', { recursive: true });
    writeFileSync(`build/qa/Stage-30/progression/seed-${seed}.json`, JSON.stringify(result, null, 2) + '\n');
    expect(world.phase, JSON.stringify(result)).not.toBe('dead');
    expect(invalidState).toBe(false);
    expect(world.time).toBeCloseTo(seconds, 3);
    expect(world.growth.stage).toBe(3);
    expect(world.pickups).toBeGreaterThanOrEqual(2);
    expect(world.gatesTaken).toBeGreaterThanOrEqual(4);
    expect(world.growth.bonus).toBe(100);
    expect(overloads).toBeGreaterThan(0);
    expect(stages).toHaveLength(2);
    expect(firstEquipmentEvents.map(({ event, stage, pickups }) => ({ event, stage, pickups }))).toEqual([
      { event: 'crate-break', stage: 1, pickups: 0 }, { event: 'upgrade', stage: 2, pickups: 1 },
      { event: 'crate-break', stage: 2, pickups: 1 }, { event: 'upgrade', stage: 3, pickups: 2 },
    ]);
    expect(firstEquipmentEvents[0].time).toBeLessThan(firstEquipmentEvents[1].time);
    expect(firstEquipmentEvents[2].time).toBeLessThan(firstEquipmentEvents[3].time);
    expect(stages[0]).toBeLessThan(20);
    expect(stages[1]).toBeLessThan(65);
    expect(victories[0]).toBeLessThan(95);
    expect(hostileIds.size).toBeGreaterThan(0);
    expect(crateLanes).toEqual(new Set([240, 480]));
    expect(bossKills).toBeGreaterThanOrEqual(10);
    expect(world.round).toBe(bossKills + 1);
    expect(world.peakBodies).toBeLessThanOrEqual(C.limits.enemies + C.limits.rewards);
    expect(world.peakBullets).toBeLessThanOrEqual(C.limits.bullets + C.limits.hostile);
  }, 120000);
