import { afterEach, expect, it, vi } from 'vitest';
import { GameAudio } from '../src/game/audio';
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { defaults } from '../src/ui/storage';

afterEach(() => vi.unstubAllGlobals());

function audioFixture(fault = '') {
  let clock = 1000, currentFault = fault, contexts = 0;
  const voices: Array<{ osc: Record<string, any>; gain: Record<string, any> }> = [];
  const fail = (point: string) => { if (currentFault === point) throw new Error(`fixture ${point}`); };
  const context = { state: 'running', currentTime: 1, destination: {},
    resume: async () => { fail('resume'); }, close: vi.fn(async () => {}),
    createOscillator: () => {
      fail('oscillator');
      const osc = { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect: () => fail('connect'), disconnect: vi.fn(), start: () => fail('start'),
        stop: vi.fn(() => fail('stop')), onended: null };
      voices.push({ osc, gain: {} }); return osc;
    },
    createGain: () => { fail('gain'); const gain = { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {}, disconnect: vi.fn() }; voices[voices.length - 1].gain = gain; return gain; },
  };
  vi.stubGlobal('AudioContext', class { constructor() { contexts++; fail('context'); return context; } });
  // Inject only a monotonic platform clock, without changing any game state.
  const audio = new GameAudio(() => clock);
  return { audio, voices, context, contexts: () => contexts,
    advance: (ms: number) => { clock += ms; }, healthy: () => { currentFault = ''; } };
}

it.each(['oscillator', 'gain', 'connect', 'start', 'stop'])('Web Audio %s failure stays outside the battle loop', async fault => {
  const f = audioFixture(fault); await f.audio.unlock();
  let clock = 1000, next: FrameRequestCallback = () => {};
  const draw = new Proxy({}, { get: () => () => {} });
  const runtime = new CanvasRuntime({ canvas: { getContext: () => draw } as unknown as HTMLCanvasElement,
    width: 720, height: 1280, dpr: 1, menuBottom: 0, image: async () => ({ width: 768, height: 512 }) as HTMLImageElement,
    read: defaults, write() {}, sound: (type, stage) => f.audio.event(type, stage), silence: () => f.audio.stop(),
    now: () => clock, requestFrame: callback => { next = callback; } });
  await runtime.load(); runtime.start();
  for (let i = 0; i < 30; i++) { clock += 1000 / 60; next(clock); }
  expect(runtime.mode).toBe('playing'); expect(runtime.world.time).toBeGreaterThan(0.4);
  expect(f.audio.activeNodes).toBe(0);
  for (const voice of f.voices) {
    expect(voice.osc.disconnect).toHaveBeenCalled();
    if (voice.gain.disconnect) expect(voice.gain.disconnect).toHaveBeenCalled();
  }
});

it('pause cleanup disconnects both nodes immediately without an ended callback', async () => {
  const f = audioFixture(); await f.audio.unlock(); f.audio.event('upgrade', 1);
  expect(f.audio.activeNodes).toBe(2);
  const ended = f.voices[0].osc.onended;
  f.audio.stop(); expect(f.audio.activeNodes).toBe(0);
  for (const voice of f.voices) {
    expect(voice.osc.disconnect).toHaveBeenCalledTimes(1);
    expect(voice.gain.disconnect).toHaveBeenCalledTimes(1);
  }
  ended?.();
  expect(f.voices[0].gain.disconnect).toHaveBeenCalledTimes(1);
});

it('failed voices back off and can play again after the platform recovers', async () => {
  const f = audioFixture('start'); await f.audio.unlock();
  expect(() => f.audio.event('upgrade', 1)).not.toThrow();
  expect(f.voices).toHaveLength(1);
  f.healthy(); f.audio.event('upgrade', 1); expect(f.voices).toHaveLength(1);
  f.advance(5001); f.audio.event('upgrade', 1);
  expect(f.audio.activeNodes).toBe(2);
});

it.each(['context', 'resume'])('failed %s waits for a fresh unlock after backoff', async fault => {
  const f = audioFixture(fault); await expect(f.audio.unlock()).resolves.toBeUndefined();
  f.healthy(); await f.audio.unlock(); expect(f.contexts()).toBe(1);
  f.advance(5001); await f.audio.unlock(); expect(f.contexts()).toBe(2);
  f.audio.event('fire', 1); expect(f.audio.activeNodes).toBe(1);
  if (fault === 'resume') expect(f.context.close).toHaveBeenCalledTimes(1);
});

it('a closed context is recreated and its first shot is not throttled by the old clock', async () => {
  const f = audioFixture(); await f.audio.unlock(); f.audio.event('fire', 1); f.audio.stop();
  f.context.state = 'closed'; f.context.currentTime = 0;
  await f.audio.unlock(); f.context.state = 'running'; f.audio.event('fire', 1);
  expect(f.contexts()).toBe(2); expect(f.audio.activeNodes).toBe(1);
});
