import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {awardAchievements,emptyAchievements,parseAchievements} from '../src/core/achievements';import {proofTarget} from './helpers/proof-driver';import {progressionTarget} from './helpers/progression-driver';
it('normally earns ricochet, deliberately accepts the side challenge, and compares flank aiming with staying central',()=>{
 const runs=[];
 for(const policy of ['flank','center','late','late-optical']){
  const w=new World(1337);let aim=360,accepted=null,terminal=null,claimed=null,index=0;const plan=policy==='late-optical'?['ballistic','ballistic','optical','optical','optical']:['ballistic','ballistic','electric','ballistic'],events=[];
  for(let frame=0;frame<480*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),want=plan[index]??(policy==='late-optical'?'optical':'ballistic');if(a.includes(want)){w.chooseBuild(want,want==='ballistic'&&w.build.ranks.ballistic===1?'ricochet':undefined);index++;}
   if(!accepted&&(!policy.startsWith('late')||w.round>=4)&&w.canAcceptContract('research','ricochet')){w.acceptContract('research','ricochet');accepted={time:w.time,round:w.round,hp:w.player.hp,start:w.scatterRicochets,weapons:w.activeWeapons,ranks:{...w.build.ranks}};}
   if(frame%6===0)aim=w.contract?.status==='active'?(policy==='center'?360:proofTarget(w,'ricochet')):progressionTarget(w);
   w.step(C.step,aim);for(const e of w.drainEffects())if(e.type==='ricochet')events.push({time:w.time,x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,progress:w.contract?.proofProgress});
   if(w.contract&&w.contract.status!=='active'&&!terminal)terminal={time:w.time,status:w.contract.status,reason:w.contract.reason,elapsed:w.contract.elapsed,progress:w.contract.proofProgress,hp:w.player.hp,groups:w.contract.reinforcements,hitGroups:w.contract.proofGroupCount};
   if(w.contractReward){const before={stage:w.weaponStage('scatter'),calibration:w.weaponCalibration('scatter'),energy:w.growth.energy};expect(w.claimContractReward('scatter')).toBe(true);claimed={time:w.time,before,after:{stage:w.weaponStage('scatter'),calibration:w.weaponCalibration('scatter'),energy:w.growth.energy}};expect(w.claimContractReward('scatter')).toBe(false);}
   if(terminal&&(terminal.status==='failed'||claimed))break;
  }
  const save=emptyAchievements(),fresh=awardAchievements(save,w.build.ranks,w.activeWeapons.length,w.fractureBursts,w.tacticalWins,w.conduitTacticalWins,w.proofWins,{certifiedBuilds:[...w.certifiedBuilds]}).map(a=>a.id),loaded=parseAchievements(JSON.parse(JSON.stringify(save)));
  runs.push({policy,time:w.time,hp:w.player.hp,accepted,terminal,claimed,stats:w.contractStats,certified:[...w.certifiedBuilds],fresh,loaded,events,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 mkdirSync('build/qa/Stage-170',{recursive:true});writeFileSync('build/qa/Stage-170/normal.json',JSON.stringify(runs,null,2));
 const flank=runs[0];expect(flank.accepted).not.toBeNull();expect(flank.terminal?.status).toBe('won');expect(flank.claimed).not.toBeNull();expect(flank.terminal.progress).toBeGreaterThanOrEqual(12);expect(flank.loaded.unlocked).toContain('bank-shot');expect(flank.loaded.certifiedBuilds).toContain('ricochet');expect(flank.hp).toBeGreaterThan(0);expect(flank.terminal.hitGroups).toBeGreaterThanOrEqual(2);expect(runs[2].terminal.status).toBe('won');expect(runs[2].terminal.hitGroups).toBeGreaterThanOrEqual(2);expect(runs[1].terminal.status).toBe('failed');expect(runs[1].claimed).toBeNull();expect(runs[1].loaded.unlocked).not.toContain('bank-shot');expect(runs[3].terminal.status).toBe('won');expect(runs[3].claimed.after.calibration).toBe(1);
 for(const r of runs){expect(r.accepted).not.toBeNull();expect(r.terminal).not.toBeNull();expect(r.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},60000);
