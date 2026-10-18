import { describe, expect, it } from 'vitest';
import { C } from '../src/core/config';
import { sweep } from '../src/core/collision';
import { gateValue, grantEquipment, grantGate } from '../src/core/rewards';
import { World } from '../src/core/world';
import { timeline } from '../src/core/director';

const run = (w: World, seconds: number, x = 360) => { for (let t = 0; t < Math.round(seconds * 60); t++) { w.step(C.step, x); w.drainEffects(); } };

describe('reward invariants', () => {
  it('handles threshold boundaries and multi-tier charging', () => {
    expect([0, 23.99, 24, 56, 96, 144, 999].map(value => gateValue(value))).toEqual([10, 10, 15, 20, 25, 30, 30]);
  });
  it('adds percentages and converts cap overflow', () => {
    const g = { stage: 1, bonus: 0, energy: 0, overload: 0 };
    grantGate(g, 20, 'power'); grantGate(g, 20, 'power'); expect(g.bonus).toBe(40);
    g.bonus = 95; const result = grantGate(g, 30, 'power');
    expect([g.bonus, g.energy, result.power, result.energy]).toEqual([100, 25, 5, 25]);
  });
  it('keeps equipment tier while repeated charge grants permanent breakthroughs without losing remainder', () => {
    const g = { stage: 2, bonus: 100, energy: 70, overload: 0 };
    grantEquipment(g, 2); expect(g.stage).toBe(2); expect(g.overload).toBe(6); expect(g.energy).toBe(0);
    grantGate(g, 100, 'energy'); grantEquipment(g, 1);
    expect(g.overload).toBe(6); expect(g.energy).toBe(30); expect(g.stage).toBe(2);
    expect(g).toMatchObject({mastery:2});
  });
});

describe('continuous collision', () => {
  it('detects a fast bullet crossing a moving target', () => {
    expect(sweep(360, 1000, 360, 100, 360, 500, 360, 510, 20, 20)).toBeCloseTo(480 / 910);
    expect(sweep(100, 1000, 100, 100, 360, 500, 360, 510, 20, 20)).toBeNull();
  });
});

describe('simulation transactions', () => {
  it('box breaking does not immediately grant equipment', () => {
    const w = new World(); w.spawn('crate', 360, 600, 2);
    run(w, 2);
    expect(w.cratesBroken).toBe(1); expect(w.growth.stage).toBe(1);
    expect(w.bodies.some(b => b.kind === 'pickup')).toBe(true);
    run(w, 0.5); expect(w.growth.stage).toBe(2); expect(w.pickups).toBe(1);
  });
  it('unbroken crate collision removes it without reward', () => {
    const w = new World(); w.spawn('crate', 360, 970, 3); w.step(C.step);
    expect(w.player.hp).toBe(2); expect(w.pickups).toBe(0); expect(w.bodies.some(b => b.kind === 'pickup')).toBe(false);
  });
  it('only one gate in a row can be collected, even after crossing sideways', () => {
    const w = new World(); w.player.x = 222;
    const a = w.spawn('gate', 222, 1023), b = w.spawn('gate', 498, 1023); a.row = b.row = 10;
    w.step(C.step, 222); expect(w.gatesTaken).toBe(1); expect(w.growth.bonus).toBe(10);
    run(w, 0.5, 498); expect(w.gatesTaken).toBe(1);
  });
  it('crossing through a gap locks and misses the whole row', () => {
    const w = new World();
    // 80px physical gap leaves room for the 40px cockpit collision circle.
    const a = w.spawn('gate', 200, 1023), b = w.spawn('gate', 520, 1023); a.row = b.row = 10;
    w.step(C.step); expect(w.gatesTaken).toBe(0); expect(w.bodies.length).toBe(0);
  });
  it('overlapping gate contact lips choose only one reward at the exact center',()=>{
    const w=new World(),a=w.spawn('gate',222,1023),b=w.spawn('gate',498,1023);a.row=b.row=10;
    w.step(C.step,360);expect(w.gatesTaken).toBe(1);expect(w.growth.bonus).toBe(10);expect(w.bodies).toHaveLength(0);
  });
  it('lethal contact prevents same-time pickup and cannot resurrect', () => {
    const w = new World(); w.player.hp = 1;
    w.spawn('crate', 360, 1024, 3); w.spawn('pickup', 360, 1024, 3);
    w.step(C.step); expect(w.phase).toBe('dead'); expect(w.growth.stage).toBe(1); expect(w.pickups).toBe(0);
    const score = w.score; w.step(C.step); expect(w.score).toBe(score);
  });
  it('freezes simulation when step is not called and does not share state across runs', () => {
    const a = new World(), b = new World(); a.growth.bonus = 70; a.growth.overload = 4;
    const snapshot = JSON.stringify(a); expect(JSON.stringify(a)).toBe(snapshot);
    expect(b.growth.bonus).toBe(0); expect(b.growth.overload).toBe(0);
  });
  it('the nearest reward absorbs shots instead of charging a gate behind it', () => {
    const w = new World(); w.spawn('crate', 360, 800, 3); const g = w.spawn('gate', 360, 500); g.row = 1;
    run(w, 0.2); expect(g.energy).toBe(0);
  });
  it('all three weapon outputs match their per-pellet configuration', () => {
    expect(C.weapon.map(w => w.rate * w.damage.reduce((a, b) => a + b, 0))).toEqual([32, 48, 72]);
  });
  it('seeded timelines reproduce and always finish normal spawns before boss', () => {
    for (let seed = 1; seed <= 100; seed++) for (let round = 1; round <= 3; round++) {
      const waves = timeline(round, seed); expect(waves).toEqual(timeline(round, seed));
      expect(waves.every(s => s.x >= 68 && s.x <= 652 && s.at < 72)).toBe(true);
    }
  });
});
