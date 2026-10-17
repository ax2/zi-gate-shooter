import {it,expect} from 'vitest';import {writeFileSync} from 'node:fs';import {existsSync} from 'node:fs';import {execFileSync} from 'node:child_process';
if(!existsSync('build/qa/Stage-196/baseline-world.mjs'))execFileSync(process.execPath,['tools/capture-stage196-baseline.mjs']);
const {World}=await import('../build/qa/Stage-196/baseline-world.mjs');import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('records complete reward events and independent actual growth deltas under fixed and normal inputs',()=>{
 const results=[];for(const policy of ['idle','aim','safe']){
  const w=new World(1337,1,'scatter');let aim=360;const rewards=[],growthChanges=[],candidateKills=[],damage=[],gunSpawns=[];const state=()=>({energy:w.growth.energy,bonus:w.growth.bonus,mastery:w.growth.mastery??0,research:w.researchPoints,spent:w.build.spent,weapons:w.activeWeapons.map(k=>[k,w.weaponStage(k),w.weaponCalibration(k)])});const shots=new Set(),seen=new Set();let lastDamage=0;
  for(let frame=0;frame<300*60&&w.phase!=='dead';frame++){
   const old=state();
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),r=a.includes('optical')&&w.build.ranks.optical<3?'optical':a.includes('electric')&&w.build.ranks.electric<3?'electric':a[0];if(r)w.chooseBuild(r,w.build.ranks[r]===1?r==='optical'?'burn':r==='electric'?'seeker':'ricochet':undefined);
   if(frame%6===0&&policy==='safe')aim=progressionTarget(w);
   if(frame%6===0&&policy==='aim'){const target=w.bodies.filter(b=>b.active&&['pickup','crate','gate'].includes(b.kind)).sort((a,b)=>b.y-a.y)[0]??w.bodies.filter(b=>b.active).sort((a,b)=>b.y-a.y)[0];if(target)aim=target.x;}
   const before=[...w.bodies];for(const b of before)if(b.active&&!seen.has(b.id)){seen.add(b.id);if(['sniper','armor','guard','elite'].includes(b.kind))gunSpawns.push({b,at:w.time,round:w.round});}w.step(C.step,aim);const events=w.drainEffects();for(const b of w.bullets)if(b.hostile&&b.sourceId)shots.add(b.sourceId);
   for(const b of before)if(!b.active&&b.hp<=0&&['sniper','armor','guard'].includes(b.kind)&&b.warning>0&&!(b.empRemaining>0)&&!b.escort)candidateKills.push({time:w.time,round:w.round,kind:b.kind,pattern:b.pattern,warning:b.warning});
   for(const e of events)if(['reward','upgrade','pickup','overload','victory','research','gate-taken'].includes(e.type))rewards.push({time:w.time,type:e.type,text:e.text});
   const current=state();if(current.energy>old.energy||current.bonus>old.bonus||current.mastery>old.mastery||current.research>old.research||current.spent>old.spent||JSON.stringify(current.weapons)!==JSON.stringify(old.weapons))growthChanges.push({time:w.time,before:old,after:current,events:events.filter(e=>e.text).map(e=>({type:e.type,text:e.text}))});
   if(w.damageTaken>lastDamage){damage.push(w.time);lastDamage=w.damageTaken;}
  }
  let last=0,maxGap=0;for(const r of rewards){maxGap=Math.max(maxGap,r.time-last);last=r.time;}maxGap=Math.max(maxGap,w.time-last);
  let lastGrowth=0,maxGrowthGap=0;for(const g of growthChanges){maxGrowthGap=Math.max(maxGrowthGap,g.time-lastGrowth);lastGrowth=g.time;}maxGrowthGap=Math.max(maxGrowthGap,w.time-lastGrowth);
  results.push({growthChanges,maxGrowthGap,policy,time:w.time,round:w.round,hp:w.player.hp,kills:w.kills,damage,maxRewardGap:maxGap,rewards,candidateKills,gunSpawns:gunSpawns.map(t=>({kind:t.b.kind,pattern:t.b.pattern,round:t.round,spawnedAt:t.at,fired:shots.has(t.b.id),age:t.b.age,hp:t.b.hp,lockShots:t.b.lockAcceptedShots??0})),method:'normal World inputs; aim/safe operators are scripted, not human difficulty evidence'});
 }
 writeFileSync('build/qa/Stage-196/cadence-baseline.json',JSON.stringify(results,null,2));expect(results.every(r=>r.kills>0)).toBe(true);
},60000);
