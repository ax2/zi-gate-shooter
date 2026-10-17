import {it,expect} from 'vitest';
import {timeline,Random} from '../src/core/director';
import {battleIndex} from '../src/core/battle-plan';
import {chapterAssaults} from '../src/core/chapter-assaults';
const old=await import('../build/qa/Stage-228/baseline.mjs');
it('adds three distinct combat phrases and preserves every existing enemy, special encounter and reward in 108 schedules',()=>{
 for(let round=1;round<=12;round++)for(const seed of [1,29,1337])for(const plan of [0,1,2]){
  const mirror=round>1&&new Random(seed).next()>.5,extra=chapterAssaults(round,mirror,battleIndex(round,plan));
  const remove=(list,own)=>{const rest=[...list];for(const s of own){const i=rest.findIndex(t=>JSON.stringify(t)===JSON.stringify(s));expect(i).toBeGreaterThanOrEqual(0);rest.splice(i,1);}return rest;};
  expect(remove(timeline(round,seed,plan),extra)).toEqual(remove(old.timeline(round,seed,plan),old.chapterAssaults(round,mirror,battleIndex(round,plan))));
  expect(extra.filter(s=>s.dropLabel)).toHaveLength(3);
  expect(extra.every(s=>s.at>=10&&s.at<58&&s.drop&&s.x>=150&&s.x<=570)).toBe(true);
 }
});
it('gives the three sectors different target mixes, movement and counts, with a gentler first-chapter ramp',()=>{
 const counts=[1,2,3,4].map(r=>chapterAssaults(r,false,0));
 expect(counts.map(s=>s.length)).toEqual([30,30,30,40]);
 expect(new Set(counts[0].map(s=>s.kind))).toEqual(new Set(['drone','armor']));
 expect(counts[1].filter(s=>s.kind==='charger')).toHaveLength(8);
 expect(counts[1].filter(s=>s.kind==='charger').every(s=>s.pattern==='flank'&&s.lane!==s.x)).toBe(true);
 expect(counts[2].filter(s=>s.kind==='armor')).toHaveLength(10);
 expect(counts[2].every(s=>s.kind!=='charger')).toBe(true);
 expect(chapterAssaults(4,false,1)).not.toEqual(counts[3]);
});
