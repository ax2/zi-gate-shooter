import {it,expect}from'vitest';import{writeFileSync}from'node:fs';import{World}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'./helpers/progression-driver';import{proofTarget}from'./helpers/proof-driver';import{awardAchievements,emptyAchievements,parseAchievements}from'../src/core/achievements';
it('earns both storm refinements, explicitly accepts their matching proof and records actual marked effects before certifying',()=>{
 const runs=[];let saved=emptyAchievements();
 for(const branch of ['storm-relay','storm-focus'])for(const policy of ['aim','edge','late']){const w=new World(1337,1,'scatter');let aim=360,selectedAt,accepted,terminal,reward;const samples=[];
  for(let f=0;f<900*60&&w.player.hp>0;f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a.includes('electric')?'electric':a[0];if(r){const b=r==='ballistic'&&w.canRefineStorm()?branch:r==='ballistic'&&w.canRefineFracture()?'fracture-line':undefined;w.chooseBuild(r,b);if(w.build.stormAugment&&!selectedAt)selectedAt=w.time;}
   if(!accepted&&(policy!=='late'||w.round>=7)&&w.canAcceptContract('research',branch)){expect(w.acceptContract('research',branch)).toBe(true);accepted={time:w.time,round:w.round,roundTime:w.roundTime,start:w.proofCount(branch),global:branch==='storm-relay'?w.stormRelayLinks:w.stormFocusBursts,owned:w.activeWeapons.map(k=>[k,w.weaponStage(k),w.weaponCalibration(k)])};}
   if(f%6===0)aim=w.contract?.status==='active'?(policy==='edge'?652:proofTarget(w,branch)):progressionTarget(w,'scatter');const before=w.proofCount(branch);w.step(C.step,aim);w.drainEffects();if(w.proofCount(branch)>before&&samples.length<20)samples.push({time:w.time,count:w.proofCount(branch),groups:w.contract?.proofGroupCount});
   if(w.contract&&w.contract.status!=='active'&&!terminal)terminal={time:w.time,status:w.contract.status,reason:w.contract.reason,elapsed:w.contract.elapsed,progress:w.contract.proofProgress,groups:w.contract.proofGroupCount,spawned:w.contract.reinforcements,hp:w.player.hp};
   if(w.contractReward){const before={weapons:w.activeWeapons,stage:w.weaponStage('scatter'),calibration:w.weaponCalibration('scatter')};expect(w.claimContractReward('scatter')).toBe(true);expect(w.claimContractReward('energy')).toBe(false);reward={before,after:{weapons:w.activeWeapons,stage:w.weaponStage('scatter'),calibration:w.weaponCalibration('scatter')}};}
   if(terminal)break;
  }
  const fresh=awardAchievements(saved,w.build.ranks,w.activeWeapons.length,w.fractureBursts,w.tacticalWins,w.conduitTacticalWins,w.proofWins,{certifiedBuilds:[...w.certifiedBuilds]}).map(a=>a.id);saved=parseAchievements(JSON.parse(JSON.stringify(saved)));runs.push({branch,policy,selectedAt,accepted,terminal,reward,samples,certified:[...w.certifiedBuilds],fresh,persisted:saved});
 }
 writeFileSync('build/qa/Stage-205/normal-proofs.json',JSON.stringify(runs,null,2));
 for(const r of runs){expect(r.accepted).toBeDefined();expect(r.terminal).toBeDefined();if(r.policy!=='edge'){expect(r.terminal.status,JSON.stringify(r)).toBe('won');expect(r.terminal.groups).toBeGreaterThanOrEqual(2);expect(r.reward).toBeDefined();expect(r.certified).toContain(r.branch);}else if(r.terminal.status==='failed'){expect(r.reward).toBeUndefined();expect(r.certified).not.toContain(r.branch);}}
 expect(saved.unlocked).toContain('storm-specialist');expect(saved.unlocked).toContain('storm-master');
},120000);
