import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {Contract} from '../src/core/contracts';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';
it.each([[1,68],[1,360],[1,652],[4,68],[4,360],[4,652]] as const)('keeps two-sided elite validation escapable without kills (round%s x%s)',(round,start)=>{
 // Unit-only unarmed observation; actual earned eligibility is tested in normal progression.
 const w=new World(1337,round);w.player.x=w.player.px=start;w.contract=new Contract('research',round,0,1,0,{kind:'ricochet',start:0});let path:number[]=[],at=0,seen=-1,proofShots=0;
 for(let frame=0;frame<30*60;frame++){
  if(frame===0||frame-at>=60||seen!==w.contract.reinforcements){const reaction=seen!==w.contract.reinforcements?.45:0;const route=safeRoute(w.player.x,w.bodies,w.bullets,6,{phase:w.phase,phaseTime:w.phaseTime,reaction});expect(route,`t=${w.time}, groups=${w.contract.reinforcements}`).not.toBeNull();path=route??[];at=frame;seen=w.contract.reinforcements;}
  w.step(C.step,path[Math.floor((frame-at)/6)]??w.player.x);w.drainEffects();const sources=w.bodies.filter(b=>b.active&&b.proofRound===round);proofShots+=w.bullets.filter(s=>s.hostile&&s.age<=C.step+1e-8&&sources.some(b=>Math.abs(s.px-b.x)<1e-6&&Math.abs(s.py-b.y-b.height/2)<1e-6)).length;w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp,`t=${w.time}`).toBe(3);expect(w.bodies.filter(b=>b.active&&b.kind in C.enemies).length).toBeLessThanOrEqual(C.limits.enemies);
 }
 expect(proofShots).toBeGreaterThan(0);expect(w.kills).toBe(0);expect(w.contract.status).toBe('failed');expect(w.contract.proofGroupCount).toBe(0);expect(w.contractReward).toBeUndefined();expect(w.certifiedBuilds.size).toBe(0);expect(w.contract.reinforcements).toBeGreaterThan(0);
 mkdirSync('build/qa/Stage-170/routes',{recursive:true});writeFileSync(`build/qa/Stage-170/routes/${round}-${start}.json`,JSON.stringify({round,start,hp:w.player.hp,proofShots,kills:w.kills,groups:w.contract.reinforcements,peakBodies:w.peakBodies,peakBullets:w.peakBullets,fallbacks:w.fallbackCount},null,2));
},60000);
