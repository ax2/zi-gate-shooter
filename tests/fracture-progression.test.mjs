import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {progressionTarget} from './helpers/progression-driver';
it('reaches and uses fracture through normal equipment choices in a five-minute run',()=>{
 const results=[];
 for(const seed of [1337,77]){
  const w=new World(seed);let target=360,unlockedAt=null,firstBurstAt=null;
  const rewards=[];
  for(let frame=0;frame<300*60&&w.phase!=='dead';frame++){
   const route=w.build.available(w.growth.mastery??0).includes('optical')?'optical':undefined;if(route)w.chooseBuild(route);
   const preferred=!w.activeWeapons.includes('pierce')?'pierce':!w.activeWeapons.includes('blast')?'blast':undefined;
   if(frame%6===0)target=progressionTarget(w,preferred);
   w.step(C.step,target);
   for(const e of w.drainEffects())if(['pickup','upgrade','weapon','combination'].includes(e.type))rewards.push({time:w.time,type:e.type,text:e.text});
   if(w.fractureUnlocked()&&unlockedAt===null)unlockedAt=w.time;
   if(w.fractureBursts>0&&firstBurstAt===null)firstBurstAt=w.time;
  }
  results.push({seed,time:w.time,hp:w.player.hp,round:w.round,unlockedAt,firstBurstAt,bursts:w.fractureBursts,rewards,
   levels:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponStage(k)])),peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 const directory=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-fracture-progression`;
 mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/progression.json`,JSON.stringify(results,null,2));
 for(const r of results){expect(r.unlockedAt).not.toBeNull();expect(r.bursts).toBeGreaterThan(0);expect(r.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},60000);
