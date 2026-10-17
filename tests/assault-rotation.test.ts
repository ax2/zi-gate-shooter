import {it,expect} from 'vitest';
import {chapterAssaults} from '../src/core/chapter-assaults';
import {timeline,Random} from '../src/core/director';
import {battleIndex} from '../src/core/battle-plan';
const path='../build/qa/Stage-231/baseline.mjs',old=await import(path);
it('preserves every other enemy and every reward in 108 authored schedules',()=>{
 for(let r=1;r<=12;r++)for(const seed of [1,29,1337])for(const plan of [0,1,2] as const){
  const mirror=r>1&&new Random(seed).next()>.5,v=battleIndex(r,plan);
  const rest=(list:any[],own:any[])=>{const a=[...list];for(const s of own){const i=a.findIndex(t=>JSON.stringify(t)===JSON.stringify(s));expect(i).toBeGreaterThanOrEqual(0);a.splice(i,1);}return a;};
  expect(rest(timeline(r,seed,plan),chapterAssaults(r,mirror,v))).toEqual(rest(old.timeline(r,seed,plan),old.chapterAssaults(r,mirror,v)));
 }
});
it.each([0,1,2])('adds fixed reinforcements without changing health or the three supply windows, variation %s',v=>{
 for(const [round,count] of [[1,30],[2,30],[3,30],[4,40]]){
  const list=chapterAssaults(round,false,v);expect(list).toHaveLength(count);
  expect(list.filter(s=>s.dropLabel)).toHaveLength(3);expect(list.every(s=>s.drop&&s.at>=10&&s.at<58&&s.x>=150&&s.x<=570)).toBe(true);
 }
});
it.each([4,5,6])('changes target mix or real motion between three rotations in sector round %s',r=>{
 const lists=[0,1,2].map(v=>chapterAssaults(r,false,v).filter(s=>s.at<16).map(s=>[s.kind,s.pattern]));
 expect(new Set(lists.map(s=>JSON.stringify(s))).size).toBe(3);
});
it.each([1,2,3,4,5,6])('mirrors target lanes as well as positions in round %s',r=>{
 for(const v of [0,1,2])expect(chapterAssaults(r,true,v)).toEqual(chapterAssaults(r,false,v).map(s=>({...s,x:720-s.x,lane:s.lane===undefined?undefined:720-s.lane})));
});
it('keeps first chapter starter groups simple and all eight other phrases intact',()=>{
 for(const v of [0,1,2]){
  expect(chapterAssaults(1,false,v).filter(s=>s.at<16).every(s=>s.kind==='drone')).toBe(true);
  for(const r of [2,3,4])expect(chapterAssaults(r,false,v).filter(s=>s.at>=21)).toEqual(old.chapterAssaults(r,false,v).filter((s:any)=>s.at>=21));
 }
});
