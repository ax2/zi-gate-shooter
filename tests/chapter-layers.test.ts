import{it,expect}from'vitest';import{timeline,Random}from'../src/core/director';import{chapterAssaults}from'../src/core/chapter-assaults';import{battleIndex}from'../src/core/battle-plan';
const path='../build/qa/Stage-228/baseline.mjs',old=await import(path);
it('preserves every unrelated spawn and reward across108 chapter schedules, and keeps three fixed-size pressure phrases',()=>{
 for(let round=1;round<=12;round++)for(const seed of[1,29,1337])for(const plan of[0,1,2]as const){
  const mirror=round>1&&new Random(seed).next()>.5,variation=battleIndex(round,plan),a=chapterAssaults(round,mirror,variation),b=old.timeline(round,seed,plan),actual=timeline(round,seed,plan);
  const strip=(list:any[],own:any[])=>{const rest=[...list];for(const s of own){const i=rest.findIndex(t=>JSON.stringify(t)===JSON.stringify(s));expect(i).toBeGreaterThanOrEqual(0);rest.splice(i,1);}return rest;};
  const oldOwn=b.filter((s:any)=>s.dropLabel&&['集群突破','侧翼轮袭','补给截击','重装梯队','破阵重炮'].includes(s.dropLabel));
  expect(oldOwn.length).toBe(3);expect(a.length).toBe(round===1?24:(round-1)%3===0?36:27);expect(a.filter(s=>s.dropLabel)).toHaveLength(3);
  // Base is pinned; infer the old phrase roster from the authored times and
  // compare exact multiset membership via a separate exported baseline helper.
  const oldAssault=old.chapterAssaults(round,mirror,variation);expect(a.length).toBe(oldAssault.length);
  expect(strip(actual,a)).toEqual(strip(b,oldAssault));
 }
});
it('makes the middle corridor and flank phrases different fights without replacing their reward windows',()=>{
 const corridor=chapterAssaults(1,false,0);expect(corridor.filter(s=>s.at<15).every(s=>s.kind==='drone')).toBe(true);
 const guns=corridor.filter(s=>s.kind==='armor');expect(guns).toHaveLength(2);expect(guns.every(s=>s.at>22&&s.at<23.5&&s.pattern==='fan'&&s.opening===.1)).toBe(true);
 const flank=chapterAssaults(2,false,0);expect(flank.filter(s=>s.kind==='sniper')).toHaveLength(2);expect(flank.filter(s=>s.kind==='charger')).toHaveLength(7);expect(flank.filter(s=>s.kind==='sniper').every(s=>s.pattern==='lockshot'&&s.lane===undefined)).toBe(true);
 const heavy=chapterAssaults(3,false,0),sweep=heavy.filter(s=>s.pattern==='sweep');expect(sweep).toHaveLength(1);expect(sweep[0].lane).toBe(720-sweep[0].x);expect(heavy.filter(s=>s.breach)).toHaveLength(3);
});
it('mirrors gun movement and all charge destinations together in every variant',()=>{
 for(let round=1;round<=9;round++)for(const variation of[0,1,2])expect(chapterAssaults(round,true,variation)).toEqual(chapterAssaults(round,false,variation).map(s=>({...s,x:720-s.x,lane:s.lane===undefined?undefined:720-s.lane})));
});
