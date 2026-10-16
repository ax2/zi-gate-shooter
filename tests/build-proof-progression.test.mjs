import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {proofTarget} from './helpers/proof-driver';
it('records real acceptance and actual outcomes for four normally earned builds',()=>{
 const results=[];
 for(const proof of ['storm','prism','fracture','ion']){
  const plan=proof==='storm'?['ballistic','ballistic','electric','ballistic']:proof==='prism'?['optical','optical','optical','ballistic']:proof==='ion'?['electric','electric','electric']:['optical','optical','optical'];
  const w=new World(1337);let target=360,accepted=null,won=null,claim=null,index=0;
  for(let f=0;f<600*60&&w.phase!=='dead';f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   if(w.contractReward&&!claim){const kind=proof==='prism'?'energy':proof==='storm'?'scatter':proof==='fracture'?'pierce':'arc';const before={level:kind==='energy'?null:w.weaponStage(kind),calibration:kind==='energy'?null:w.weaponCalibration(kind),mastery:w.growth.mastery??0};w.claimContractReward(kind);claim={time:w.time,kind,before,after:{level:kind==='energy'?null:w.weaponStage(kind),calibration:kind==='energy'?null:w.weaponCalibration(kind),mastery:w.growth.mastery??0}};}
   const routes=w.build.available(w.buildPoints),want=plan[index]??plan.at(-1);if(routes.includes(want)){w.chooseBuild(want);index++;}
   if(accepted===null&&w.canAcceptContract('research',proof)){w.acceptContract('research',proof);accepted={time:w.time,round:w.round,start:w.proofCount(proof),weapons:w.activeWeapons,levels:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponStage(k)]))};}
   if(f%6===0)target=proofTarget(w,proof);w.step(C.step,target);w.drainEffects();
   if(w.contract?.status==='won'&&won===null)won={time:w.time,elapsed:w.contract.elapsed,progress:w.contract.proofProgress};
   if(claim)break;
  }
  results.push({proof,time:w.time,round:w.round,hp:w.player.hp,kills:w.kills,accepted,won,claim,status:w.contract?.status,reason:w.contract?.reason,progress:w.contract?.proofProgress,stats:w.contractStats,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-build-proof`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/normal.json`,JSON.stringify(results,null,2));
 for(const r of results){expect(r.accepted,r.proof).not.toBeNull();expect(r.won,r.proof).not.toBeNull();expect(r.claim,r.proof).not.toBeNull();expect(r.hp,r.proof).toBeGreaterThan(0);}
},120000);
