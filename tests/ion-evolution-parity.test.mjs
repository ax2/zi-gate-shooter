import {it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {existsSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {World} from '../src/core/world';
if(!existsSync('build/qa/Stage-190/baseline.mjs'))execFileSync(process.execPath,['tools/capture-stage190-baseline.mjs']);
const {World:Baseline}=await import('../build/qa/Stage-190/baseline.mjs');
import {C} from '../src/core/config';
import {progressionTarget} from './helpers/progression-driver';
// Only pre-existing keys, including all bodies, shots, reward counters and private schedules.
function oldShape(current,baseline){
 if(baseline===null||typeof baseline!=='object')return current;
 if(Array.isArray(baseline))return Array.isArray(current)?current.map((v,i)=>oldShape(v,baseline[i])):current;
 return Object.fromEntries(Object.keys(baseline).map(k=>[k,oldShape(current?.[k],baseline[k])]));
}
it('without selecting ion evolution, original world and effects stay identical for five 180-second openings',()=>{
 const results=[];
 for(const weapon of ['pulse','scatter','pierce','blast','arc']){
  const w=new World(1337,1,weapon),old=new Baseline(1337,1,weapon),hash=createHash('sha256');let aim=360;
  for(let frame=0;frame<180*60;frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal){w.claimBossReward('research');old.claimBossReward('research');}
   const a=w.build.available(w.buildPoints),r=a.includes('electric')?'electric':a[0];if(r){w.chooseBuild(r);old.chooseBuild(r);}
   if(frame%6===0)aim=progressionTarget(w);w.step(C.step,aim);old.step(C.step,aim);
   const baseline=JSON.parse(JSON.stringify(old)),actual=oldShape(JSON.parse(JSON.stringify(w)),baseline),effects=w.drainEffects(),oldEffects=old.drainEffects();
   expect(actual,`${weapon}/${frame}`).toEqual(baseline);expect(w.activeWeapons.map(k=>[k,w.weaponStage(k),w.weaponCalibration(k),w.profileFor(k)])).toEqual(old.activeWeapons.map(k=>[k,old.weaponStage(k),old.weaponCalibration(k),old.profileFor(k)]));expect(effects,`${weapon}/${frame}/effects`).toEqual(oldEffects);hash.update(JSON.stringify(actual));
  }
  results.push({weapon,steps:10800,seconds:w.time,hp:w.player.hp,sha256:hash.digest('hex')});
 }
 writeFileSync('build/qa/Stage-190/opening-parity.json',JSON.stringify(results,null,2));
},60000);
