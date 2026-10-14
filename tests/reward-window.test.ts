import { expect, it } from 'vitest';
import { C } from '../src/core/config';
import { World } from '../src/core/world';

it.each([false,true])('paired gates offer power versus charge until power is capped (capped=%s)', capped => {
 const w=new World();w.growth.bonus=capped?100:20;
 w.player.x=C.minX;w.player.invulnerable=100;
 for(let i=0;i<28*60;i++){w.step(C.step,C.minX);w.drainEffects();}
 const gates=w.bodies.filter(b=>b.kind==='gate');
 const pair=gates.filter(b=>gates.some(other=>other!==b&&other.row===b.row)).sort((a,b)=>a.x-b.x);
 expect(pair).toHaveLength(2);
 expect(pair.map(g=>g.rewardKind)).toEqual(capped?['energy','energy']:['power','energy']);
 expect(pair[0].row).toBe(pair[1].row);
 expect(w.gatesTaken).toBe(0);expect(w.growth.energy).toBe(0);
});

it('minimum intended stages can break and collect each crate after reaction and lateral travel', () => {
  for (const [stage, reward] of [[1, 2], [2, 3]]) {
    const world = new World(); world.phase = 'boss'; world.player.x = 500;
    world.growth.stage = stage;
    world.spawn('crate', 240, 180, reward);
    let breakTime = Infinity, pickupTime = Infinity;
    for (let frame = 0; frame < 7 * 60; frame++) {
      world.step(C.step, frame < 27 ? 500 : 240);
      for (const effect of world.drainEffects()) {
        if (effect.type === 'crate-break') breakTime = world.time;
        if (effect.type === 'upgrade') pickupTime = world.time;
      }
    }
    expect(world.player.hp).toBe(3); expect(world.cratesBroken).toBe(1); expect(world.pickups).toBe(1);
    expect(world.growth.stage).toBe(reward);
    expect(breakTime).toBeLessThan((C.playerY - 180) / C.scrollSpeed - 1);
    expect(pickupTime).toBeGreaterThan(breakTime);
  }
});

it('an intervening full gate blocks shots until it crosses, without crediting the hidden crate', () => {
  const world = new World(); world.phase = 'boss';
  world.spawn('crate', 360, 180, 3);
  const gate = world.spawn('gate', 360, 400); gate.row = 1; gate.energy = 144;
  for (let frame = 0; frame < 60; frame++) { world.step(C.step); world.drainEffects(); }
  const crate = world.bodies.find(b => b.kind === 'crate');
  expect(crate?.hp).toBe(crate?.maxHp); expect(world.cratesBroken).toBe(0);
  for (let frame = 0; frame < 5 * 60; frame++) { world.step(C.step); world.drainEffects(); }
  // The deliberate bad layout grants no guaranteed equipment: it needs replay
  // checks, not paper DPS multiplication. This is a negative control.
  expect(world.gatesTaken).toBe(1); expect(world.pickups).toBe(0);
  expect(world.cratesBroken).toBe(0); expect(world.player.hp).toBe(2);
});

it('authored first loop supports actual T1 to T3 growth, gate choices and boss victory', () => {
  for (const seed of [1, 17, 77]) {
    const world = new World(seed);
    const milestones: Record<string, number> = {};
    for (let frame = 0; frame < 100 * 60 && world.round === 1 && world.phase !== 'dead'; frame++) {
      const t = world.time;
      const boss = world.bodies.find(b => b.kind === 'boss');
      const x = boss ? boss.x : t < 8 ? 360 : t < 14 ? 240 : t < 26 ? 360 : t < 33 ? 222
        : t < 49 ? 500 : t < 53.35 ? 240 : t < 55 ? 500 : t < 64 ? 222 : 360;
      world.step(C.step, x);
      for (const effect of world.drainEffects()) {
        if (effect.type === 'upgrade') milestones[`T${world.growth.stage}`] = world.time;
        if (effect.type === 'boss-kill') milestones.victory = world.time;
      }
    }
    expect(world.phase, `seed ${seed}`).not.toBe('dead');
    expect(milestones.T2, `seed ${seed} T2`).toBeLessThan(15);
    expect(milestones.T3, `seed ${seed} T3`).toBeLessThan(54);
    expect(milestones.victory, `seed ${seed} victory`).toBeLessThan(100);
    expect(world.round).toBe(2); expect(world.gatesTaken).toBeGreaterThanOrEqual(3);
  }
});

