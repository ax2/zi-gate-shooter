import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';import {proofTarget} from './helpers/proof-driver';import {emptyAchievements,awardAchievements,parseAchievements} from '../src/core/achievements';
it('normally earns, accepts and wins or loses the magnetic proof through actual extra coverage',()=>{
 const runs=[];let save=emptyAchievements();
 for(const policy of ['wide','link','center','late-wide','late-link']){
  const mode=policy.includes('link')?'field-link':'field-wide',w=new World(1337);let aim=360,selected=false,accepted=null,terminal=null,reward=null;const hits=[],sources=new Set(),emitted=new Set(),arrived=new Set();
  for(let frame=0;frame<660*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');const a=w.build.available(w.buildPoints);
   if(!selected&&w.canRefineMagnetic()&&a.includes('electric')){w.chooseBuild('electric',mode);selected=true;}
   else {const r=a.includes('electric')&&w.build.ranks.electric<3?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];if(r)w.chooseBuild(r,w.build.ranks[r]===1?r==='electric'?'seeker':r==='ballistic'?'ricochet':'relay':undefined);}
   if(!accepted&&(!policy.startsWith('late')||w.round>=7)&&w.canAcceptContract('research','magnetic')){expect(w.acceptContract('research','magnetic')).toBe(true);accepted={time:w.time,round:w.round,hp:w.player.hp,weapons:w.activeWeapons,levels:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponStage(k)])),start:w.magneticProofHits,mode:w.build.magneticAugment};}
   if(frame%6===0)aim=w.contract?.status==='active'?(policy==='center'?360:proofTarget(w,'magnetic')):progressionTarget(w);
   w.step(C.step,aim);for(const b of w.bodies)if(b.proofTarget&&b.proofRound===w.round)sources.add(b.id);for(const b of w.bullets)if(b.hostile&&sources.has(b.sourceId)){emitted.add(b.id);if(b.y>=C.playerY-40)arrived.add(b.id);}
   for(const e of w.drainEffects())if(e.type==='magnetic-hit'||e.type==='magnetic-link')if(w.lastMagneticRefinementHit?.time===w.time&&hits.length<20)hits.push({time:w.time,hit:{...w.lastMagneticRefinementHit},progress:w.contract?.proofProgress,groups:w.contract?.proofGroupCount});
   if(w.contract&&w.contract.status!=='active'&&!terminal)terminal={time:w.time,status:w.contract.status,reason:w.contract.reason,elapsed:w.contract.elapsed,progress:w.contract.proofProgress,hp:w.player.hp,hitGroups:w.contract.proofGroupCount,spawned:w.contract.reinforcements};
   if(w.contractReward){const before={stage:w.weaponStage('blast'),calibration:w.weaponCalibration('blast'),energy:w.growth.energy};expect(w.claimContractReward('blast')).toBe(true);reward={time:w.time,before,after:{stage:w.weaponStage('blast'),calibration:w.weaponCalibration('blast'),energy:w.growth.energy}};expect(w.claimContractReward('energy')).toBe(false);}
   if(terminal&&(terminal.status==='failed'||reward))break;
  }
  const fresh=awardAchievements(save,w.build.ranks,w.activeWeapons.length,w.fractureBursts,w.tacticalWins,w.conduitTacticalWins,w.proofWins,{certifiedBuilds:[...w.certifiedBuilds],magneticCertifications:[...w.magneticCertifications]}).map(a=>a.id);save=parseAchievements(JSON.parse(JSON.stringify(save)));
  runs.push({policy,time:w.time,selected,accepted,terminal,reward,certified:[...w.certifiedBuilds],magneticCertifications:[...w.magneticCertifications],persistedMagnetic:save.magneticCertifications,fresh,proofEmitted:emitted.size,proofArrivals:arrived.size,hits});
 }
 mkdirSync('build/qa/Stage-175',{recursive:true});writeFileSync('build/qa/Stage-175/normal.json',JSON.stringify(runs,null,2));
 for(const r of runs){expect(r.accepted).not.toBeNull();expect(r.terminal).not.toBeNull();if(r.policy==='center'){expect(r.terminal.status).toBe('failed');expect(r.reward).toBeNull();expect(r.certified).not.toContain('magnetic');expect(r.magneticCertifications).toEqual([]);}else{expect(r.terminal.status).toBe('won');expect(r.reward).not.toBeNull();expect(r.terminal.progress).toBeGreaterThanOrEqual(6);expect(r.terminal.hitGroups).toBeGreaterThanOrEqual(2);expect(r.magneticCertifications).toHaveLength(1);}}
 expect(save.unlocked).toContain('magnetic-master');
},60000);
