import {C} from '../../src/core/config';import {progressionTarget} from './progression-driver';
const growth=w=>({bonus:w.growth.bonus,energy:w.growth.energy,mastery:w.growth.mastery??0,research:w.researchPoints,spent:w.build.spent,weapons:w.activeWeapons.map(k=>[k,w.weaponStage(k),w.weaponCalibration(k)])});
export function runCadence(World,policy='safe',seed=1337,plan=0,seconds=300){
 const w=new World(seed,1,'scatter',plan),changes=[],gates=[],rewards=[],sources=new Map(),seen=new Set(),shots=new Set();let aim=360;
 for(let f=0;f<seconds*60&&w.phase!=='dead';f++){
  const before=growth(w);
  if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
  const a=w.build.available(w.buildPoints),r=a.includes('optical')&&w.build.ranks.optical<3?'optical':a.includes('electric')&&w.build.ranks.electric<3?'electric':a[0];if(r)w.chooseBuild(r,w.build.ranks[r]===1?r==='optical'?'burn':r==='electric'?'seeker':'ricochet':undefined);
  if(f%6===0&&policy==='safe')aim=progressionTarget(w);
  if(f%6===0&&policy==='aim'){const b=w.bodies.filter(b=>b.active&&['pickup','crate','gate'].includes(b.kind)).sort((a,b)=>b.y-a.y)[0]??w.bodies.filter(b=>b.active).sort((a,b)=>b.y-a.y)[0];if(b)aim=b.x;}
  w.step(C.step,aim);const events=w.drainEffects(),after=growth(w);
  for(const b of w.bodies)if(b.active&&!seen.has(b.id)){seen.add(b.id);if(b.kind==='gate')gates.push({time:w.time,round:w.round,roundTime:w.roundTime,x:b.x,kind:b.rewardKind,row:b.row});if(['armor','sniper','guard','elite'].includes(b.kind))sources.set(b.id,{kind:b.kind,pattern:b.pattern,round:w.round});}
  for(const p of w.bullets)if(p.hostile&&p.sourceId)shots.add(p.sourceId);
  if(after.energy>before.energy||after.bonus>before.bonus||after.mastery>before.mastery||after.research>before.research||after.spent>before.spent||JSON.stringify(after.weapons)!==JSON.stringify(before.weapons))changes.push({time:w.time,round:w.round,roundTime:w.roundTime,phase:w.phase,before,after,events:events.filter(e=>e.text).map(e=>({type:e.type,text:e.text}))});
  for(const e of events)if(['reward','upgrade','pickup','overload','victory','research','gate-taken'].includes(e.type))rewards.push({time:w.time,type:e.type,text:e.text});
 }
 let last=0,maxGrowthGap=0;const gaps=[];for(const c of changes){gaps.push({from:last,to:c.time,seconds:c.time-last,round:c.round,phase:c.phase});maxGrowthGap=Math.max(maxGrowthGap,c.time-last);last=c.time;}maxGrowthGap=Math.max(maxGrowthGap,w.time-last);
 return {policy,seed,plan,time:w.time,round:w.round,hp:w.player.hp,kills:w.kills,maxGrowthGap,gaps,changes,gates,rewards,firingSources:[...sources.entries()].filter(([id])=>shots.has(id)).map(([,g])=>g),mastery:w.growth.mastery??0,refits:w.refitsClaimed,peakBodies:w.peakBodies,peakBullets:w.peakBullets,method:'World normal movement/firing and legal choices; scripted operators, not human difficulty or pixel evidence'};
}
