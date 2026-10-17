import {C} from '../src/core/config';
import { expect, it } from 'vitest';
import { contextGuide,weaponGuide } from '../src/game/context-guide';
import { World } from '../src/core/world';
it('explains the first gate escort without directing the player to non-existent outer supplies',()=>{
 const w=new World(),b=w.spawn('guard',500,550);b.pattern='convoy';const before=JSON.stringify(w);expect(contextGuide(w).title).toContain('门后护炮');expect(contextGuide(w).detail).toContain('打门');expect(JSON.stringify(w)).toBe(before);w.round=4;expect(contextGuide(w).title).toContain('外侧路线');
});

it('explains actual ace roles, survivor attacks and retreat without mutating the encounter',()=>{
 const w=new World(),b=w.spawn('elite',220,500);b.aceRole='fan';
 expect(contextGuide(w).detail).toContain('针炮纵列连发');b.aceEnraged=true;
 let before=JSON.stringify(w);expect(contextGuide(w).detail).toContain('五线扇射');expect(JSON.stringify(w)).toBe(before);
 b.aceRole='needle';expect(contextGuide(w).detail).toContain('五连快弹');b.y=650;
 before=JSON.stringify(w);expect(contextGuide(w).title).toContain('撤离');expect(JSON.stringify(w)).toBe(before);
 b.active=false;expect(contextGuide(w).title).not.toContain('王牌');
});

it('follows real target state rather than scheduled seconds and never mutates the world', () => {
  const w = new World(); w.time = 30;
  expect(contextGuide(w).kind).toBe('move');
  const box = w.spawn('crate', 240, 180);
  const before = structuredClone(w);
  expect(contextGuide(w).kind).toBe('crate'); expect(w).toMatchObject(before);
  box.active = false;
  expect(contextGuide(w).kind).toBe('move');
  const pickup = w.spawn('pickup', 240, 500);
  expect(contextGuide(w).kind).toBe('pickup');
  w.pickups = 1; pickup.active = false;
  w.spawn('crate', 480, 600);
  expect(contextGuide(w).kind).toBe('move');
});

it('teaches actual gate row choice and stops after learning; a missed row grants nothing', () => {
  const w = new World(); const a = w.spawn('gate', 222, 400); a.row = 7;
  expect(contextGuide(w).kind).toBe('gate');
  const b = w.spawn('gate', 498, 400); b.row = 8;
  expect(contextGuide(w).kind).toBe('gate'); // Two independent rows are not an exclusive pair.
  b.row = 7; expect(contextGuide(w).kind).toBe('pair');
  w.gatesTaken = 1; expect(contextGuide(w).kind).toBe('pair');
  w.gatesTaken = 2; expect(contextGuide(w).kind).toBe('move');
  w.gatesTaken = 0; a.y = b.y = 1025;
  expect(contextGuide(w).kind).toBe('move'); expect(w.growth.bonus).toBe(0);
  a.y = b.y = 600; expect(contextGuide(w).kind).toBe('pair');
});

it('ignores offscreen targets, later rounds and boss/recovery phases and resets with a new world', () => {
  const w = new World(); const b = w.spawn('crate', 240, -80);
  expect(contextGuide(w).kind).toBe('move'); b.y = 180;
  w.round = 2; expect(contextGuide(w).kind).toBe('move'); w.round = 1;
  for (const phase of ['boss-entry', 'boss', 'recovery', 'dead'] as const) { w.phase = phase; expect(contextGuide(w).kind).toBe('move'); }
  const fresh = new World(); fresh.spawn('crate', 240, 180); expect(contextGuide(fresh).kind).toBe('crate');
});

it('keeps weapon choice guidance in later chapters without repeating basic tutorials', () => {
  const w = new World(); w.round = 5; w.pickups = 12; w.gatesTaken = 12;
  const box = w.spawn('crate', 240, 500); box.weaponKind = 'pierce';
  const before = structuredClone(w);
  expect(contextGuide(w).title).toBe('对准一箱，增加火力能力');
  expect(w).toMatchObject(before);
  box.active = false;
  const drop = w.spawn('pickup', 240, 500); drop.weaponKind = 'pierce';
  expect(contextGuide(w).detail).toContain('已有武器继续开火');
  drop.y = 140; expect(contextGuide(w).kind).toBe('move');
  drop.y = 500; w.phase = 'boss'; expect(contextGuide(w).kind).toBe('move');
  w.phase = 'running'; drop.active = false;
  w.spawn('crate', 240, 500); w.spawn('gate', 480, 500);
  expect(contextGuide(w).kind).toBe('move');
});

it('explains in-flight bullets during the second blockade and removes help after the attack',()=>{
 const w=new World();w.phase='boss';const b=w.spawn('boss',360,C.bossY);b.attack=3;b.warning=1.8;b.burst=1;
 expect(contextGuide(w).detail).toContain('仍在飞行');
 b.warning=0;expect(contextGuide(w).kind).toBe('move');
 b.warning=1.8;b.active=false;expect(contextGuide(w).kind).toBe('move');
});

it('prioritizes charging threats over rewards and clears stale enemy guidance', () => {
  const w = new World(); w.round = 2;
  const pickup = w.spawn('pickup', 360, 500); pickup.weaponKind = 'arc';
  const guard = w.spawn('guard', 220, 320); guard.burst = 0;
  expect(contextGuide(w).kind).toBe('pickup');
  guard.warning = 0.8; guard.burst = 1;
  expect(contextGuide(w).title).toContain('盾卫开盾');
  const sniper = w.spawn('sniper', 500, 320); sniper.warning = 1.2;
  expect(contextGuide(w).detail).toContain('命中不会打断');
  sniper.active = false; guard.warning = 0;
  expect(contextGuide(w).kind).toBe('pickup');
  pickup.active = false; guard.burst = 0;
  expect(contextGuide(w).detail).toContain('挡住穿甲与跳电');
  guard.y = 700; expect(contextGuide(w).kind).toBe('move');
  guard.y = 320; guard.active = false; expect(contextGuide(w).kind).toBe('move');
});


it.each(['seeker','spread'] as const)('weapon brief uses the actual %s build rather than a lower base jump count',branch=>{
 const w=new World();w.growth.mastery=3;for(let i=0;i<3;i++)w.chooseBuild('electric',i===1?branch:undefined);w.phase='recovery';const p=w.spawn('pickup',360,C.playerY,3);p.weaponKind='arc';w.step(C.step,360);w.drainEffects();
 const json=JSON.stringify(w),profile=w.profileFor('arc'),stage=w.weaponStage('arc');expect(stage).toBe(3);expect(profile.chainHops).toBe(branch==='spread'?5:4);
 expect(weaponGuide('arc',stage,profile).detail).toContain(`追加${profile.chainHops}次跳电`);expect(weaponGuide('arc',stage).detail).toContain('追加3次跳电');expect(JSON.stringify(w)).toBe(json);
});
