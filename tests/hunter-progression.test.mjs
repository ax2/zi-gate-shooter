import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';
import {C,clamp} from '../src/core/config';
import {dangerTimeline,safeRoute} from '../src/core/reachability';
import {progressionTarget} from './helpers/progression-driver';
function aim(w){
 const target=w.bodies.filter(b=>b.active&&b.bountyRound===w.contract?.round).sort((a,b)=>b.y-a.y)[0];
 if(!target)return progressionTarget(w);
 const x=w.player.x,next=x+clamp(target.x-x,-C.moveSpeed*.1,C.moveSpeed*.1),opts={phase:w.phase,phaseTime:w.phaseTime,reaction:0};
 const blocked=dangerTimeline(w.bodies,w.bullets,1.5,opts).some(row=>row.some(([lo,hi])=>Math.max(x,next)>=lo&&Math.min(x,next)<=hi));
 return blocked?(safeRoute(x,w.bodies,w.bullets,4,opts)?.[0]??x):next;
}
it('earns and claims early hunter rewards through normal equipment and actual elite kills',()=>{
 const records=[];
 for(const seed of [1337,77])for(const policy of ['energy','equipment']){
  const w=new World(seed);let target=360,acceptedAt=null,wonAt=null,claim=null;const kills=[];
  for(let frame=0;frame<90*60&&w.phase!=='dead';frame++){
   if(acceptedAt===null&&w.canAcceptContract('hunter')){w.acceptContract('hunter');acceptedAt=w.time;}
   if(w.contractReward&&!claim){
    const selected=policy==='energy'?'energy':w.weaponKind;
    const before=Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponStage(k)]));w.claimContractReward(selected);
    claim={time:w.time,selected,before,after:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponStage(k)])),energy:w.growth.energy,mastery:w.growth.mastery??0};
   }
   const available=w.build.available(w.growth.mastery??0);if(available.includes('optical'))w.chooseBuild('optical');
   if(frame%6===0)target=w.contract?.status==='active'?aim(w):progressionTarget(w);
   w.step(C.step,target);
   for(const e of w.drainEffects())if(e.type==='bounty-progress')kills.push({time:w.time,text:e.text});
   if(w.contract?.status==='won'&&wonAt===null)wonAt=w.time;
  }
  records.push({seed,policy,time:w.time,hp:w.player.hp,acceptedAt,wonAt,contract:w.contract,claim,kills,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 const directory=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-hunter-progression`;
 mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/hunter.json`,JSON.stringify(records,null,2));
 for(const r of records){expect(r.acceptedAt).not.toBeNull();expect(r.contract.status).toBe('won');expect(r.kills).toHaveLength(2);expect(r.wonAt).toBeLessThan(60);expect(r.claim).not.toBeNull();expect(r.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},60000);
