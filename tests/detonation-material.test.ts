import {it,expect} from 'vitest';
import {detonationLight,detonationSpriteAlpha} from '../src/game/combat-light';
import {C} from '../src/core/config';
function recorder(){
 let state:Record<string,unknown>={globalAlpha:.37,globalCompositeOperation:'source-over',lineWidth:7};const stack:Record<string,unknown>[]=[],calls:{key:string,args:number[]}[]=[];
 const c=new Proxy({}, {get(_t,k){if(k in state)return state[String(k)];return (...args:number[])=>{calls.push({key:String(k),args});if(k==='save')stack.push({...state});if(k==='restore')state=stack.pop()!;for(const a of args)expect(Number.isFinite(a)).toBe(true);};},set(_t,k,v){expect(['filter','shadowBlur']).not.toContain(String(k));if(k==='globalAlpha')expect(Number(v)).toBeGreaterThanOrEqual(0);state[String(k)]=v;return true;}}) as CanvasRenderingContext2D;
 return {c,calls,check(){expect(stack).toHaveLength(0);expect(state).toEqual({globalAlpha:.37,globalCompositeOperation:'source-over',lineWidth:7});}};
}
it('brief core returns contrast quickly, stays finite and weak stays below standard',()=>{
 let previous=1;
 for(let i=0;i<=100;i++){const age=i/100,a=detonationSpriteAlpha(age,false),w=detonationSpriteAlpha(age,true);expect(a).toBeLessThanOrEqual(previous);expect(a).toBeGreaterThanOrEqual(0);expect(w).toBeLessThanOrEqual(a);previous=a;}
 expect(detonationSpriteAlpha(0,false)).toBeGreaterThan(.7);
 expect(detonationSpriteAlpha(.25,false)).toBeLessThan(.2);
 for(const age of [-1,1,2])expect(detonationSpriteAlpha(age,false)).toBe(0);
});
it('shock edge and cooling faces remain local, clipped, balanced and cheaper in weak mode at every phase',()=>{
 for(const age of [0,.08,.2,.5,.9,.999])for(const size of [32,80,200]){
  const counts=[];
  for(const weak of [false,true]){
   const r=recorder();detonationLight(r.c,360,600,size,age,weak);r.check();counts.push(r.calls.length);
   expect(r.calls.find(c=>c.key==='rect')?.args).toEqual([0,C.playerShotTop,C.width,C.height-C.playerShotTop]);expect(r.calls.some(c=>c.key==='clip')).toBe(true);
   expect(r.calls.filter(c=>c.key==='fill').length).toBe(weak?2:5); // Only small forged faces, never a filled white core.
   for(const c of r.calls.filter(c=>['lineTo','moveTo','ellipse'].includes(c.key))){expect(Math.abs(c.args[0])).toBeLessThanOrEqual(Math.max(8,size*1.4));expect(Math.abs(c.args[1])).toBeLessThanOrEqual(Math.max(8,size*1.4));}
  }
  expect(counts[1]).toBeLessThan(counts[0]);
 }
 const r=recorder();for(const age of [-1,1,2])detonationLight(r.c,360,600,80,age,false);detonationLight(r.c,360,600,0,.2,false);expect(r.calls).toHaveLength(0);
});
