import { expect, it } from 'vitest';
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { defaults } from '../src/ui/storage';

const image = (generation: number) => Object.assign({ width: 768, height: 512, generation }) as unknown as HTMLImageElement;
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function fixture(load: (src: string) => Promise<HTMLImageElement>) {
  let time = 1000, next: (time: number) => void = () => {}, scheduled = 0;
  const labels: string[] = [], draws: HTMLImageElement[] = [];
  const context = new Proxy({}, { get: (_target, key) => (...args: unknown[]) => {
    if (key === 'fillText') labels.push(String(args[0]));
    if (key === 'drawImage') draws.push(args[0] as HTMLImageElement);
  } }) as CanvasRenderingContext2D;
  const runtime = new CanvasRuntime({
    canvas: { getContext: () => context } as unknown as HTMLCanvasElement,
    width: 720, height: 1280, dpr: 1, menuBottom: 0,
    image: load, read: defaults, write: () => {}, sound: () => {}, silence: () => {},
    now: () => time, requestFrame: callback => { scheduled++; next = callback; },
  });
  const frame = (ms = 17) => { time += ms; labels.length = 0; draws.length = 0; next(time); };
  return { runtime, frame, labels, draws, scheduled: () => scheduled };
}

it('renders loading before assets settle, times out, and retries through the visible button without late asset contamination', async () => {
  let attempt = 0, releaseOld: (value: HTMLImageElement) => void = () => {};
  const f = fixture(src => {
    if (attempt === 0 && src.endsWith('runway.jpg')) return new Promise(resolve => { releaseOld = resolve; });
    return Promise.resolve(image(attempt));
  });
  const first = f.runtime.load();
  expect(f.scheduled()).toBe(1);
  f.frame(); expect(f.labels).toContain('装载火力中…'); expect(f.runtime.world.time).toBe(0);
  f.frame(15000); await first; f.frame();
  expect(f.runtime.mode).toBe('error'); expect(f.labels).toContain('重新加载');
  attempt = 1;
  f.runtime.touchStart(1, 360, 743); f.runtime.touchEnd(1, 360, 743);
  await flush(); f.frame(); expect(f.runtime.mode).toBe('menu');
  releaseOld(image(0)); await flush(); f.frame();
  expect(f.draws.length).toBeGreaterThan(0);
  expect(f.draws.every(img => (img as unknown as { generation: number }).generation === 1)).toBe(true);
  expect(f.runtime.world.time).toBe(0);
});

it('an immediate asset rejection gives retry UI with no partially loaded artwork', async () => {
  const f = fixture(src => src.endsWith('boss-v1.png') ? Promise.reject(new Error('missing')) : Promise.resolve(image(1)));
  await f.runtime.load(); f.frame();
  expect(f.runtime.mode).toBe('error'); expect(f.labels).toContain('资源加载未完成，请点击重试');
  expect(f.draws).toEqual([]);
});

it('background time does not consume the foreground load timeout', async () => {
  const f = fixture(() => new Promise(() => {}));
  const loading = f.runtime.load(); f.runtime.hide(); f.frame(60000); await flush();
  expect(f.runtime.mode).toBe('loading');
  f.runtime.show(); f.frame(14999); await flush(); expect(f.runtime.mode).toBe('loading');
  f.frame(1); await loading; expect(f.runtime.mode).toBe('error');
});

it('superseded loads cannot switch the successful retry to error or schedule a second frame loop', async () => {
  let failOld: (error: Error) => void = () => {}, ready = false;
  const f = fixture(() => ready ? Promise.resolve(image(1)) : new Promise((_resolve, reject) => { failOld = reject; }));
  const old = f.runtime.load(); ready = true; const retry = f.runtime.load();
  await Promise.all([old, retry]); expect(f.runtime.mode).toBe('menu'); expect(f.scheduled()).toBe(1);
  failOld(new Error('late')); await flush(); expect(f.runtime.mode).toBe('menu');
});
