import{it,expect}from'vitest';
import{chapterAssaults}from'../src/core/chapter-assaults';
import{timeline,Random}from'../src/core/director';
import{battleIndex}from'../src/core/battle-plan';
import{World}from'../src/core/world';
import{C}from'../src/core/config';
const baseline='../build/qa/Stage-235/baseline.mjs',old=await import(baseline);
const middle=(a:any[])=>a.filter(s=>s.at>=21&&s.at<27);
const strip=(list:any[],own:any[])=>{const a=[...list];for(const s of own){const i=a.findIndex(t=>JSON.stringify(t)===JSON.stringify(s));expect(i).toBeGreaterThanOrEqual(0);a.splice(i,1);}return a;};
it('preserves first chapter, variation zero, all other enemies and all rewards in108 schedules',()=>{
 for(let r=1;r<=12;r++)for(const seed of[1,29,1337])for(const plan of[0,1,2]as const){
  const v=battleIndex(r,plan),mirror=r>1&&new Random(seed).next()>.5,a=timeline(r,seed,plan),b=old.timeline(r,seed,plan);
  expect(strip(a,middle(chapterAssaults(r,mirror,v)))).toEqual(strip(b,middle(old.chapterAssaults(r,mirror,v))));
  if(r===1||v===0)expect(a).toEqual(b);
 }
});
it.each([2,3,4,5,6,7,8,9])('keeps middle arrival count, timing, positions, cover and full mirroring in round%s',r=>{
 for(const v of[0,1,2]){
  const a=chapterAssaults(r,false,v),b=old.chapterAssaults(r,false,v);
  const roster=(a:any[])=>a.map(s=>[s.at,s.x,s.dropY,s.drop,s.breach]);expect(roster(a)).toEqual(roster(b));
  expect(a.filter(s=>s.dropLabel)).toHaveLength(3);
  expect(chapterAssaults(r,true,v)).toEqual(a.map(s=>({...s,x:720-s.x,lane:s.lane===undefined?undefined:720-s.lane})));
 }
});
it.each([2,3,4])('offers three different middle combat behaviours in sector round%s',r=>{
 const variants=[0,1,2].map(v=>middle(chapterAssaults(r,false,v)).map(s=>[s.kind,s.pattern]));
 expect(new Set(variants.map(a=>JSON.stringify(a))).size).toBe(3);
});
it('keeps heavy breach/relay intact and gives mobile sentries their own-side deployment with short return charges',()=>{
 for(const v of[1,2]){
  const heavy=middle(chapterAssaults(3,false,v));expect(heavy.filter(s=>s.breach)).toHaveLength(3);expect(heavy.filter(s=>s.breach).map(s=>[s.kind,s.pattern])).toEqual([['armor','fire-control'],['conduit','fire-control'],['armor','fire-control']]);
  const side=middle(chapterAssaults(2,false,v));expect(side.filter(s=>s.pattern==='relocate')).toHaveLength(v);expect(side.filter(s=>s.pattern==='relocate').every(s=>s.lane===s.x)).toBe(true);
  expect(side.filter(s=>s.kind==='charger').map(s=>[s.pattern,s.x,s.lane])).toEqual([['rebound',v===1?150:570,v===1?280:440]]);
 }
});
it.each([[4,1],[4,2],[2,1],[2,2],[3,1],[3,2]])('actual middle deployment moves or launches its authored attack in round%s variation%s',(r,v)=>{
 const w=new World(1337,r),specs=middle(chapterAssaults(r,false,v));Object.assign(w,{scheduled:specs.map(s=>({...s,at:s.at-21}))});(w as any).shoot=()=>{};w.player.x=w.player.px=68;
 const tracked=new Map<number,{pattern:unknown;x:number;maxHp:number}>();let moved=false,shots=0;
 for(let f=0;f<12*60;f++){w.step(C.step,68);w.drainEffects();for(const b of w.bodies)if(['relocate','sweep','bankshot','lockshot'].includes(b.pattern??'')){const first=tracked.get(b.id);if(first&&Math.abs(b.x-first.x)>15)moved=true;else if(!first)tracked.set(b.id,{pattern:b.pattern,x:b.x,maxHp:b.maxHp});}shots=Math.max(shots,w.bullets.filter(b=>b.hostile).length);}
 expect(tracked.size).toBeGreaterThan(0);expect(shots).toBeGreaterThan(0);if(r===2||v===2)expect(moved).toBe(true);expect(w.kills).toBe(0);expect(w.pickups).toBe(0);expect(w.gatesTaken).toBe(0);
});
