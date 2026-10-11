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
