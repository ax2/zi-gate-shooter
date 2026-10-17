import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('both opposite tactics can be earned in round one with all four selectable openings and the legacy default',()=>{
 const runs=[];for(const goal of ['preempt','bait'])for(const opening of ['pulse','scatter','pierce','blast','arc']){
  const w=new World(1337,1,opening==='pulse'?undefined:opening),guns=new Map();let aim=360;
  for(let f=0;f<70*60&&w.phase!=='dead'&&!(goal==='bait'?w.lockBaitWins:w.lockPreemptWins);f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),r=w.build.ranks.optical<3||w.build.refinements.optical<2?'optical':a.find(r=>w.build.ranks[r]<3)??'optical';if(a.includes(r))w.chooseBuild(r,w.build.ranks[r]===1?r==='optical'?'relay':r==='electric'?'seeker':'ricochet':undefined);
   const b=w.bodies.find(b=>b.active&&b.pattern==='lockshot');
   if(f%6===0)aim=b?(goal==='preempt'||(b.lockPassed??0)>=3?b.x:b.x<360?652:68):progressionTarget(w);
   w.step(C.step,aim);w.drainEffects();for(const b of w.bodies)if(b.active&&b.pattern==='lockshot'&&!guns.has(b.id))guns.set(b.id,{body:b,round:w.round,time:w.time,damageAtAdmission:b.lockDamageStart});
  }
  runs.push({goal,opening,time:w.time,hp:w.player.hp,round:w.round,preempt:w.lockPreemptWins,bait:w.lockBaitWins,weapons:w.activeWeapons.map(k=>({kind:k,tier:w.weaponStage(k)})),guns:[...guns.values()].map(({body,...g})=>({...g,hp:body.hp,maxHp:body.maxHp,active:body.active,age:body.age,warning:body.warning,accepted:body.lockAcceptedShots??0,passed:body.lockPassed??0}))});
 }
 mkdirSync('build/qa/Stage-211',{recursive:true});writeFileSync('build/qa/Stage-211/tactical-runs.json',JSON.stringify(runs,null,2));for(const r of runs){expect(r.goal==='bait'?r.bait:r.preempt,JSON.stringify(r)).toBeGreaterThan(0);expect(r.round).toBe(1);expect(r.time).toBeLessThan(65);}
},60000);
