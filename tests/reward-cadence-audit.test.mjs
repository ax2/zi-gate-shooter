import {it,expect} from 'vitest';import {writeFileSync,mkdirSync} from 'node:fs';import {existsSync} from 'node:fs';import {execFileSync} from 'node:child_process';
if(!existsSync('build/qa/Stage-195/baseline-world.mjs'))execFileSync(process.execPath,['tools/capture-stage195-baseline.mjs']);
const {World}=await import('../build/qa/Stage-195/baseline-world.mjs');import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('records selected legacy events (excluding gate-taken) and real charging kills under fixed and normal aiming inputs',()=>{
 const results=[];for(const policy of ['idle','aim','safe']){
  const w=new World(1337,1,'scatter');let aim=360;const rewards=[],candidateKills=[],damage=[],gunSpawns=[],lockGuns=[];const shots=new Set(),seen=new Set();let lastDamage=0;
  for(let frame=0;frame<300*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),r=a.includes('optical')&&w.build.ranks.optical<3?'optical':a.includes('electric')&&w.build.ranks.electric<3?'electric':a[0];if(r)w.chooseBuild(r,w.build.ranks[r]===1?r==='optical'?'burn':r==='electric'?'seeker':'ricochet':undefined);
   if(frame%6===0&&policy==='safe')aim=progressionTarget(w);
   if(frame%6===0&&policy==='aim'){const target=w.bodies.filter(b=>b.active&&['pickup','crate','gate'].includes(b.kind)).sort((a,b)=>b.y-a.y)[0]??w.bodies.filter(b=>b.active).sort((a,b)=>b.y-a.y)[0];if(target)aim=target.x;}
   const before=[...w.bodies];for(const b of before)if(b.active&&!seen.has(b.id)){seen.add(b.id);if(['sniper','armor','guard','elite'].includes(b.kind))gunSpawns.push({b,at:w.time,round:w.round});}w.step(C.step,aim);const events=w.drainEffects();for(const b of w.bullets)if(b.hostile&&b.sourceId)shots.add(b.sourceId);
   for(const b of before)if(!b.active&&b.hp<=0&&['sniper','armor','guard'].includes(b.kind)&&b.warning>0&&!(b.empRemaining>0)&&!b.escort)candidateKills.push({time:w.time,round:w.round,kind:b.kind,pattern:b.pattern,warning:b.warning});
   for(const e of events)if(['reward','upgrade','pickup','overload','victory','research'].includes(e.type))rewards.push({time:w.time,type:e.type,text:e.text});
   if(w.damageTaken>lastDamage){damage.push(w.time);lastDamage=w.damageTaken;}
  }
  let last=0,maxGap=0;for(const r of rewards){maxGap=Math.max(maxGap,r.time-last);last=r.time;}maxGap=Math.max(maxGap,w.time-last);
  results.push({policy,time:w.time,round:w.round,hp:w.player.hp,kills:w.kills,damage,maxSelectedEventGap:maxGap,omittedEvents:['gate-taken'],rewards,candidateKills,gunSpawns:gunSpawns.map(t=>({kind:t.b.kind,pattern:t.b.pattern,round:t.round,spawnedAt:t.at,fired:shots.has(t.b.id),age:t.b.age,hp:t.b.hp,lockShots:t.b.lockAcceptedShots??0})),method:'normal World inputs; aim/safe operators are scripted, not human difficulty evidence'});
 }
 mkdirSync('build/qa/Stage-196',{recursive:true});writeFileSync('build/qa/Stage-196/legacy-selected-events.json',JSON.stringify(results,null,2));expect(results.every(r=>r.kills>0)).toBe(true);
},60000);
