import { expect, it } from 'vitest';
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { defaults } from '../src/ui/storage';
import { dossierWeapons, weaponDossier } from '../src/game/weapon-dossier';

it('browses all weapon dossiers without advancing or equipping, then returns and starts normally', async () => {
  let time = 1000, next: FrameRequestCallback = () => {};
  const labels: string[] = [];
  const ctx = new Proxy({}, { get: (_, key) => key === 'fillText'
    ? (text: string) => labels.push(text) : () => {} }) as CanvasRenderingContext2D;
  const runtime = new CanvasRuntime({
    canvas: {getContext: () => ctx} as unknown as HTMLCanvasElement,
    width:720, height:1280, dpr:1, menuBottom:0,
    image: async () => ({width:768,height:512}) as HTMLImageElement,
    read: defaults, write: () => {}, sound: () => {}, silence: () => {},
    now: () => time, requestFrame: fn => {next=fn;},
  });
  await runtime.load();
  const frame = () => {time += 17; next(time);};
  const click = (x:number,y:number) => {runtime.touchStart(1,x,y); runtime.touchEnd(1,x,y); frame();};
  frame(); click(360,1073);
  expect(runtime.mode).toBe('armory');
  const world = runtime.world;
  for (const [i, weapon] of dossierWeapons.entries()) {
    labels.length=0; click(116+i*122,281);
    expect(labels).toContain(weaponDossier[weapon].strength);
    expect(labels).toContain(weaponDossier[weapon].tradeoff);
    for (let j=0;j<30;j++) frame();
    expect(world.time).toBe(0);
    expect(world.weaponKind).toBe('pulse');
    expect(world.growth.stage).toBe(1);
    expect(runtime.world).toBe(world);
  }
  expect(runtime.back()).toBe('stay'); frame(); expect(runtime.mode).toBe('menu');
  click(360,1073); click(360,1143); expect(runtime.mode).toBe('menu');
  click(360,975); expect(runtime.mode).toBe('playing'); expect(runtime.world.time).toBeGreaterThan(0);
});
