import{it,expect}from'vitest';import{mkdirSync,writeFileSync}from'node:fs';import{observedNoFireRoute}from'./helpers/observed-route-driver';
it('preserves per-body 450ms observation in mirrored flank plans and late heavy formations without firing',()=>{
 const results=[];
 for(const round of[2,5,8])for(const plan of[0,1,2]as const)for(const start of[68,360,652])results.push(observedNoFireRoute(round,plan,start,9001));
 for(const round of[9,12,15])for(const seed of[1,9001])for(const start of[68,360,652])results.push(observedNoFireRoute(round,0,start,seed));
 mkdirSync('build/qa/Stage-218',{recursive:true});writeFileSync('build/qa/Stage-218/mirrored-no-fire-routes.json',JSON.stringify(results,null,2));
 for(const r of results){const label=`R${r.round} P${r.plan}/${r.seed}/x${r.start} t${r.time}`;
  expect(r.failureTime,label).toBeNull();expect(r.phase,label).toBe('boss-entry');expect(r.hp,label).toBe(3);expect(r.damage,label).toBe(0);expect(r.kills,label).toBe(0);expect(r.cratesBroken,label).toBe(0);
  expect(r.minObservationSeconds,label).toBeGreaterThanOrEqual(.45);expect(r.unknownEmitterBullets,label).toBe(0);expect(r.observedBodies,label).toBeGreaterThan(10);expect(r.maxBodies,label).toBeLessThanOrEqual(32);expect(r.maxBullets,label).toBeLessThanOrEqual(48);
 }
},180000);
