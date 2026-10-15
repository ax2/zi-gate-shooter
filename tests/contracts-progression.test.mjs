import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {progressionTarget} from './helpers/progression-driver';
it('runs repeated real contracts with alternative reward policies through normal ten-minute progression',()=>{
 const results=[];
 for(const policy of ['charge','equipment']){
  const w=new World(1337);let target=360;const claims=[];
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(w.contractReward){
    const selected=policy==='charge'?'energy':w.activeWeapons.find(k=>w.weaponStage(k)<3)??(w.activeWeapons.includes('blast')?'blast':w.weaponKind);
    expect(w.claimContractReward(selected)).toBe(true);claims.push({time:w.time,round:w.round,selected});
   }
   const available=w.build.available(w.growth.mastery??0);
   const route=available.find(r=>w.build.ranks[r]<3)??available[0];if(route)w.chooseBuild(route);
   if(w.phase==='running'&&w.roundTime>=8&&w.roundTime<9&&!w.contractReward&&w.contract?.round!==w.round)w.acceptContract('precision');
   if(frame%6===0)target=progressionTarget(w);
   w.step(C.step,target);w.drainEffects();
  }
  results.push({policy,time:w.time,hp:w.player.hp,round:w.round,claims,mastery:w.growth.mastery,calibrations:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponCalibration(k)])),levels:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponStage(k)])),peakBodies:w.peakBodies,peakBullets:w.peakBullets});
  expect(w.time).toBeCloseTo(600);expect(claims.length).toBeGreaterThan(1);
  expect(w.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);
 }
 const directory=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-contract-progression`;
 mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/contracts.json`,JSON.stringify(results,null,2));
},60000);
