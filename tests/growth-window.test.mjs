import{it,expect}from'vitest';import{timeline,INTRO_MID_GATE_AT}from'../src/core/director';import{World}from'../src/core/world';import{runDefaultPressure}from'./helpers/default-pressure-driver';
const old=await import('../build/qa/Stage-217/baseline.mjs');
it('retimes the first middle gate and T3 armory in 108 schedules, retaining all enemies and reward rows',()=>{
 for(let round=1;round<=12;round++)for(const seed of[1,29,1337])for(const plan of[0,1,2]){
  const a=old.timeline(round,seed,plan),b=timeline(round,seed,plan);
  const middle=(s,at)=>s.kind==='gates'&&s.at===at;
  expect(b.length).toBe(a.length);expect(INTRO_MID_GATE_AT).toBe(35);if(round>1){expect(b).toEqual(a);continue;}
  expect(b.filter(s=>middle(s,35))).toEqual(a.filter(s=>middle(s,39)).map(s=>({...s,at:35})));
  expect(b.filter(s=>s.kind==='armory'&&s.at===46.5)).toEqual(a.filter(s=>s.kind==='armory'&&s.at===48).map(s=>({...s,at:46.5})));expect(b.filter(s=>!middle(s,35)&&!(s.kind==='armory'&&s.at===46.5))).toEqual(a.filter(s=>!middle(s,39)&&!(s.kind==='armory'&&s.at===48)));
 }
});
it.each(['ballistic','electric','optical'])('%s collects the formerly missed middle gate and reduces actual growth gaps during normal play',route=>{
 const before=runDefaultPressure(old.World,route,'safe',300),after=runDefaultPressure(World,route,'safe',300);
 expect(after.time).toBeGreaterThanOrEqual(300);expect(after.hp).toBe(3);expect(after.damage).toBe(0);
 const first=r=>r.growth.filter(g=>g.round===1&&g.time<70),gaps=r=>{let last=0;return first(r).map(g=>{const gap=g.time-last;last=g.time;return gap;});};
 expect(Math.max(...gaps(before))).toBeGreaterThan(20);expect(Math.max(...gaps(after))).toBeLessThan(14);
 expect(first(before).at(-1).gates).toBe(3);expect(first(after).at(-1).gates).toBe(4);
 expect(first(after).some(g=>g.gates===3&&g.time>=40&&g.time<42)).toBe(true);
 expect(after.maxGrowthGap).toBeLessThan(before.maxGrowthGap);
 expect(after.gates).toBeGreaterThanOrEqual(13);expect(after.pickups).toBeGreaterThanOrEqual(10);
},60000);
