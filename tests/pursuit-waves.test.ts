import{it,expect}from'vitest';import{mkdirSync,writeFileSync}from'node:fs';import{observedNoFireRoute}from'./helpers/observed-route-driver';import{timeline}from'../src/core/director';import{pursuitWaves}from'../src/core/pursuit-waves';import{Random}from'../src/core/director';import{battleIndex}from'../src/core/battle-plan';
const baselinePath='../build/qa/Stage-219/baseline.mjs',old=await import(baselinePath);
it('preserves every original reward/enemy and adds three distinct reserve phrases across 108 schedules',()=>{
 for(let round=1;round<=12;round++)for(const seed of[1,29,1337])for(const plan of[0,1,2] as const){
  const a=old.timeline(round,seed,plan),b=timeline(round,seed,plan).filter(s=>!s.closing&&!s.openingAssault);if(round===1){expect(b).toEqual(a);continue;}
  const mirror=new Random(seed).next()>.5,extra=pursuitWaves(round,mirror,battleIndex(round,plan));
  expect(extra.length).toBe(round%3===0?12:18);const rest=[...b];for(const s of extra){const index=rest.findIndex(t=>JSON.stringify(t)===JSON.stringify(s));expect(index).toBeGreaterThanOrEqual(0);rest.splice(index,1);}expect(rest).toEqual(a);
  expect(extra.filter(s=>s.dropLabel)).toHaveLength(3);expect(extra.every(s=>s.drop&&(s.dropY??0)>=320)).toBe(true);
 }
});
it('retains 450ms observed no-fire routes through all three reserve types and mirrored later chapters',()=>{
 const results=[];for(const round of[2,3,4,5,6,8,9,12,15])for(const plan of[0,1,2] as const)for(const start of[68,360,652])results.push(observedNoFireRoute(round,plan,start,round%2?1337:9001));
 mkdirSync('build/qa/Stage-219',{recursive:true});writeFileSync('build/qa/Stage-219/routes.json',JSON.stringify(results,null,2));
 for(const r of results){const label=JSON.stringify(r);expect(r.failureTime,label).toBeNull();expect(r.phase,label).toBe('boss-entry');expect(r.hp,label).toBe(3);expect(r.damage,label).toBe(0);expect(r.kills,label).toBe(0);expect(r.minObservationSeconds,label).toBeGreaterThanOrEqual(.45);expect(r.unknownEmitterBullets,label).toBe(0);}
},240000);
