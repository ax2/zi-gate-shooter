import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('supports expansion or focused refitting through normal 300-second growth without granted equipment',()=>{
 const results=[];
 for(const policy of ['expand','refit']){
  const w=new World(1337);let target=360,last=0;const claims=[],offers=[];const rows=new Set();
  for(let f=0;f<300*60&&w.phase!=='dead';f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   if(w.contractReward)w.claimContractReward('energy');
   if(w.build.available(w.buildPoints).includes('optical'))w.chooseBuild('optical',w.build.ranks.optical===1?'burn':undefined);
   if(w.round===2&&w.roundTime>=15.9&&!w.contract)w.acceptContract('specialist');
   if(f%6===0){
    const candidates=w.bodies.filter(b=>b.active&&b.weaponKind&&(b.kind==='crate'||b.kind==='pickup'));
    const wanted=candidates.filter(b=>policy==='refit'?b.refit:!b.refit&&!w.activeWeapons.includes(b.weaponKind)).sort((a,b)=>Number(b.kind==='pickup')-Number(a.kind==='pickup'))[0];
    target=progressionTarget(w,wanted?.weaponKind);
   }
   w.step(C.step,target);w.drainEffects();
   for(const b of w.bodies)if(b.active&&b.kind==='crate'&&b.row&&!rows.has(b.row)){
    const row=w.bodies.filter(o=>o.active&&o.kind==='crate'&&o.row===b.row);
    if(row.some(o=>o.refit)){rows.add(b.row);offers.push({time:w.time,round:w.round,choices:row.map(o=>({kind:o.weaponKind,refit:!!o.refit,stage:o.stage}))});}
   }
   if(w.refitsClaimed>last){last=w.refitsClaimed;claims.push({time:w.time,round:w.round,weapons:w.activeWeapons.map(kind=>({kind,stage:w.weaponStage(kind),calibration:w.weaponCalibration(kind)})),energy:w.growth.energy});}
  }
  results.push({policy,time:w.time,round:w.round,hp:w.player.hp,weapons:w.activeWeapons,levels:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponStage(k)])),calibrations:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponCalibration(k)])),refits:w.refitsClaimed,kills:w.kills,contract:w.contract?{kind:w.contract.kind,status:w.contract.status,reason:w.contract.reason}:null,contractStats:w.contractStats,offers,claims,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
  expect(w.time).toBeCloseTo(300);expect(w.player.hp).toBeGreaterThan(0);expect(offers.length).toBeGreaterThan(0);
  if(policy==='refit'){expect(w.refitsClaimed).toBeGreaterThanOrEqual(2);expect(w.activeWeapons).toHaveLength(3);expect(w.contract?.status).toBe('won');}
  else {expect(w.activeWeapons).toHaveLength(5);expect(w.contract?.status).toBe('failed');expect(w.contract?.reason).toBe('新增了武器种类');}
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-refit`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/normal.json`,JSON.stringify(results,null,2));
},60000);
