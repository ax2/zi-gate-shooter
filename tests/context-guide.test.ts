import { expect, it } from 'vitest';
import { contextGuide } from '../src/game/context-guide';
import { World } from '../src/core/world';

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
  expect(contextGuide(w).title).toBe('选择武器：对准其中一箱');
  expect(w).toMatchObject(before);
  box.active = false;
  const drop = w.spawn('pickup', 240, 500); drop.weaponKind = 'pierce';
  expect(contextGuide(w).detail).toContain('换装不会降阶');
  drop.y = 140; expect(contextGuide(w).kind).toBe('move');
  drop.y = 500; w.phase = 'boss'; expect(contextGuide(w).kind).toBe('move');
  w.phase = 'running'; drop.active = false;
  w.spawn('crate', 240, 500); w.spawn('gate', 480, 500);
  expect(contextGuide(w).kind).toBe('move');
});

it('explains in-flight bullets during the second blockade and removes help after the attack',()=>{
 const w=new World();w.phase='boss';const b=w.spawn('boss',360,260);b.attack=3;b.warning=1.8;b.burst=1;
 expect(contextGuide(w).detail).toContain('仍在飞行');
 b.warning=0;expect(contextGuide(w).kind).toBe('move');
 b.warning=1.8;b.active=false;expect(contextGuide(w).kind).toBe('move');
});
