import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';import {Contract} from '../src/core/contracts';import {mkdirSync,writeFileSync} from 'node:fs';
it.each([['prism',68],['prism',360],['prism',652],['ion',68],['ion',360],['ion',652],['storm',68],['storm',360],['storm',652],['fracture',68],['fracture',360],['fracture',652],['photon',68],['photon',360],['photon',652]] as const)('keeps admitted proof groups escapable without kills (%s, x%s)',(proof,start)=>{
 // Unit-only unarmed observer: no support laser or combo damage. Earned eligibility is covered by normal runs.
 const w=new World(1337,2);w.player.x=w.player.px=start;
 w.contract=new Contract('research',2,0,1,0,{kind:proof,start:0});let path:number[]=[],planAt=0,seen=-1;
 for(let frame=0;frame<30*60;frame++){
  if(frame===0||frame-planAt>=60||seen!==w.contract!.reinforcements){
   const reaction=seen!==w.contract!.reinforcements?.45:0;
   const route=safeRoute(w.player.x,w.bodies,w.bullets,6,{phase:w.phase,phaseTime:w.phaseTime,reaction});
   expect(route,`t=${w.time}, admitted=${w.contract!.reinforcements}`).not.toBeNull();path=route??[];planAt=frame;seen=w.contract!.reinforcements;
  }
  w.step(C.step,path[Math.floor((frame-planAt)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);
  expect(w.player.hp,`t=${w.time}`).toBe(3);expect(w.bodies.filter(b=>b.active&&b.kind in C.enemies).length).toBeLessThanOrEqual(C.limits.enemies);
 }
 expect(w.contract!.reinforcements).toBeGreaterThan(0);expect(w.contract!.status).toBe('failed');expect(w.kills).toBe(0);expect(w.proofWins).toBe(0);expect(w.contractReward).toBeUndefined();
 mkdirSync('build/qa/Stage-154/proof-routes',{recursive:true});writeFileSync(`build/qa/Stage-154/proof-routes/${proof}-${start}.json`,JSON.stringify({proof,start,time:w.time,admitted:w.contract!.reinforcements,hp:w.player.hp,kills:w.kills,status:w.contract!.status,peakBodies:w.peakBodies,peakBullets:w.peakBullets,fallbacks:w.fallbackCount},null,2));
},120000);
