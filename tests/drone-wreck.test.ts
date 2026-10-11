import { expect, it } from 'vitest';
import { DroneWreck } from '../src/game/drone-wreck';
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { World } from '../src/core/world';
import { C } from '../src/core/config';
import { defaults } from '../src/ui/storage';

it('keeps finite three-section wrecks within decorative capacity and freezes zero dt', () => {
  const wreck = new DroneWreck();
  for (let i = 0; i < 20; i++) { wreck.burst(360, 500, 6); expect(wreck.pieces.length).toBeLessThanOrEqual(6); }
  expect(wreck.pieces.slice(-3).reduce((sum,p) => sum + p.width,0)).toBe(1);
  const frozen = structuredClone(wreck.pieces); wreck.advance(0); expect(wreck.pieces).toEqual(frozen);
  wreck.advance(.2); expect(wreck.pieces).not.toEqual(frozen);
  wreck.advance(.35); expect(wreck.pieces).toHaveLength(0);
  wreck.burst(360,500,2); expect(wreck.pieces).toHaveLength(0);
  wreck.burst(360,500,3); wreck.clear(); expect(wreck.pieces).toHaveLength(0);
});

function fixture(weak: boolean) {
  let time = 0, next: (time: number) => void = () => {};
  const calls: Array<{kind: string; args: any[]; alpha: number}> = [];
  const state = { globalAlpha: 1 };
  const context = new Proxy(state, { get: (target,key) => key in target ? target[key as keyof typeof target] : (...args: any[]) => calls.push({kind: String(key),args,alpha:state.globalAlpha}),
    set: (target,key,value) => { (target as any)[key] = value; return true; } }) as unknown as CanvasRenderingContext2D;
  const save = defaults(); if (weak) save.settings.effects = 'weak';
  const runtime = new CanvasRuntime({canvas:{getContext:()=>context} as unknown as HTMLCanvasElement,width:720,height:1280,dpr:1,menuBottom:0,
    image: async src => ({src,width:src.includes('wreck')?256:768,height:256}) as HTMLImageElement,
    read:()=>save,write:()=>{},sound:()=>{},silence:()=>{},now:()=>time,requestFrame:fn=>{next=fn;}});
  return {runtime,calls,tick(){calls.length=0;time+=1000/60;next(time);},wrecks:()=>calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('drone-wreck-v1.png'))};
}

it.each([false,true])('only a real drone kill produces wreckage, with unchanged World and upper-layer danger/rewards (weak=%s)', async weak => {
  const f=fixture(weak); await f.runtime.load(); f.runtime.start(); const reference=new World(1337);
  const setup=(w:World)=>{ const b=w.spawn('drone',360,500); b.hp=4;
    w.spawn('gate',240,700);
    w.bullets.push({id:900,x:360,y:500,px:360,py:500,vx:0,vy:0,damage:4,age:0,active:true,hostile:false});
    w.bullets.push({id:901,x:500,y:700,px:500,py:700,vx:0,vy:0,damage:1,age:0,active:true,hostile:true}); };
  setup(f.runtime.world); setup(reference); f.tick(); reference.step(C.step,360);
  expect(reference.drainEffects().find(e=>e.type==='kill')?.enemyKind).toBe('drone');
  expect(f.runtime.world.score).toBe(reference.score); expect(f.runtime.world.kills).toBe(reference.kills);
  expect(f.runtime.world.bodies).toEqual(reference.bodies); expect(f.runtime.world.bullets).toEqual(reference.bullets); expect(f.runtime.world.growth).toEqual(reference.growth);
  const ds=f.wrecks(); expect(ds).toHaveLength(3); expect(ds.reduce((n,c)=>n+c.args[3],0)).toBe(256);
  expect(ds.reduce((n,c)=>n+c.args[7],0)).toBeCloseTo(92.4); expect(ds.every(c=>c.alpha<= (weak?.5:.85))).toBe(true);
  const last=f.calls.indexOf(ds[2]);
  expect(f.calls.findIndex(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('+'))).toBeGreaterThan(last);
  expect(f.calls.findIndex(c=>c.kind==='moveTo'&&c.args[0]===492&&c.args[1]===693)).toBeGreaterThan(last);
  f.runtime.pause(); f.tick(); const frozen=f.wrecks().map(c=>c.args.slice(1));
  for(let i=0;i<40;i++)f.tick(); expect(f.wrecks().map(c=>c.args.slice(1))).toEqual(frozen);
  f.runtime.start(); f.tick(); expect(f.runtime.diagnostics().droneFragments).toBe(0);
});

it('prioritizes crate fragments and reserves three boss slots across repeated mixed events',async()=>{
  const f=fixture(false); await f.runtime.load();f.runtime.start();
  for(let i=0;i<30;i++) {
    f.runtime.world.effects.push({type:'kill',enemyKind:'drone',x:360,y:500});
    if(i%3===0)f.runtime.world.emit('crate-break',240,700);
    f.tick(); const d=f.runtime.diagnostics(); expect(d.crateFragments+d.droneFragments+3).toBeLessThanOrEqual(12);
  }
  for(let i=0;i<90;i++)f.tick();expect(f.runtime.diagnostics().droneFragments).toBe(0);
  f.runtime.world.effects.push({type:'kill',enemyKind:'charger',x:360,y:500});f.tick();expect(f.runtime.diagnostics().droneFragments).toBe(0);
});
