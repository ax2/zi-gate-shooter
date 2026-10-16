import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';import {huntAim} from './helpers/hunter-driver';
it('earns both hunter choices and both rewards through real early progression while recording actual hostile shots',()=>{
 const records=[];
 for(const [hunt,readiness] of [['staggered','early'],['crossfire','early'],['crossfire','prepared']])for(const choice of ['energy','equipment']){
  const w=new World(1337);let target=360,accepted=null,won=null,claim=null,admissionMs=0;const shots=[],seen=new Set();
  for(let f=0;f<180*60&&w.phase!=='dead';f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   if(!accepted&&(readiness==='early'||w.round>=2&&w.activeWeapons.some(k=>w.weaponStage(k)>=3))&&w.canAcceptContract('hunter',undefined,hunt)){w.acceptContract('hunter',undefined,hunt);accepted={time:w.time,research:w.researchPoints,levels:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponStage(k)]))};}
   if(w.contractReward&&!claim){const research=w.researchPoints,kind=choice==='energy'?'energy':w.weaponKind;w.claimContractReward(kind);claim={time:w.time,researchBefore:research,researchAfter:w.researchPoints,kind};}
   const routes=w.build.available(w.buildPoints);if(routes.includes('optical'))w.chooseBuild('optical');
   if(f%6===0)target=w.contract?.status==='active'?huntAim(w):progressionTarget(w);const admitting=w.contract?.status==='active'&&w.contract.reinforcements===0,begin=performance.now();w.step(C.step,target);if(admitting)admissionMs=Math.max(admissionMs,performance.now()-begin);w.drainEffects();
   if(w.contract?.status==='active')for(const b of w.bullets)if(b.hostile&&!seen.has(b.id)){seen.add(b.id);shots.push({time:w.time,x:b.x,y:b.y,vx:b.vx,vy:b.vy});}
   if(w.contract?.status==='won'&&!won)won={time:w.time,elapsed:w.contract.elapsed,targets:w.contract.targetKills};if(claim||w.contract?.status==='failed')break;
  }
  records.push({hunt,readiness,choice,bountyShots:w.bountyShots,admissionMs,time:w.time,hp:w.player.hp,damageTaken:w.damageTaken,accepted,won,claim,targetsKilled:w.contract?.targetKills,status:w.contract?.status,reason:w.contract?.reason,shots,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-crossfire-hunt`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/normal.json`,JSON.stringify(records,null,2));
 for(const r of records){if(r.hunt==='crossfire'&&r.readiness==='early'){expect(r.status).toBe('failed');expect(r.claim).toBeNull();expect(r.bountyShots).toBeGreaterThan(0);continue;}expect(r.won,`${r.hunt}/${r.choice}`).not.toBeNull();expect(r.claim,`${r.hunt}/${r.choice}`).not.toBeNull();expect(r.hp).toBeGreaterThan(0);expect(r.claim.researchAfter-r.claim.researchBefore).toBe(r.hunt==='crossfire'?1:0);}
},120000);
