import { expect, it } from 'vitest';
import { World } from '../src/core/world';
import { C } from '../src/core/config';
import { weaponProfile } from '../src/core/weapons';
import { advanceBody, bossWarningLanes } from '../src/core/behavior';

it('impact feedback keeps the airborne projectile weapon after a weapon switch', () => {
 const w=new World();w.weaponKind='scatter';
 w.spawn('armor',200,400);
 w.bullets.push({id:999,x:200,y:440,px:200,py:440,vx:0,vy:-1200,damage:4,age:0,active:true,hostile:false,weaponKind:'pierce'});
 w.step(C.step,360);
 expect(w.drainEffects().filter(e=>e.type==='impact').map(e=>e.weaponKind)).toEqual(['pierce']);
});
import { timeline, sectorIndex } from '../src/core/director';
import { progressionTarget } from './helpers/progression-driver';

it('five weapon families change trajectory, target count and secondary effects', () => {
  expect(weaponProfile('pulse', 3).vx.every(x => x === 0)).toBe(true);
  expect(weaponProfile('scatter', 3).vx).toEqual([-225, -150, -75, 0, 75, 150, 225]);
  expect(weaponProfile('pierce', 3).targets).toBe(3);
  expect(weaponProfile('blast',3).splashRadius).toBe(130);
  expect(weaponProfile('arc',3).chainHops).toBe(3);
  for (const kind of ['pulse', 'scatter', 'pierce', 'blast', 'arc'] as const) {
    const w = new World(); w.weaponKind = kind; w.growth.stage = 3; w.step(C.step);
    expect(w.bullets.filter(b => !b.hostile)).toHaveLength(weaponProfile(kind, 3).offsets.length);
  }
});

it('piercing damages a body once, reaches the next body, and a gate absorbs it', () => {
  const w = new World(); const near = w.spawn('armor', 360, 600); near.speed = 0;
  w.player.x = w.player.px = 68;
  const far = w.spawn('armor', 360, 450); far.speed = 0;
  const gate = w.spawn('gate', 360, 300); gate.speed = 0;
  w.bullets.push({ id: 999, x: 360, y: 670, px: 360, py: 670, vx: 0, vy: -1200, damage: 5, age: 0, active: true, hostile: false, remainingTargets: 3, hitBodies: [], weaponKind: 'pierce' });
  // Normal shots begin outside this lane and cannot alter these targets.
  for (let frame = 0; frame < 20; frame++) w.step(C.step, 68);
  expect(near.hp).toBe(near.maxHp - 5); expect(far.hp).toBe(far.maxHp - 5);
  expect(gate.energy).toBe(5); expect(w.bullets.some(b => b.id === 999)).toBe(false);
});

it.each(['pulse','scatter','pierce','blast','arc'] as const)('choice %s applies only after pickup, once, without downgrading', kind => {
  const w = new World(); w.growth.stage = 3;
  const box = w.spawn('crate', 360, 800, 2); box.weaponKind = kind; box.row = 42; box.hp = 1; box.speed = 0;
  const other = w.spawn('crate', 500, 800, 2); other.weaponKind = kind === 'pierce' ? 'scatter' : 'pierce'; other.row = 42;
  w.bullets.push({ id: 999, x: 360, y: 860, px: 360, py: 860, vx: 0, vy: -1200, damage: 5, age: 0, active: true, hostile: false });
  w.step(C.step); expect(w.weaponKind).toBe('pulse');
  const pickup = w.bodies.find(b => b.kind === 'pickup')!;
  expect(pickup.weaponKind).toBe(kind); expect(pickup.row).toBe(42);
  pickup.y = C.playerY; pickup.py = pickup.y;
  w.step(C.step);
  expect(w.weaponKind).toBe(kind); expect(w.growth.stage).toBe(3); expect(w.pickups).toBe(1);
  expect(w.bodies.some(b => b.row === 42)).toBe(false);
  const upgrade = w.spawn('pickup', 360, C.playerY, 3); upgrade.speed = 0;
  w.step(C.step); expect(w.weaponKind).toBe(kind);
});

it('each chapter has its own wave composition and includes an early weapon choice', () => {
  const chapters = [1, 2, 3].map(round => timeline(round, 77));
  expect(chapters.map(items => items.find(s => s.kind === 'armory')?.at)).toEqual([16, 16, 16]);
  expect(chapters[1].some(s => s.pattern === 'flank')).toBe(true);
  expect(chapters[2].filter(s => s.pattern === 'fan').length).toBeGreaterThan(chapters[1].filter(s => s.pattern === 'fan').length);
  expect(sectorIndex(4)).toBe(0); expect(JSON.stringify(chapters[0])).not.toBe(JSON.stringify(chapters[1]));
});

it('weaving, diagonal charge and fan fire execute different real movements and emissions', () => {
  const w = new World(); const drone = w.spawn('drone', 360, 300); drone.pattern = 'weave';
  const charge = w.spawn('charger', 160, 300); charge.pattern = 'flank'; charge.lane = 480; charge.age = 2.6;
  const elite = w.spawn('elite', 360, 300); elite.pattern = 'fan'; elite.warning = .6; elite.timer = C.step;
  const shots: number[] = [];
  advanceBody(drone, .5, 'running', 0, () => {}); expect(drone.x).not.toBe(360);
  advanceBody(charge, .5, 'running', 0, () => {}); expect(charge.x).toBe(280);
  advanceBody(elite, C.step, 'running', 0, (_x, _y, vx = 0) => shots.push(vx)); expect(shots).toEqual([-100, 0, 100]);
  const boss = w.spawn('boss', 360, 260); boss.bossVariant = 1; boss.attackCycle = 2; boss.timer = 0;
  advanceBody(boss, C.step, 'boss', 1, () => {}); expect(bossWarningLanes(boss)).toEqual([200, 520]);
  const lanes: number[] = []; advanceBody(boss, 1.35, 'boss', 2.35, x => lanes.push(x));
  expect(lanes).toEqual([200, 200, 200, 200, 520, 520, 520, 520]);
});

it('later chapters introduce their distinct threat before the first upgrade crate', () => {
  const openings = [1, 2, 3].map(round => timeline(round, 77).filter(s => s.at < 8));
  expect(openings[0].every(s => s.kind === 'drone' && !s.pattern)).toBe(true);
  expect(openings[1].some(s => s.kind === 'charger' && s.pattern === 'flank' && s.lane !== s.x)).toBe(true);
  expect(openings[2].some(s => s.kind === 'armor' && s.pattern === 'fan')).toBe(true);
  expect(new Set(openings[2].map(s => s.x)).size).toBe(1);
});

it('normal progression reaches the late T3 weapon choice and upgrades only after collection', () => {
  const w = new World(1337), offered = new Set<string>();
  let target = w.player.x, firstOffer = 0, upgradedAt = 0;
  for (let frame = 0; frame < 70 * 60; frame++) {
    if (frame % 6 === 0) target = progressionTarget(w, 'scatter');
    const before = w.growth.stage;
    w.step(C.step, target); w.drainEffects();
    for (const b of w.bodies) if (b.kind === 'crate' && b.stage === 3 && b.weaponKind) {
      offered.add(b.weaponKind); firstOffer ||= w.time;
    }
    if (before < 3 && w.growth.stage === 3) upgradedAt = w.time;
  }
  expect(offered).toEqual(new Set(['pierce', 'blast']));
  expect(firstOffer).toBeGreaterThanOrEqual(48);
  expect(upgradedAt).toBeGreaterThan(firstOffer);
  expect(upgradedAt).toBeLessThan(65);
  expect(w.activeWeapons).toContain('scatter'); expect(w.player.hp).toBeGreaterThan(0);
});

it('offers both new weapon families in chapter two without waiting for a fourth round',()=>{
 const w=new World(1337,2);const offered=new Set<string>();
 for(let frame=0;frame<18*60;frame++){
  w.step(C.step,68);w.drainEffects();
  for(const b of w.bodies)if(b.kind==='crate'&&b.weaponKind)offered.add(b.weaponKind);
 }
 expect(offered).toEqual(new Set(['blast','arc']));
});
