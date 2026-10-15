import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('claims both blueprint and equipment policies through normal ten-minute runs without granting state',()=>{
 const results=[];
 for(const policy of ['research','equipment']){const w=new World(1337);const claims=[];let x=360,victories=0;
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal){const kind=policy==='research'?'research':w.activeWeapons.includes('arc')?'arc':w.activeWeapons[0],round=w.bossRewardRound,points=w.buildPoints,stage=kind==='research'?0:w.weaponStage(kind),calibration=kind==='research'?0:w.weaponCalibration(kind);
    expect(w.claimBossReward(kind)).toBe(true);claims.push({round,kind,time:w.time,pointsBefore:points,pointsAfter:w.buildPoints,stageBefore:stage,stageAfter:kind==='research'?0:w.weaponStage(kind),calibrationBefore:calibration,calibrationAfter:kind==='research'?0:w.weaponCalibration(kind)});}
   const available=w.build.available(w.buildPoints),route=available.find(r=>w.build.ranks[r]<3)??available[0];if(route)w.chooseBuild(route);
   if(frame%6===0)x=progressionTarget(w);w.step(C.step,x);for(const e of w.drainEffects())if(e.type==='boss-kill')victories++;
  }
  results.push({policy,time:w.time,hp:w.player.hp,round:w.round,bossWins:w.bossWins,victories,stats:{...w.bossLootStats},claims,mastery:w.growth.mastery,research:w.researchPoints,weaponLevels:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponStage(k)])),calibrations:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponCalibration(k)])),peakBodies:w.peakBodies,peakBullets:w.peakBullets});
  expect(w.time).toBeCloseTo(600);expect(w.bossLootStats.claimed).toBe(claims.length);expect(claims.length).toBeGreaterThanOrEqual(5);expect(w.bossWins).toBe(victories);expect(w.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(w.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-boss-loot`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/loot.json`,JSON.stringify(results,null,2));
},60000);
