import {build} from 'esbuild';import {mkdirSync,writeFileSync} from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {World as Previous} from '../build/qa/Stage-189/baseline.mjs';
const out=await build({stdin:{contents:`export {World} from './src/core/world';export {C} from './src/core/config';export {progressionTarget} from './tests/helpers/progression-driver';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});
const {World,C,progressionTarget}=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
const state=w=>JSON.stringify({time:w.time,round:w.round,roundTime:w.roundTime,phase:w.phase,phaseTime:w.phaseTime,player:w.player,growth:w.growth,score:w.score,kills:w.kills,pickups:w.pickups,gates:w.gatesTaken,weapons:w.activeWeapons.map(k=>({kind:k,tier:w.weaponStage(k),calibration:w.weaponCalibration(k)})),bodies:w.bodies.map(b=>Object.fromEntries(Object.entries(b).filter(([k])=>!['lockDamageStart','lockPassed'].includes(k)))),bullets:w.bullets});
const runs=[];for(const opening of ['pulse','scatter','pierce','blast','arc']){
 const old=new Previous(1337,1,opening==='pulse'?undefined:opening),now=new World(1337,1,opening==='pulse'?undefined:opening),hash=createHash('sha256');let aim=360;
 for(let f=0;f<10800;f++){
  for(const w of [old,now]){if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');const a=w.build.available(w.buildPoints),r=w.build.ranks.optical<3||w.build.refinements.optical<2?'optical':a.find(r=>w.build.ranks[r]<3)??'optical';if(a.includes(r))w.chooseBuild(r,w.build.ranks[r]===1?r==='optical'?'relay':r==='electric'?'seeker':'ricochet':undefined);}
  if(f%6===0){aim=progressionTarget(now);assert.equal(aim,progressionTarget(old));}
  old.step(C.step,aim);now.step(C.step,aim);const a=state(old),b=state(now),e=old.drainEffects();assert.equal(a,b,`${opening} frame ${f}`);assert.deepEqual(e,now.drainEffects());hash.update(a).update(JSON.stringify(e));
 }
 runs.push({opening,seconds:now.time,round:now.round,hp:now.player.hp,frames:10800,weapons:now.activeWeapons,score:now.score,physicalAndEffectHash:hash.digest('hex'),comparison:'first 180 seconds fixed-step physical state and effect identical to 112ab91 before the new heavy tail'});
}
mkdirSync('build/qa/Stage-189',{recursive:true});writeFileSync('build/qa/Stage-189/opening-parity.json',JSON.stringify(runs,null,2));console.log(JSON.stringify(runs.map(r=>({opening:r.opening,round:r.round,hp:r.hp,frames:r.frames})),null,2));
