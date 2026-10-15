import {expect,it} from 'vitest';
import {CanvasRuntime,type CanvasControl} from '../src/game/canvas-runtime';
import {defaults} from '../src/ui/storage';

async function fixture(fail=false) {
  let time=1000,next=(_time:number)=>{}, controls:readonly CanvasControl[]=[];
  const context=new Proxy({}, {get:()=>()=>{}}) as CanvasRenderingContext2D;
  const runtime=new CanvasRuntime({canvas:{getContext:()=>context} as unknown as HTMLCanvasElement,
    width:720,height:1280,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}) as HTMLImageElement,
    read:defaults,write:()=>{},sound:()=>{},silence:()=>{},now:()=>time,requestFrame:fn=>{next=fn;},
    controls:buttons=>{controls=buttons;if(fail)throw new Error('adapter unavailable');}});
  const frame=()=>{time+=17;next(time);};
  await runtime.load();frame();
  return {runtime,frame,controls:()=>controls};
}
it('native controls reject hidden actions, redraw transitions immediately and preserve paused World',async()=>{
  const f=await fixture(),r=f.runtime;
  expect(r.activateControl('contract:precision')).toBe(false);
  expect(r.activateControl('start')).toBe(true);
  expect(r.mode).toBe('playing');expect(r.activateControl('start')).toBe(false);
  f.frame();expect(r.activateControl('pause')).toBe(true);
  const world=r.world,time=world.time;
  expect(r.activateControl('loadout')).toBe(true);expect(r.mode).toBe('loadout');
  expect(r.activateControl('tree')).toBe(true);expect(r.mode).toBe('tree');
  expect(r.activateControl('tree-back')).toBe(true);
  expect(r.activateControl('contracts')).toBe(true);expect(r.mode).toBe('contracts');
  expect(r.activateControl('contract:precision')).toBe(true);
  expect(r.activateControl('contract:specialist')).toBe(false);
  for(let i=0;i<60;i++)f.frame();
  expect(r.world).toBe(world);expect(world.time).toBe(time);
  expect(f.controls().some(b=>b.action==='resume')).toBe(true);
});
it('external pause invalidates old controls before a frame and publication errors cannot stop play',async()=>{
  const f=await fixture(true),r=f.runtime;
  expect(r.activateControl('start')).toBe(true);f.frame();r.hide();
  expect(r.activateControl('contracts-live')).toBe(false);f.frame();
  expect(r.activateControl('resume')).toBe(true);f.frame();
  expect(r.mode).toBe('playing');expect(r.world.time).toBeGreaterThan(0);
});

it('publishes the loaded menu before the first deferred animation callback',async()=>{
  let callbacks=0, controls:readonly CanvasControl[]=[];
  const context=new Proxy({}, {get:()=>()=>{}}) as CanvasRenderingContext2D;
  const runtime=new CanvasRuntime({canvas:{getContext:()=>context} as unknown as HTMLCanvasElement,
    width:720,height:1280,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}) as HTMLImageElement,
    read:defaults,write:()=>{},sound:()=>{},silence:()=>{},now:()=>1000,
    requestFrame:()=>{callbacks++;},controls:buttons=>{controls=buttons;}});
  await runtime.load();
  expect(callbacks).toBe(1);
  expect(controls.some(button=>button.action==='start')).toBe(true);
  expect(runtime.activateControl('start')).toBe(true);
  expect(runtime.world.time).toBe(0);
});

