import { expect, it, vi } from 'vitest';
import { LoopMusic } from '../src/game/music';
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { defaults } from '../src/ui/storage';

it('requests a single track, pauses immediately, and resumes the same handle', () => {
  const node = { play: vi.fn(), pause: vi.fn(), destroy: vi.fn(), onError: vi.fn() };
  const create = vi.fn(() => node), music = new LoopMusic(create, () => 1000);
  music.setPlaying(false); expect(create).not.toHaveBeenCalled();
  for (let i = 0; i < 500; i++) music.setPlaying(true);
  expect(create).toHaveBeenCalledTimes(1); expect(node.play).toHaveBeenCalledTimes(1);
  music.setPlaying(false); music.setPlaying(false); expect(node.pause).toHaveBeenCalledTimes(1);
  music.setPlaying(true); expect(node.play).toHaveBeenCalledTimes(2); expect(create).toHaveBeenCalledTimes(1);
});

it.each(['create', 'play', 'pause'])('isolates music %s failure and bounds retries', fault => {
  let time = 1000, healthy = false;
  const node = { play() { if (fault === 'play' && !healthy) throw Error('fixture'); },
    pause() { if (!healthy) throw Error('fixture cleanup'); }, destroy() { throw Error('fixture destroy'); }, onError() {} };
  const create = vi.fn(() => { if (fault === 'create' && !healthy) throw Error('fixture'); return node; });
  const music = new LoopMusic(create, () => time);
  expect(() => { music.setPlaying(true); if (fault === 'pause') music.setPlaying(false); }).not.toThrow();
  for (let i = 0; i < 500; i++) music.setPlaying(true);
  expect(create).toHaveBeenCalledTimes(1);
  healthy = true; time += 5000; music.setPlaying(true); expect(create).toHaveBeenCalledTimes(2);
});

it('ignores a rejected old play promise after pause and a newer request', async () => {
  let rejectOld: (reason: unknown) => void = () => {};
  const node = { play: vi.fn().mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectOld = reject; })).mockResolvedValue(undefined),
    pause: vi.fn(), destroy: vi.fn(), onError: vi.fn() };
  const music = new LoopMusic(() => node, () => 1000);
  music.setPlaying(true); music.setPlaying(false); music.setPlaying(true);
  rejectOld(Error('old cancellation')); await Promise.resolve();
  expect(node.destroy).not.toHaveBeenCalled(); expect(node.play).toHaveBeenCalledTimes(2);
});

it('retires asynchronous failures and ignores late errors from retired handles', () => {
  let time = 0; const errors: Array<() => void> = [];
  const create = vi.fn(() => ({ play() {}, pause() {}, destroy() {}, onError: (fn: () => void) => errors.push(fn) }));
  const music = new LoopMusic(create, () => time);
  music.setPlaying(true); errors[0](); music.setPlaying(true); expect(create).toHaveBeenCalledTimes(1);
  time = 5000; music.setPlaying(true); errors[0](); music.setPlaying(true);
  expect(create).toHaveBeenCalledTimes(2);
});

it('isolates current play promise rejection and allows a later retry', async () => {
  let time = 0; const node = { play: vi.fn().mockRejectedValueOnce(Error('autoplay denied')).mockResolvedValue(undefined),
    pause: vi.fn(), destroy: vi.fn(), onError: vi.fn() };
  const create = vi.fn(() => node), music = new LoopMusic(create, () => time);
  music.setPlaying(true); await Promise.resolve(); expect(node.destroy).toHaveBeenCalledTimes(1);
  music.setPlaying(true); expect(create).toHaveBeenCalledTimes(1);
  time = 5000; music.setPlaying(true); expect(create).toHaveBeenCalledTimes(2);
});

async function runtimeFixture() {
  let time = 0, next: FrameRequestCallback = () => {};
  const save = defaults(); save.settings.music = true; save.settings.sound = false;
  const music = vi.fn(), sound = vi.fn();
  const runtime = new CanvasRuntime({ canvas: { getContext: () => new Proxy({}, { get: () => () => {} }) } as unknown as HTMLCanvasElement,
    width: 720, height: 1280, dpr: 1, menuBottom: 0, image: async () => ({ width: 768, height: 512 }) as HTMLImageElement,
    read: () => save, write() {}, music, sound, silence() {}, now: () => time,
    requestFrame: fn => { next = fn; } });
  const frame = () => { time += 1000 / 60; next(time); };
  const click = (y: number) => { runtime.touchStart(1, 360, y); runtime.touchEnd(1, 360, y); frame(); };
  await runtime.load(); frame(); return { runtime, frame, click, music, sound };
}

it('keeps music independent of SFX, respects settings and stops for hide/death', async () => {
  const f = await runtimeFixture(); f.runtime.start(); expect(f.music).toHaveBeenLastCalledWith(true);
  f.frame(); expect(f.sound).not.toHaveBeenCalled();
  f.runtime.hide(); expect(f.music).toHaveBeenLastCalledWith(false);
  f.runtime.show(); f.frame(); expect(f.runtime.mode).toBe('paused'); expect(f.music).toHaveBeenLastCalledWith(false);
  f.click(713); f.click(853); expect(f.runtime.save.settings.music).toBe(false);
  f.click(963); f.click(603); expect(f.runtime.mode).toBe('playing'); expect(f.music).toHaveBeenLastCalledWith(false);
  f.runtime.pause(); f.frame(); f.click(713); f.click(853); f.click(963); f.click(603);
  expect(f.music).toHaveBeenLastCalledWith(true);
  f.runtime.world.player.hp = 0; f.frame(); expect(f.runtime.mode).toBe('result'); expect(f.music).toHaveBeenLastCalledWith(false);
});

