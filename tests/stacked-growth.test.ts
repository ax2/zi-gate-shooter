import { expect, it } from 'vitest';
import { World } from '../src/core/world';
import { C } from '../src/core/config';
import { grantGate, permanentPower, type Growth } from '../src/core/rewards';

it('picking up another weapon preserves old firing profiles and later duplicates do not remove them', () => {
  const w = new World();
  for (const kind of ['scatter','pierce','blast','arc','scatter'] as const) {
    const pickup = w.spawn('pickup', 360, C.playerY, 3); pickup.weaponKind=kind; pickup.speed=0;
    w.step(C.step); w.drainEffects();
  }
  expect(w.activeWeapons).toEqual(['pulse','scatter','pierce','blast','arc']);
  w.bullets=[];
  const seen=new Set<string>();
  for(let i=0;i<60;i++) {
    w.step(C.step); for(const shot of w.bullets) if(!shot.hostile) seen.add(shot.weaponKind!);
    w.drainEffects();
  }
  expect([...seen].sort()).toEqual(['arc','blast','pierce','pulse','scatter']);
  expect(w.peakBullets).toBeLessThanOrEqual(C.limits.bullets);
});

it('energy keeps rewarding permanent growth beyond T3 and preserves remainder during overload', () => {
  const g:Growth={stage:3,bonus:100,energy:90,overload:4};
  grantGate(g,60,'energy');
  expect(g.energy).toBe(50); expect(g.mastery).toBe(1); expect(g.overload).toBe(6);
  expect(permanentPower(g)).toBe(110);
  for(let i=0;i<100;i++) grantGate(g,100,'energy');
  expect(g.mastery).toBe(101); expect(g.energy).toBe(50);
  expect(permanentPower(g)).toBe(1110);
});

it('a new run clears the collected arsenal and permanent-in-run growth', () => {
  const a=new World(); grantGate(a.growth,200,'energy');
  const b=new World(); expect(b.activeWeapons).toEqual(['pulse']); expect(permanentPower(b.growth)).toBe(0);
});

it('all five weapons and support abilities sustain twenty simulated minutes within the projectile budget', () => {
  const w=new World();w.phase='boss';
  for(const kind of ['scatter','pierce','blast','arc'] as const){
    const p=w.spawn('pickup',360,C.playerY,3);p.weaponKind=kind;p.speed=0;
    w.step(C.step);w.drainEffects();
  }
  w.growth.mastery=10;
  // Empty combat lane isolates maximum sustained emissions, not level survival.
  for(let i=0;i<1200*60;i++){w.step(C.step);w.drainEffects();}
  expect(w.activeWeapons).toHaveLength(5);
  expect(w.peakBullets).toBeLessThanOrEqual(C.limits.bullets);
  expect(w.shots).toBeGreaterThan(40000);
  expect(w.player.hp).toBe(3);
});
