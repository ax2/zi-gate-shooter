import { expect, it } from 'vitest';
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { defaults } from '../src/ui/storage';
import { World } from '../src/core/world';
import { C } from '../src/core/config';

function fixture(weak = false) {
  let clock = 0, next: FrameRequestCallback = () => {};
  const calls: Array<{ kind: string; args: any[]; alpha: number; color: unknown }> = [];
  const state: Record<string, any> = { globalAlpha: 1 };
  const stack: Record<string, any>[] = [];
  const context = new Proxy(state, { get(target, key: string) {
    if (key in target) return target[key];
    if (key === 'save') return () => stack.push({ ...state });
    if (key === 'restore') return () => Object.assign(state, stack.pop());
    return (...args: any[]) => calls.push({ kind: key, args, alpha: state.globalAlpha, color: state.fillStyle });
  } });
  const save = defaults(); save.settings.effects = weak ? 'weak' : 'standard';
  const runtime = new CanvasRuntime({ canvas: { getContext: () => context } as unknown as HTMLCanvasElement,
    width: 720, height: 1280, dpr: 1, menuBottom: 0,
    image: async src => ({ src, width: 768, height: src.includes('explosion') ? 768 : 512 }) as HTMLImageElement,
    read: () => save, write() {}, sound() {}, silence() {}, now: () => clock,
    requestFrame: callback => { next = callback; } });
  return { runtime, calls, tick() { calls.length = 0; clock += 1000 / 60; next(clock); } };
}
const blasts = (f: ReturnType<typeof fixture>) => f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('explosion-v1.png'));

it('plays every atlas cell, freezes on pause, and retires completed effects', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  // Explicit renderer fixture: an event supplied to the real frame loop, not a normal-play result.
  f.runtime.world.emit('kill', 360, 600);
  const cells = new Set<string>();
  for (let i = 0; i < 29; i++) {
    f.tick(); for (const call of blasts(f)) {
      expect(call.args.slice(3, 5)).toEqual([256, 256]);
      cells.add(`${call.args[1]},${call.args[2]}`);
    }
    if (i === 4) {
      const cell = blasts(f)[0].args.slice(1, 3);
      f.runtime.pause(); for (let p = 0; p < 10; p++) { f.tick(); expect(blasts(f)[0].args.slice(1, 3)).toEqual(cell); }
      f.runtime.touchStart(1, 360, 560); f.runtime.touchEnd(1, 360, 560);
    }
  }
  expect(cells.size).toBe(9); expect(blasts(f)).toHaveLength(0);
});

it.each([false, true])('keeps hostile cores and gate numbers above capped explosions (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  f.runtime.world.spawn('gate', 360, 600);
  f.runtime.world.bullets.push({ id: 9999, x: 360, y: 600, px: 360, py: 600, vx: 0, vy: 0,
    damage: 1, age: 0, active: true, hostile: true });
  for (let i = 0; i < 8; i++) f.runtime.world.emit('kill', 360, 600);
  f.tick(); expect(blasts(f)).toHaveLength(4);
  const finalBlast = f.calls.lastIndexOf(blasts(f).at(-1)!);
  const hostileCore = f.calls.findIndex(c => c.kind === 'fillRect' && c.color === '#ffead7');
  const gateNumber = f.calls.findIndex(c => c.kind === 'fillText' && /^\+\d+%$/.test(c.args[0]));
  expect(hostileCore).toBeGreaterThan(finalBlast); expect(gateNumber).toBeGreaterThan(finalBlast);
  expect(blasts(f)[0].alpha).toBeLessThanOrEqual(weak ? 0.5 : 0.9);
  expect(f.runtime.world.player.hp).toBe(3);
});

function bossKillFixture(world: World) {
  world.time = 80; world.roundTime = 80;
  world.phase = 'boss'; world.player.hp = 2;
  const boss = world.spawn('boss', 360, 260); boss.hp = 4;
  world.bullets.push({ id: 9999, x: 360, y: 270, px: 360, py: 270, vx: 0, vy: 0,
    damage: 4, age: 0, active: true, hostile: false });
}

it.each([false, true])('a real boss kill presents distinct beats without changing recovery or rewards (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const reference = new World(); bossKillFixture(reference); bossKillFixture(f.runtime.world);
  const locations = new Set<string>(); let peak = 0;
  for (let i = 0; i < 250; i++) {
    f.tick(); reference.step(C.step, 360); reference.drainEffects();
    if (i === 0) expect(f.calls.some(c => c.kind === 'fillText' && String(c.args[0]).startsWith('首领击破') && c.args[2] === 820)).toBe(true);
    expect(f.runtime.world.phase).toBe(reference.phase);
    expect(f.runtime.world.round).toBe(reference.round);
    expect(f.runtime.world.player.hp).toBe(reference.player.hp);
    expect(f.runtime.world.score).toBe(reference.score);
    peak = Math.max(peak, blasts(f).length);
    for (const b of blasts(f)) locations.add(`${Math.round(b.args[5] + b.args[7] / 2)},${Math.round(b.args[6] + b.args[8] / 2)}`);
    const fragments = f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('units.png') && c.args[3] < 190);
    expect(fragments.length).toBe(i < 80 ? 3 : 0);
    if (i === 8) expect(blasts(f).length).toBe(1);
    if (i === 12) expect(blasts(f).length).toBe(2);
    if (i === 24) expect(blasts(f).length).toBe(3);
    if (i > 72) expect(blasts(f)).toHaveLength(0);
  }
  expect(locations.size).toBe(4); expect(peak).toBeLessThanOrEqual(4);
  expect(f.runtime.world.score).toBe(C.enemies.boss.score);
  expect(f.runtime.world.player.hp).toBe(3); expect(f.runtime.world.round).toBe(2);
});

it('freezes the boss sequence during pause and discards it on restart', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start(); bossKillFixture(f.runtime.world); f.tick();
  const before = f.runtime.diagnostics().bossDestructionAge;
  f.runtime.pause(); for (let i = 0; i < 40; i++) f.tick();
  expect(f.runtime.diagnostics().bossDestructionAge).toBe(before);
  expect(blasts(f)).toHaveLength(1);
  f.runtime.start(); f.tick(); expect(f.runtime.diagnostics().bossDestructionAge).toBeNull();
  expect(blasts(f)).toHaveLength(0); expect(f.runtime.world.score).toBe(0);
});

it('makes room within the four-blast budget and clears pending boss beats on returning home', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  for (let i = 0; i < 8; i++) f.runtime.world.emit('kill', 200, 600);
  bossKillFixture(f.runtime.world); f.tick(); expect(blasts(f)).toHaveLength(4);
  expect(blasts(f).some(b => Math.round(b.args[5] + b.args[7] / 2) === 248)).toBe(true);
  f.runtime.pause(); f.tick(); f.runtime.touchStart(1, 360, 780); f.runtime.touchEnd(1, 360, 780);
  for (let i = 0; i < 90; i++) f.tick();
  expect(f.runtime.mode).toBe('menu'); expect(f.runtime.diagnostics().bossDestructionAge).toBeNull();
  expect(blasts(f)).toHaveLength(0);
});
