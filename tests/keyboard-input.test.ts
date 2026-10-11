import { expect, it } from 'vitest';
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { bindBrowserKeyboard } from '../src/game/browser-keyboard';
import { C } from '../src/core/config';
import { World } from '../src/core/world';
import { defaults } from '../src/ui/storage';

async function fixture() {
  let time = 1000, next: FrameRequestCallback = () => {};
  const runtime = new CanvasRuntime({ canvas: { getContext: () => new Proxy({}, { get: () => () => {} }) } as unknown as HTMLCanvasElement,
    width: 720, height: 1280, dpr: 1, menuBottom: 0,
    image: async () => ({width:768,height:512}) as HTMLImageElement,
    read: defaults, write(){}, sound(){}, silence(){}, now:()=>time, requestFrame: fn=>{next=fn;} });
  await runtime.load(); runtime.start();
  return {runtime, tick(count=1, ms=1000/60) {for(let i=0;i<count;i++){time+=ms;next(time);}}};
}

it.each([30,60,120])('moves at simulation speed with %s callbacks per second and stops on keyup', async fps=>{
  const f=await fixture(), reference=new World();
  expect(f.runtime.keyDown('KeyA')).toBe(true); f.tick(fps/5,1000/fps);
  for(let i=0;i<12;i++){reference.step(C.step,reference.player.x-C.moveSpeed*C.step);reference.drainEffects();}
  expect(f.runtime.world.player).toEqual(reference.player);
  expect(f.runtime.world.bullets).toEqual(reference.bullets);
  expect(f.runtime.world.time).toBeCloseTo(.2);expect(f.runtime.world.player.x).toBeCloseTo(224);
  expect(f.runtime.keyUp('KeyA')).toBe(true);f.tick(12);
  expect(f.runtime.world.player.x).toBeCloseTo(224);expect(f.runtime.world.shots).toBeGreaterThan(0);
});

it('handles physical aliases, opposite directions, bounds and fresh presses independently', async()=>{
  const f=await fixture();
  f.runtime.keyDown('KeyD');f.runtime.keyDown('ArrowRight');f.tick(8);
  const x=f.runtime.world.player.x;f.runtime.keyUp('KeyD');f.tick(8);expect(f.runtime.world.player.x).toBeGreaterThan(x);
  f.runtime.keyDown('ArrowLeft');const both=f.runtime.world.player.x;f.tick(8);expect(f.runtime.world.player.x).toBe(both);
  f.runtime.keyUp('ArrowRight');f.tick(8);expect(f.runtime.world.player.x).toBeLessThan(both);
  f.tick(80);expect(f.runtime.world.player.x).toBe(C.minX);f.runtime.keyUp('ArrowLeft');f.tick(8);expect(f.runtime.world.player.x).toBe(C.minX);
  f.runtime.keyDown('KeyD');f.tick(80);expect(f.runtime.world.player.x).toBe(C.maxX);
});

it.each(['pause','background','resize','restart','back','death'] as const)('%s clears keyboard intent and requires a fresh press',async reason=>{
  const f=await fixture();f.runtime.keyDown('KeyD');f.tick(2);const stopped=f.runtime.world.player.x;
  if(reason==='pause')f.runtime.pause();
  else if(reason==='background'){f.runtime.hide();f.tick(30);f.runtime.show();}
  else if(reason==='resize')f.runtime.resize(720,1280,2);
  else if(reason==='restart')f.runtime.start();
  else if(reason==='back')f.runtime.back();
  else {f.runtime.world.player.hp=0;f.tick();}
  if(f.runtime.mode==='paused'){
    expect(f.runtime.keyDown('KeyA')).toBe(false);f.tick(30);
    expect(f.runtime.world.player.x).toBe(stopped);
    f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);
  }else if(f.runtime.mode==='result')f.runtime.start();
  const resetAt=f.runtime.world.player.x;f.tick(10);expect(f.runtime.world.player.x).toBe(resetAt);
  expect(f.runtime.keyUp('KeyD')).toBe(false);
  expect(f.runtime.keyDown('KeyA')).toBe(true);f.tick(1);expect(f.runtime.world.player.x).toBeLessThan(resetAt);
});

it('touch takes ownership, secondary pointers cannot steal it and keyboard cannot fight the drag',async()=>{
  const f=await fixture();f.runtime.keyDown('KeyD');f.tick(2);
  f.runtime.touchStart(1,360,1100);expect(f.runtime.keyDown('KeyD')).toBe(false);
  f.runtime.touchMove(1,300,1100);f.tick(3);const x=f.runtime.world.player.x;
  f.runtime.touchStart(2,360,1100);f.runtime.touchMove(2,650,1100);f.runtime.cancelTouch(2);
  f.tick(3);expect(f.runtime.world.player.x).toBeLessThan(x);
  f.runtime.touchEnd(1,300,1100);const stopped=f.runtime.world.player.x;f.tick(10);expect(f.runtime.world.player.x).toBe(stopped);
  expect(f.runtime.keyUp('KeyD')).toBe(false);f.runtime.keyDown('KeyD');f.tick();expect(f.runtime.world.player.x).toBeGreaterThan(stopped);
});

function keyEvent(type:string,code:string,extra:Record<string,unknown>={}) {
  return Object.assign(new Event(type,{cancelable:true}),{code,...extra});
}
it('browser bindings ignore repeat, shortcuts, composing, editing and prevented events; releases always retire held input',()=>{
  const target=new EventTarget(), held=new Set<string>();let unlocks=0;
  const dispose=bindBrowserKeyboard(target as Window,{keyDown:code=>{if(code!=='KeyA')return false;held.add(code);return true;},keyUp:code=>held.delete(code)},()=>{unlocks++;});
  for(const extra of [{repeat:true},{ctrlKey:true},{altKey:true},{metaKey:true},{isComposing:true}]){
    const e=keyEvent('keydown','KeyA',extra);target.dispatchEvent(e);expect(held.size).toBe(0);expect(e.defaultPrevented).toBe(false);
  }
  const blocked=keyEvent('keydown','KeyA');blocked.preventDefault();target.dispatchEvent(blocked);expect(held.size).toBe(0);
  const editable=new EventTarget();Object.assign(editable,{closest:()=>({})});
  // Directly invoke the captured listener with an editable origin, without requiring a DOM library.
  let captured:(e:KeyboardEvent)=>void=()=>{};
  const fake={addEventListener:(type:string,fn:(e:KeyboardEvent)=>void)=>{if(type==='keydown')captured=fn;},removeEventListener(){}} as unknown as Window;
  bindBrowserKeyboard(fake,{keyDown:()=>{throw new Error('must not enter game');},keyUp:()=>false},()=>{});
  captured({target:editable,code:'KeyA'} as unknown as KeyboardEvent);
  const down=keyEvent('keydown','KeyA');target.dispatchEvent(down);expect(down.defaultPrevented).toBe(true);expect(unlocks).toBe(1);
  const up=keyEvent('keyup','KeyA',{ctrlKey:true});target.dispatchEvent(up);expect(held.size).toBe(0);
  dispose();target.dispatchEvent(keyEvent('keydown','KeyA'));expect(held.size).toBe(0);
});

it('a repeated key cannot rearm movement after a background pause',async()=>{
  const f=await fixture(), target=new EventTarget();
  const dispose=bindBrowserKeyboard(target as Window,f.runtime,()=>{});
  target.dispatchEvent(keyEvent('keydown','KeyD'));f.tick(2);f.runtime.hide();f.runtime.show();
  f.tick(); // The paused frame creates the visible resume button before interaction.
  f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);const x=f.runtime.world.player.x;
  expect(f.runtime.mode).toBe('playing');
  target.dispatchEvent(keyEvent('keydown','KeyD',{repeat:true}));f.tick(10);expect(f.runtime.world.player.x).toBe(x);
  target.dispatchEvent(keyEvent('keyup','KeyD'));target.dispatchEvent(keyEvent('keydown','KeyD'));f.tick();expect(f.runtime.world.player.x).toBeGreaterThan(x);
  dispose();
});
