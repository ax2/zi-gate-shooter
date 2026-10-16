import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';
it.each([1,2,4])('keeps the actual unarmed double-fan encounter avoidable with reaction time in round %s',round=>{
 const records=[];
 for(const start of [68,360,652]){
  const w=new World(1337,round);w.player.x=start;const p=w.spawn('pickup',start,C.playerY,2);p.weaponKind='pulse';w.step(C.step,start);expect(w.acceptContract('hunter',undefined,'crossfire')).toBe(true);
  let path:number[]=[],at=0,seen=-1;
  for(let f=0;f<30*60;f++){
   if(f===0||f-at>=60||seen!==w.contract!.reinforcements){const route=safeRoute(w.player.x,w.bodies,w.bullets,6,{phase:w.phase,phaseTime:w.phaseTime,reaction:seen!==w.contract!.reinforcements?.45:0});expect(route,`r${round} x${start} t${w.time}`).not.toBeNull();path=route??[];at=f;seen=w.contract!.reinforcements;}
   w.step(C.step,path[Math.floor((f-at)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp,`r${round} x${start} t${w.time}`).toBe(3);
  }
  records.push({round,start,hp:w.player.hp,kills:w.kills,damageTaken:w.damageTaken,admitted:w.contract!.reinforcements,status:w.contract!.status,shots:w.bountyShots,peakBodies:w.peakBodies,peakBullets:w.peakBullets,fallbacks:w.fallbackCount});expect(w.kills).toBe(0);expect(w.contract!.reinforcements).toBe(2);expect(w.bountyShots).toBeGreaterThan(0);expect(w.contractReward).toBeUndefined();
 }
 mkdirSync('build/qa/Stage-156/routes',{recursive:true});writeFileSync(`build/qa/Stage-156/routes/round-${round}.json`,JSON.stringify(records,null,2));
},120000);
