import {it,expect} from 'vitest';
import {impactLight} from '../src/game/combat-light';
import {admitWeaponImpact,trimImpactBudget,type ImpactMarker} from '../src/game/impact-admission';
import type {WeaponKind} from '../src/core/weapons';
const kinds:WeaponKind[]=['pulse','scatter','pierce','blast','arc'];
function recorder(){
 const calls:{key:string;args:unknown[]}[]=[],stack:Record<string,unknown>[]=[];
 let state:Record<string,unknown>={globalAlpha:.37,globalCompositeOperation:'source-over',lineWidth:7};
 const c=new Proxy({}, {get(_t,key){if(key in state)return state[String(key)];return (...args:unknown[])=>{calls.push({key:String(key),args});if(key==='save')stack.push({...state});if(key==='restore'){expect(stack.length).toBeGreaterThan(0);state=stack.pop()!;}for(const v of args)if(typeof v==='number')expect(Number.isFinite(v)).toBe(true);};},set(_t,key,value){expect(['filter','shadowBlur']).not.toContain(String(key));state[String(key)]=value;return true;}}) as CanvasRenderingContext2D;
 return {c,calls,check(){expect(stack).toHaveLength(0);expect(state).toEqual({globalAlpha:.37,globalCompositeOperation:'source-over',lineWidth:7});}};
}
it.each(kinds)('%s is finite, balanced, clipped and local throughout its lifetime; weak mode uses fewer operations',kind=>{
 for(const age of [0,.2,.5,.9,.999]){
  const counts=[];
  for(const weak of [false,true]){
   const r=recorder();impactLight(r.c,360,600,kind,age,weak);r.check();counts.push(r.calls.length);
   expect(r.calls.some(c=>c.key==='clip')).toBe(true);
   for(const call of r.calls.filter(c=>['moveTo','lineTo','ellipse'].includes(c.key))){expect(Math.abs(Number(call.args[0]))).toBeLessThanOrEqual(64);expect(Math.abs(Number(call.args[1]))).toBeLessThanOrEqual(64);if(call.key==='ellipse'){expect(Number(call.args[2])).toBeLessThanOrEqual(64);expect(Number(call.args[3])).toBeLessThanOrEqual(64);}}
   for(const call of r.calls.filter(c=>c.key==='translate').slice(1)){expect(Math.abs(Number(call.args[0]))).toBeLessThanOrEqual(56);expect(Math.abs(Number(call.args[1]))).toBeLessThanOrEqual(56);}
  }
  expect(counts[1]).toBeLessThan(counts[0]);
 }
});
it('all five geometry signatures remain distinct without relying on colors, including weak mode',()=>{
 for(const weak of [false,true]){
  const signatures=kinds.map(kind=>{const r=recorder();impactLight(r.c,360,600,kind,.35,weak);return JSON.stringify(r.calls.filter(c=>['moveTo','lineTo','ellipse','rotate'].includes(c.key)));});expect(new Set(signatures).size).toBe(5);
 }
 const r=recorder();for(const kind of kinds)for(const age of [-1,1,2])impactLight(r.c,360,600,kind,age,false);expect(r.calls).toHaveLength(0);
});
it('metal fragments have filled forged faces while electrical hits stay open and local',()=>{
 for(const kind of ['scatter','blast','arc'] as const){const r=recorder();impactLight(r.c,360,600,kind,.3,false);expect(r.calls.some(c=>c.key==='fill')).toBe(kind!=='arc');}
});
it('same-point shots retain separate weapon responses, duplicate pellets do not restart their lifetime',()=>{
 const markers:ImpactMarker[]=[];for(const kind of kinds)expect(admitWeaponImpact(markers,360,600,kind,false)).toBe(true);
 expect(markers).toHaveLength(5);markers[1].life=.06;expect(admitWeaponImpact(markers,370,610,'scatter',false)).toBe(false);expect(markers[1].life).toBe(.06);
});
it('pressure replaces same-weapon old marks first and never removes optical priority for a fresh hit',()=>{
 const markers:ImpactMarker[]=[{x:0,y:500,kind:'pulse',life:.22,opticalBand:3}];
 for(let i=0;i<11;i++)admitWeaponImpact(markers,i*40,600,'pulse',false);
 expect(markers).toHaveLength(12);admitWeaponImpact(markers,360,600,'arc',false);expect(markers[0].opticalBand).toBe(3);expect(markers.some(h=>h.kind==='arc')).toBe(true);admitWeaponImpact(markers,600,600,'pulse',false);expect(markers.some(h=>h.kind==='arc')).toBe(true);
 const optical=Array.from({length:4},(_,i)=>({x:i*50,y:600,kind:'pulse' as const,life:.22,opticalBand:1}));expect(admitWeaponImpact(optical,360,600,'blast',true)).toBe(false);expect(optical).toHaveLength(4);
});
it('switching to weak mode immediately caps old marks too and retains optical marks where possible',()=>{
 const markers:ImpactMarker[]=[{x:0,y:500,kind:'pulse',life:.22,opticalBand:3}];for(let i=0;i<11;i++)admitWeaponImpact(markers,i*40,600,'scatter',false);
 trimImpactBudget(markers,true);expect(markers).toHaveLength(4);expect(markers[0].opticalBand).toBe(3);for(let i=0;i<100;i++)admitWeaponImpact(markers,i*45,600,kinds[i%5],true);expect(markers).toHaveLength(4);
});
