import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('earns the final electric node and actual area hits in both normal 300-second forks',()=>{
 const results=[];
 for(const branch of ['spread','capacitor']){
  const w=new World(1337);let target=360,first=null;const bursts=[];
  for(let f=0;f<300*60&&w.phase!=='dead';f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   if(w.contractReward)w.claimContractReward('energy');
   const routes=w.build.available(w.buildPoints),r=routes.includes('electric')?'electric':routes[0];if(r)w.chooseBuild(r,r==='electric'&&w.build.ranks.electric===1?branch:undefined);
   if(w.build.ranks.electric===3&&first===null)first=w.time;
   if(f%6===0)target=progressionTarget(w);w.step(C.step,target);
   for(const e of w.drainEffects())if(e.type==='ion-storm')bursts.push({time:w.time,x:e.x,y:e.y,hits:w.ionHits});
  }
  results.push({branch,time:w.time,round:w.round,hp:w.player.hp,kills:w.kills,firstNode:first,ionBursts:w.ionBursts,ionHits:w.ionHits,arcLinks:w.arcLinks,capacitorBursts:w.capacitorBursts,peakBodies:w.peakBodies,peakBullets:w.peakBullets,bursts});
  expect(first).not.toBeNull();expect(w.time).toBeCloseTo(300);expect(w.player.hp).toBeGreaterThan(0);expect(w.ionBursts).toBeGreaterThan(0);expect(w.ionHits).toBeGreaterThan(0);
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-ion-storm`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/normal.json`,JSON.stringify(results,null,2));
},60000);
