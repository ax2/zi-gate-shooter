import { expect, it } from 'vitest';
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { defaults } from '../src/ui/storage';

async function fixture() {
  let time = 1000, next: FrameRequestCallback = () => {};
  const context = new Proxy({}, { get: () => () => {} }) as CanvasRenderingContext2D;
  const runtime = new CanvasRuntime({
    canvas: { getContext: () => context } as unknown as HTMLCanvasElement,
    width: 720, height: 1280, dpr: 1, menuBottom: 0,
    image: async () => ({ width: 768, height: 512 }) as HTMLImageElement,
    read: defaults, write: () => {}, sound: () => {}, silence: () => {},
    now: () => time, requestFrame: callback => { next = callback; },
  });
  const frames = (count: number) => { for (let i = 0; i < count; i++) { time += 1000 / 60; next(time); } };
  await runtime.load(); runtime.start(); frames(1);
  runtime.touchStart(1, 360, 1000); runtime.touchMove(1, 650, 1000); frames(1);
  expect(runtime.world.player.x).toBeGreaterThan(360);
  expect(runtime.world.player.x).toBeLessThan(650);
  return { runtime, frames };
}

it.each(['release', 'cancel', 'resize'] as const)('%s stops pending lateral travel at the actual position', async reason => {
  const { runtime, frames } = await fixture();
  const releasedAt = runtime.world.player.x;
  if (reason === 'release') runtime.touchEnd(1, 650, 1000);
  else if (reason === 'cancel') runtime.cancelTouch();
  else runtime.resize(390, 844, 3);
  frames(30);
  expect(runtime.world.player.x).toBeCloseTo(releasedAt, 8);
  expect(runtime.world.time).toBeGreaterThan(.5); // Firing/simulation must continue.
});

it('a second finger cannot steal or release the active drag', async () => {
  const { runtime, frames } = await fixture();
  const before = runtime.world.player.x;
  runtime.touchStart(2, 360, 1000); runtime.touchMove(2, 68, 1000); runtime.touchEnd(2, 68, 1000);
  runtime.cancelTouch(2); // Secondary pointer capture loss must not cancel finger 1.
  frames(3);
  expect(runtime.world.player.x).toBeGreaterThan(before);
  runtime.touchEnd(1, 650, 1000);
  const stopped = runtime.world.player.x;
  frames(3); expect(runtime.world.player.x).toBeCloseTo(stopped, 8);
});

it('background resume requires a fresh drag and does not replay old movement or frame samples', async () => {
  const { runtime, frames } = await fixture();
  const stopped = runtime.world.player.x, gameTime = runtime.world.time;
  runtime.hide(); frames(120); runtime.show();
  expect(runtime.diagnostics().mode).toBe('paused');
  expect(runtime.world.time).toBe(gameTime);
  runtime.touchMove(1, 68, 1000); frames(1);
  runtime.touchStart(2, 360, 603); runtime.touchEnd(2, 360, 603); // Visible resume button.
  frames(3);
  expect(runtime.diagnostics().mode).toBe('playing');
  expect(runtime.world.player.x).toBeCloseTo(stopped, 8);
  runtime.touchStart(3, 360, 1000); runtime.touchMove(3, 400, 1000); frames(1);
  expect(runtime.world.player.x).toBeGreaterThan(stopped);
  expect(runtime.diagnostics().frameSamples).toBeGreaterThan(0);
  runtime.start(); expect(runtime.diagnostics().frameSamples).toBe(0);
});

it('a transient zero-sized viewport pauses without corrupting coordinates', async () => {
  const { runtime, frames } = await fixture();
  const stopped = runtime.world.player.x;
  runtime.resize(0, 0, 3); frames(2);
  expect(runtime.diagnostics().mode).toBe('paused');
  expect(runtime.world.player.x).toBeCloseTo(stopped, 8);
  runtime.resize(720, 1280, 1); frames(1);
  runtime.touchStart(2, 360, 603); runtime.touchEnd(2, 360, 603); frames(1);
  expect(runtime.diagnostics().mode).toBe('playing');
  expect(Number.isFinite(runtime.world.player.x)).toBe(true);
  expect(runtime.world.player.x).toBeCloseTo(stopped, 8);
});
