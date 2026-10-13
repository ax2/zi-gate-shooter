import { expect, it } from 'vitest';
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { defaults } from '../src/ui/storage';
import { World } from '../src/core/world';
import { C } from '../src/core/config';

function fixture(weak = false) {
  let clock = 0, next: FrameRequestCallback = () => {};
  const calls: Array<{ kind: string; args: any[]; alpha: number; color: unknown; composite: string; font?: string }> = [];
  const state: Record<string, any> = { globalAlpha: 1, globalCompositeOperation: 'source-over' };
  const stack: Record<string, any>[] = [];
  const context = new Proxy(state, { get(target, key: string) {
    if (key in target) return target[key];
    if (key === 'save') return () => stack.push({ ...state });
    if (key === 'restore') return () => Object.assign(state, stack.pop());
    return (...args: any[]) => calls.push({ kind: key, args, alpha: state.globalAlpha, color: state.fillStyle, composite: state.globalCompositeOperation, font: state.font });
  } });
  const save = defaults(); save.settings.effects = weak ? 'weak' : 'standard';
  const runtime = new CanvasRuntime({ canvas: { getContext: () => context } as unknown as HTMLCanvasElement,
    width: 720, height: 1280, dpr: 1, menuBottom: 0,
    image: async src => ({ src, width: 768, height: src.includes('drone-v1') || src.includes('charger-v1') || src.includes('armor-v1') || src.includes('elite-v1') || src.includes('boss-v1') ? 256 : src.includes('explosion') || src.includes('crate-v1') ? 768 : 512 }) as HTMLImageElement,
    read: () => save, write() {}, sound() {}, silence() {}, now: () => clock,
    requestFrame: callback => { next = callback; } });
  return { runtime, calls, tick() { calls.length = 0; clock += 1000 / 60; next(clock); } };
}
const blasts = (f: ReturnType<typeof fixture>) => f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('explosion-v1.png'));

it.each([false,true])('ties boss preparation to real A/B warnings, freezes the second beat and preserves World (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const reference=new World(1337);
 const setup=(w:World)=>{w.time=w.roundTime=80;w.phase='boss';w.player.x=68;return w.spawn('boss',360,260);};
 const body=setup(f.runtime.world),baseline=setup(reference);
 f.runtime.touchStart(1,360,1100);f.runtime.touchMove(1,68,1100);
 const draws=()=>f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('boss-v1.png'));
 const frames=new Set<number>();let paused=false,finishedB=false;
 for(let i=0;i<620;i++){
  body.hit=baseline.hit=.07;f.tick();reference.step(C.step,68);reference.drainEffects();
  expect(body).toEqual(baseline);expect(f.runtime.world.bullets).toEqual(reference.bullets);
  expect(f.runtime.world.player).toEqual(reference.player);expect(f.runtime.world.growth).toEqual(reference.growth);
  expect(f.runtime.world.score).toBe(reference.score);expect(f.runtime.world.phase).toBe(reference.phase);
  const ds=draws();expect(ds).toHaveLength(2);expect(ds[0].args.slice(1)).toEqual(ds[1].args.slice(1));
  expect(ds[0].args.slice(2,5)).toEqual([0,256,256]);frames.add(ds[0].args[1]);
  expect(ds[0].args[1]).toBe(body.warning>0?256:0);expect(ds[0].args[1]).toBeLessThan(512);
  expect(ds[1].composite).toBe('lighter');expect(ds[1].alpha).toBeLessThanOrEqual(weak?.18:.48);
  expect(f.calls.findIndex(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('重装首领'))).toBeGreaterThan(f.calls.indexOf(ds[1]));
  if(body.warning>0)expect(f.calls.findIndex(c=>c.kind==='fillRect'&&c.color==='#ff775620')).toBeGreaterThan(f.calls.indexOf(ds[1]));
  if(body.burst&&!paused){
   const frozen={...body},bullets=JSON.stringify(f.runtime.world.bullets),pose=ds.map(c=>c.args.slice(1));
   f.runtime.pause();for(let j=0;j<30;j++)f.tick();expect(body).toEqual(frozen);
   expect(JSON.stringify(f.runtime.world.bullets)).toBe(bullets);expect(draws().map(c=>c.args.slice(1))).toEqual(pose);
   f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);expect(f.runtime.mode).toBe('playing');
   f.runtime.touchStart(1,360,1100);f.runtime.touchMove(1,68,1100);paused=true;
  }
  if(body.attackCycle===2){expect(body.warning).toBe(0);finishedB=true;}
 }
 expect(frames).toEqual(new Set([0,256]));expect(paused).toBe(true);expect(finishedB).toBe(true);
 f.runtime.start();f.tick();expect(draws()).toHaveLength(0);
});

it.each([false,true])('draws elite travel/preparation with matching hit, upper warning and frozen pause (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const reference=new World(1337);
 const body=f.runtime.world.spawn('elite',100,-100),baseline=reference.spawn('elite',100,-100);
 const frames=new Set<number>();let paused=false;
 const draws=()=>f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('elite-v1.png'));
 for(let i=0;i<200;i++){
  body.hit=baseline.hit=.07;f.tick();reference.step(C.step,360);reference.drainEffects();
  expect(body).toEqual(baseline);expect(f.runtime.world.player).toEqual(reference.player);
  expect(f.runtime.world.growth).toEqual(reference.growth);expect(f.runtime.world.bullets).toEqual(reference.bullets);
  expect(f.runtime.world.score).toBe(reference.score);
  const ds=draws();expect(ds).toHaveLength(2);expect(ds[0].args.slice(1)).toEqual(ds[1].args.slice(1));
  expect(ds[0].args.slice(2,5)).toEqual([0,256,256]);frames.add(ds[0].args[1]);
  expect(ds[1].composite).toBe('lighter');expect(ds[1].alpha).toBeLessThanOrEqual(weak?.18:.48);
  expect(f.calls.some(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('units.png')&&c.args[1]===384&&c.args[2]===256)).toBe(false);
  if(body.warning>0){
   expect(ds[0].args[1]).toBe(256);
   expect(f.calls.findIndex(c=>c.kind==='fillRect'&&c.color==='#ffe1a2')).toBeGreaterThan(f.calls.indexOf(ds[1]));
   if(!paused){
    const frozen={...body},pose=ds.map(c=>c.args.slice(1));f.runtime.pause();for(let j=0;j<30;j++)f.tick();
    expect(body).toEqual(frozen);expect(draws().map(c=>c.args.slice(1))).toEqual(pose);
    f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);expect(f.runtime.mode).toBe('playing');paused=true;
   }
  }
 }
 expect(frames).toEqual(new Set([0,256,512]));expect(paused).toBe(true);
 f.runtime.start();f.tick();expect(draws()).toHaveLength(0);
});

it.each([false,true])('draws armor travel/preparation with matching hit, upper warning and frozen pause (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const reference=new World(1337);
 const body=f.runtime.world.spawn('armor',100,-100),baseline=reference.spawn('armor',100,-100);
 const frames=new Set<number>();let paused=false;
 const draws=()=>f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('armor-v1.png'));
 for(let i=0;i<200;i++){
  body.hit=baseline.hit=.07;f.tick();reference.step(C.step,360);reference.drainEffects();
  expect(body).toEqual(baseline);expect(f.runtime.world.player).toEqual(reference.player);
  expect(f.runtime.world.growth).toEqual(reference.growth);expect(f.runtime.world.bullets).toEqual(reference.bullets);
  expect(f.runtime.world.score).toBe(reference.score);
  const ds=draws();expect(ds).toHaveLength(2);expect(ds[0].args.slice(1)).toEqual(ds[1].args.slice(1));
  expect(ds[0].args.slice(2,5)).toEqual([0,256,256]);frames.add(ds[0].args[1]);
  expect(ds[1].composite).toBe('lighter');expect(ds[1].alpha).toBeLessThanOrEqual(weak?.18:.48);
  expect(f.calls.some(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('units.png')&&c.args[1]===192&&c.args[2]===256)).toBe(false);
  if(body.warning>0){
   expect(ds[0].args[1]).toBe(256);
   expect(f.calls.findIndex(c=>c.kind==='fillRect'&&c.color==='#ffe1a2')).toBeGreaterThan(f.calls.indexOf(ds[1]));
   if(!paused){
    const frozen={...body},pose=ds.map(c=>c.args.slice(1));f.runtime.pause();for(let j=0;j<30;j++)f.tick();
    expect(body).toEqual(frozen);expect(draws().map(c=>c.args.slice(1))).toEqual(pose);
    f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);expect(f.runtime.mode).toBe('playing');paused=true;
   }
  }
 }
 expect(frames).toEqual(new Set([0,256,512]));expect(paused).toBe(true);
 f.runtime.start();f.tick();expect(draws()).toHaveLength(0);
});

it.each([false,true])('uses real charger states for poses, preserves danger above the art and freezes windup (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const reference=new World(1337);
 const body=f.runtime.world.spawn('charger',100,0),baseline=reference.spawn('charger',100,0);
 const frames=new Set<number>();let pausedWindup=false;
 const draws=()=>f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('charger-v1.png'));
 for(let step=0;step<180;step++){
  body.hit=baseline.hit=.07;f.tick();reference.step(C.step,360);reference.drainEffects();
  expect(body).toEqual(baseline);expect(f.runtime.world.player).toEqual(reference.player);
  expect(f.runtime.world.growth).toEqual(reference.growth);expect(f.runtime.world.score).toBe(reference.score);
  const ds=draws();expect(ds).toHaveLength(2);expect(ds[0].args.slice(1)).toEqual(ds[1].args.slice(1));
  expect(ds[0].args.slice(2,5)).toEqual([0,256,256]);frames.add(ds[0].args[1]);
  expect(ds[1].composite).toBe('lighter');expect(ds[1].alpha).toBeLessThanOrEqual(weak?.18:.48);
  if(body.warning>0){
   expect(ds[0].args[1]).toBe(256);
   const lastArt=f.calls.indexOf(ds[1]);
   expect(f.calls.findIndex(c=>c.kind==='fillRect'&&c.color==='#ff775620')).toBeGreaterThan(lastArt);
   if(!pausedWindup){
    const frozen={...body},pose=ds.map(c=>c.args.slice(1));f.runtime.pause();for(let i=0;i<30;i++)f.tick();
    expect(body).toEqual(frozen);expect(draws().map(c=>c.args.slice(1))).toEqual(pose);
    f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);expect(f.runtime.mode).toBe('playing');pausedWindup=true;
   }
  }
 }
 expect(frames).toEqual(new Set([0,256,512]));expect(pausedWindup).toBe(true);
 f.runtime.start();f.tick();expect(draws()).toHaveLength(0);
});

it.each([false, true])('animates a real drone without changing simulation; hit overlay and pause use the same pose (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const reference = new World(1337);
  const drone = f.runtime.world.spawn('drone', 100, 320);
  const baseline = reference.spawn('drone', 100, 320);
  const frames = new Set<number>();
  const draws = () => f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('drone-v1.png'));
  for (let i = 0; i < 36; i++) {
    drone.hit = baseline.hit = 0.07;
    f.tick(); reference.step(C.step,360); reference.drainEffects();
    expect(f.runtime.world.player).toEqual(reference.player);
    expect(f.runtime.world.growth).toEqual(reference.growth);
    expect(drone).toEqual(baseline);
    const ds=draws(); expect(ds).toHaveLength(2);
    expect(ds[0].args.slice(1)).toEqual(ds[1].args.slice(1));
    expect(ds[0].args.slice(2,5)).toEqual([0,256,256]);
    expect(ds[1].composite).toBe('lighter');
    expect(ds[1].alpha).toBeLessThanOrEqual(weak?.18:.48);
    frames.add(ds[0].args[1]);
  }
  expect(frames).toEqual(new Set([0,256,512]));
  const before=draws().map(c=>c.args.slice(1));
  f.runtime.pause(); for(let i=0;i<30;i++)f.tick();
  expect(draws().map(c=>c.args.slice(1))).toEqual(before);
  expect(drone.age).toBeCloseTo(.6);
  f.runtime.start(); f.tick(); expect(draws()).toHaveLength(0);
});

it('guides an actual first crate, pickup, single gate and paired row without changing the run', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  const reference = new World(); const seen = new Set<string>();
  f.runtime.touchStart(1, 360, 1100); f.runtime.touchMove(1, 240, 1100);
  for (let i = 0; i < 2050; i++) {
    f.tick(); reference.step(C.step, 240); reference.drainEffects();
    expect(f.runtime.world.growth).toEqual(reference.growth);
    expect(f.runtime.world.player).toEqual(reference.player);
    expect(f.runtime.world.pickups).toBe(reference.pickups);
    expect(f.runtime.world.gatesTaken).toBe(reference.gatesTaken);
    for (const call of f.calls) if (call.kind === 'fillText') seen.add(call.args[0]);
    if (f.runtime.world.pickups > 0) expect(f.calls.some(c => c.args[0] === '装备已掉落，移到它下方')).toBe(false);
  }
  expect(reference.pickups).toBe(2); expect(reference.gatesTaken).toBe(2);
  expect(reference.weaponKind).toBe('scatter');
  expect(seen).toContain('选择武器：对准其中一箱');
  expect(seen).toContain('靠近领取所选武器');
  expect(seen).toContain('对准装备箱持续射击');
  expect(seen).toContain('装备已掉落，移到它下方');
  expect(seen).toContain('持续射击，把门的奖励打高');
  expect(seen).toContain('穿过才领取 · 同排只领一扇');
});

it.each([false, true])('keeps live danger and reward labels above context help and hides help on pause (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  // Off-path target and danger layout intentionally supplied for rendering coverage.
  f.runtime.world.spawn('crate', 240, 600);
  f.runtime.world.bullets.push({id:9999,x:360,y:1180,px:360,py:1180,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});
  f.tick();
  const help = f.calls.findIndex(c => c.kind === 'fillText' && c.args[0] === '对准装备箱持续射击');
  expect(help).toBeGreaterThan(0);
  expect(f.calls.findIndex(c => c.kind === 'fillRect' && c.color === '#ffead7')).toBeGreaterThan(help);
  expect(f.calls.findIndex(c => c.kind === 'fillText' && c.args[0].startsWith?.('T2 装备'))).toBeGreaterThan(help);
  expect(f.calls.filter(c => c.kind === 'fillText' && c.args[2] === 277)).toHaveLength(0);
  f.runtime.pause(); for (let i = 0; i < 30; i++) f.tick();
  expect(f.calls.some(c => c.args[0] === '对准装备箱持续射击')).toBe(false);
  f.runtime.start(); f.tick();
  expect(f.calls.some(c => c.args[0] === '对准装备箱持续射击')).toBe(false);
});

it('temporarily omits optional help when a passing body occupies its text area', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  f.runtime.world.spawn('crate', 240, 600);
  const passing = f.runtime.world.spawn('drone', 480, 1200);
  f.tick(); expect(f.calls.some(c => c.args[0] === '对准装备箱持续射击')).toBe(false);
  passing.active = false; f.tick();
  expect(f.calls.some(c => c.args[0] === '对准装备箱持续射击')).toBe(true);
});

it.each([false, true])('a real threshold hit pulses the final number and freezes it on pause (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const gate = f.runtime.world.spawn('gate', 360, 600); gate.row = 1; gate.energy = 20; f.tick();
  f.runtime.world.bullets.push({ id: 9999, x: gate.x, y: gate.y, px: gate.x, py: gate.y, vx: 0, vy: 0, damage: 4, age: 0, active: true, hostile: false });
  f.tick(); f.tick();
  const number = () => f.calls.find(c => c.kind === 'fillText' && c.args[0] === '+15%');
  const fontSize = () => Number(number()?.font?.match(/([\d.]+)px/)?.[1]);
  expect(gate.energy).toBe(24); expect(fontSize()).toBeGreaterThan(50);
  expect(fontSize()).toBeLessThanOrEqual(weak ? 51.5 : 54);
  expect(f.runtime.world.growth.bonus).toBe(0); expect(f.runtime.world.gatesTaken).toBe(0);
  f.runtime.pause(); f.tick(); const frozen = number();
  for (let i = 0; i < 30; i++) f.tick(); expect(number()).toEqual(frozen);
  f.runtime.touchStart(1, 360, 603); f.runtime.touchEnd(1, 360, 603);
  for (let i = 0; i < 9; i++) f.tick(); expect(fontSize()).toBe(50);
});

it.each([false, true])('crossing mutually exclusive gates shows one complete mixed receipt without covering danger (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const reference = new World();
  const setup = (w: World) => {
    w.player.x = 222; w.growth.bonus = 95;
    for (const x of [222, 498]) { const g = w.spawn('gate', x, 1023); g.row = 1; g.energy = 144; }
    w.bullets.push({ id: 9999, x: 222, y: 840, px: 222, py: 840, vx: 0, vy: 0, damage: 1, age: 0, active: true, hostile: true });
  };
  setup(reference); setup(f.runtime.world); f.runtime.cancelTouch();
  f.tick(); reference.step(C.step, 222); reference.drainEffects();
  expect(f.runtime.world.growth).toEqual(reference.growth); expect(f.runtime.world.growth.bonus).toBe(100);
  expect(f.runtime.world.growth.energy).toBe(25); expect(f.runtime.world.gatesTaken).toBe(1);
  const taken = f.calls.filter(c => c.kind === 'fillText' && c.args[0] === '已领取');
  expect(taken).toHaveLength(1);
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '火力 +5%')).toBe(true);
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '充能 +25')).toBe(true);
  const danger = f.calls.findIndex(c => c.kind === 'fillRect' && c.color === '#ffead7');
  expect(danger).toBeGreaterThan(f.calls.lastIndexOf(taken[0]));
  f.runtime.pause(); f.tick(); const before = f.calls.filter(c => c.kind === 'fillText' && c.args[0] === '已领取');
  for (let i = 0; i < 30; i++) f.tick();
  expect(f.calls.filter(c => c.kind === 'fillText' && c.args[0] === '已领取')).toEqual(before);
  f.runtime.touchStart(1, 360, 603); f.runtime.touchEnd(1, 360, 603);
  for (let i = 0; i < 60; i++) { f.tick(); reference.step(C.step, 222); reference.drainEffects(); }
  expect(f.runtime.world.growth).toEqual(reference.growth); expect(f.runtime.world.gatesTaken).toBe(1);
  expect(f.runtime.diagnostics().gateReceipts).toBe(0);
  f.runtime.world.emit('gate-taken', 222, 1024, '储能已满', 240); f.tick();
  f.runtime.pause(); f.tick(); f.runtime.touchStart(1, 360, 823); f.runtime.touchEnd(1, 360, 823); f.tick();
  expect(f.runtime.diagnostics().gateReceipts).toBe(0);
  f.runtime.start(); f.tick(); expect(f.runtime.diagnostics().gateReceipts).toBe(0);
});

it('omits optional receipts behind live enemies and reward labels', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  f.runtime.world.spawn('armor', 360, 844);
  f.runtime.world.emit('gate-taken', 360, 1024, '火力 +20%', 264);
  f.tick(); expect(f.runtime.diagnostics().gateReceipts).toBe(1);
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '已领取')).toBe(false);
  expect(f.runtime.world.bodies.some(b => b.kind === 'armor')).toBe(true);
});

it.each([false, true])('a real crate break reveals equipment above smoke without granting it early (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const reference = new World();
  const setup = (w: World) => {
    const b = w.spawn('crate', 360, 650, 2); b.hp = 4;
    w.bullets.push({ id: 9999, x: 360, y: 650, px: 360, py: 650, vx: 0, vy: 0, damage: 4, age: 0, active: true, hostile: false });
  };
  setup(reference); setup(f.runtime.world);
  f.tick(); reference.step(C.step, 360); reference.drainEffects();
  expect(f.runtime.world.growth.stage).toBe(1); expect(f.runtime.world.pickups).toBe(0);
  expect(f.runtime.world.bodies.some(b => b.kind === 'pickup')).toBe(true);
  expect(f.runtime.diagnostics().crateFragments).toBe(6);
  const pickup = f.calls.findIndex(c => c.kind === 'drawImage' && c.args[0].src.endsWith('props.png') && c.args[7] === 65);
  expect(pickup).toBeGreaterThan(f.calls.lastIndexOf(blasts(f).at(-1)!));
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '装备已掉落，移到它下方')).toBe(true);
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '靠近领取')).toBe(false);
  f.runtime.pause(); f.tick(); const fragments = f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('crate-v1.png')).map(c => ({ ...c }));
  for (let i = 0; i < 20; i++) f.tick();
  expect(f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('crate-v1.png'))).toEqual(fragments);
  f.runtime.touchStart(1, 360, 603); f.runtime.touchEnd(1, 360, 603);
  for (let i = 0; i < 160; i++) {
    f.tick(); reference.step(C.step, 360); reference.drainEffects();
    expect(f.runtime.world.growth).toEqual(reference.growth); expect(f.runtime.world.bodies).toEqual(reference.bodies);
    expect(f.runtime.world.pickups).toBe(reference.pickups);
  }
  expect(f.runtime.world.pickups).toBe(1); expect(f.runtime.world.growth.stage).toBe(2);
  expect(f.runtime.diagnostics().crateFragments).toBe(0);
  for (let i = 0; i < 10; i++) f.runtime.world.emit('crate-break', 360, 600);
  f.tick(); expect(f.runtime.diagnostics().crateFragments).toBeLessThanOrEqual(9);
  f.runtime.pause(); f.tick(); f.runtime.touchStart(1, 360, 823); f.runtime.touchEnd(1, 360, 823);
  f.tick(); expect(f.runtime.mode).toBe('menu'); expect(f.runtime.diagnostics().crateFragments).toBe(0);
  f.runtime.start(); f.tick(); expect(f.runtime.diagnostics().crateFragments).toBe(0);
});

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

it.each([false, true])('uses real hit timers for local flashes, freezes on pause and preserves simulation (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const reference = new World();
  const setup = (world: World) => {
    for (const [i, kind] of (['drone', 'charger', 'armor', 'elite', 'boss', 'crate', 'gate'] as const).entries()) {
      const b = world.spawn(kind, 100 + i * 70, 400); b.hit = 0.07;
    }
    world.player.invulnerable = 1;
  };
  setup(f.runtime.world); setup(reference);
  f.tick(); reference.step(C.step, 360); reference.drainEffects();
  const flashes = () => f.calls.filter(c => c.kind === 'drawImage' && c.composite === 'lighter');
  expect(flashes()).toHaveLength(10); // Seven targets and three articulated player pieces.
  expect(flashes().every(c => c.alpha > 0 && c.alpha <= (weak ? 0.18 : 0.48))).toBe(true);
  // The final number panel must remain opaque and use normal compositing.
  const label = f.calls.find(c => c.kind === 'fillText' && /^\+\d+%$/.test(c.args[0]));
  expect(label?.composite).toBe('source-over'); expect(label?.alpha).toBe(1);
  const before = flashes().map(c => c.alpha);
  f.runtime.pause(); for (let i = 0; i < 20; i++) f.tick();
  expect(flashes().map(c => c.alpha)).toEqual(before);
  f.runtime.touchStart(1, 360, 603); f.runtime.touchEnd(1, 360, 603);
  for (let i = 0; i < 60; i++) {
    f.tick(); reference.step(C.step, 360); reference.drainEffects();
    expect(f.runtime.world.bodies).toEqual(reference.bodies);
    expect(f.runtime.world.player).toEqual(reference.player);
    expect(f.runtime.world.score).toBe(reference.score);
    if (i === 6) expect(flashes()).toHaveLength(0);
  }
  f.runtime.start(); f.tick(); expect(flashes()).toHaveLength(0);
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
    const fragments = f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('boss-v1.png') && c.args[1] >= 512 && c.args[2] === 0 && c.args[3] < 100);
    expect(fragments.length).toBe(i < 80 ? 3 : 0);
    if(i===0){
      expect(fragments.map(c=>c.args[1])).toEqual([512,593.92,686.08]);
      expect(fragments.every(c=>c.args[4]===256)).toBe(true);
      expect(fragments.reduce((sum,c)=>sum+c.args[3],0)).toBeCloseTo(256);
      expect(fragments.reduce((sum,c)=>sum+c.args[7],0)).toBeCloseTo(360);
    }
    if (i === 8) expect(blasts(f).length).toBe(1);
    if (i === 12) expect(blasts(f).length).toBe(2);
    if (i === 24) expect(blasts(f).length).toBe(3);
    if (i > 72) expect(blasts(f)).toHaveLength(0);
  }
  expect(locations.size).toBe(4); expect(peak).toBeLessThanOrEqual(4);
  expect(f.runtime.world.score).toBe(C.enemies.boss.score);
  expect(f.runtime.world.player.hp).toBe(3); expect(f.runtime.world.round).toBe(2);
});

it.each([1, 2, 3])('animates the three player pieces from real drag input without changing World (T%s)', async stage => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  f.runtime.world.growth.stage = stage;
  const reference = new World(); reference.growth.stage = stage;
  f.runtime.touchStart(1, 360, 1100); f.runtime.touchMove(1, 600, 1100);
  const legY = new Set<number>();
  for (let i = 0; i < 120; i++) {
    f.tick(); reference.step(C.step, 600); reference.drainEffects();
    expect(f.runtime.world.player).toEqual(reference.player);
    expect(f.runtime.world.bullets).toEqual(reference.bullets);
    expect(f.runtime.world.growth).toEqual(reference.growth);
    const legs = f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('units.png') && c.args[2] === 160 && c.args[3] === 96);
    expect(legs).toHaveLength(2);
    expect(legs.map(c => c.args[1])).toEqual([(stage - 1) * 192, (stage - 1) * 192 + 96]);
    legY.add(Number(legs[0].args[6].toFixed(3)));
  }
  expect(legY.size).toBeGreaterThan(10);
  const playerPieces = () => f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('units.png') && (c.args[2] === 160 || c.args[4] === 176)).map(c => c.args.slice(1));
  const lastLivePose = playerPieces();
  f.runtime.touchEnd(1, 600, 1100);
  f.runtime.pause(); f.tick();
  expect(playerPieces()).toEqual(lastLivePose); // Includes firing recoil, not just the legs.
  const before = f.calls.filter(c => c.kind === 'drawImage' && c.args[2] === 160).map(c => c.args.slice(1));
  for (let i = 0; i < 30; i++) f.tick();
  expect(f.calls.filter(c => c.kind === 'drawImage' && c.args[2] === 160).map(c => c.args.slice(1))).toEqual(before);
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
