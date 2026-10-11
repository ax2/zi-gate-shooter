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
