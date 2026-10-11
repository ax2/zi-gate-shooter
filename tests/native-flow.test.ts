import { expect, it } from 'vitest';
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { defaults } from '../src/ui/storage';

it('native back pauses and preserves a live run, then returns a result to menu', async () => {
  let time = 1000, nextFrame: FrameRequestCallback = () => {};
  const context = new Proxy({}, { get: () => () => {} }) as CanvasRenderingContext2D;
  let silence = 0;
  const runtime = new CanvasRuntime({
    canvas: { getContext: () => context } as unknown as HTMLCanvasElement,
    width: 390, height: 844, dpr: 3, menuBottom: 0,
    image: async () => ({ width: 768, height: 512 }) as HTMLImageElement,
    read: () => defaults(), write: () => {}, sound: () => {}, silence: () => { silence++; },
    now: () => time, requestFrame: callback => { nextFrame = callback; return 0; },
  });
  await runtime.load();
  expect(runtime.back()).toBe('exit');
  runtime.start(); runtime.world.growth.bonus = 60;
  expect(runtime.back()).toBe('stay'); expect(runtime.diagnostics().mode).toBe('paused');
  expect(runtime.back()).toBe('stay'); expect(runtime.world.growth.bonus).toBe(60);
  for (let frame = 0; frame < 60; frame++) { time += 17; nextFrame(time); }
  expect(runtime.world.time).toBe(0); expect(silence).toBeGreaterThan(0);
  runtime.start(); runtime.world.player.hp = 0; time += 17; nextFrame(time);
  expect(runtime.diagnostics().mode).toBe('result');
  expect(runtime.back()).toBe('stay'); expect(runtime.diagnostics().mode).toBe('menu');
  expect(runtime.back()).toBe('exit');
});

it('opening licenses from paused settings preserves the exact World and requires explicit resume', async () => {
  let time = 1000, next: FrameRequestCallback = () => {}, opened = 0;
  const context = new Proxy({}, { get: () => () => {} }) as CanvasRenderingContext2D;
  const runtime = new CanvasRuntime({
    canvas: { getContext: () => context } as unknown as HTMLCanvasElement,
    width: 720, height: 1280, dpr: 1, menuBottom: 0,
    image: async () => ({ width: 768, height: 512 }) as HTMLImageElement,
    read: defaults, write: () => {}, sound: () => {}, silence: () => {},
    now: () => time, requestFrame: fn => { next = fn; }, openLicenses: () => { opened++; runtime.hide(); },
  });
  await runtime.load(); runtime.start();
  const frame = () => { time += 17; next(time); };
  const click = (y: number) => { runtime.touchStart(1, 360, y); runtime.touchEnd(1, 360, y); frame(); };
  for (let i = 0; i < 10; i++) frame();
  const world = runtime.world, elapsed = world.time;
  runtime.pause(); frame(); click(713); click(953);
  expect(opened).toBe(1); expect(runtime.mode).toBe('settings');
  for (let i = 0; i < 60; i++) frame();
  expect(runtime.world).toBe(world); expect(world.time).toBe(elapsed);
  expect(runtime.back()).toBe('stay'); expect(runtime.mode).toBe('paused'); frame();
  expect(world.time).toBe(elapsed);
  click(603); frame();
  expect(runtime.mode).toBe('playing'); expect(world.time).toBeGreaterThan(elapsed);
});
