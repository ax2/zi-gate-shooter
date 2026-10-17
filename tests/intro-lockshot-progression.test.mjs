import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('both opposite tactics can be earned in round one with all four selectable openings and the legacy default',()=>{
 const runs=[];for(const goal of ['preempt','bait'])for(const opening of ['pulse','scatter','pierce','blast','arc']){
  const w=new World(1337,1,opening==='pulse'?undefined:opening),guns=new Map(),damage=[];let aim=360;
  for(let f=0;f<70*60&&w.phase!=='dead'&&!(goal==='bait'?w.lockBaitWins:w.lockPreemptWins);f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),r=w.build.ranks.optical<3||w.build.refinements.optical<2?'optical':a.find(r=>w.build.ranks[r]<3)??'optical';if(a.includes(r))w.chooseBuild(r,w.build.ranks[r]===1?r==='optical'?'relay':r==='electric'?'seeker':'ricochet':undefined);
   const b=w.bodies.find(b=>b.active&&b.pattern==='lockshot');
   if(f%6===0){const escort=w.bodies.find(e=>e.active&&(e.kind==='elite'&&e.pattern==='fan'||e.kind==='guard'&&e.pattern==='convoy'));if(!b)aim=escort?.x??progressionTarget(w);else if(goal==='preempt'||(b.lockPassed??0)>=3){const crate=goal==='bait'&&w.bodies.some(c=>c.active&&c.kind==='crate'&&Math.abs(c.y-C.playerY)<c.height/2+C.playerRadius+24&&Math.max(w.player.x,b.x)>c.x-c.width/2-C.playerRadius&&Math.min(w.player.x,b.x)<c.x+c.width/2+C.playerRadius);aim=crate?w.player.x:b.x;}else{const side=b.x<360?652:68;aim=Math.abs(side-(b.lockX??360))<80?side+(side<360?64:-64):side;}}
   const priorDamage=w.damageTaken;w.step(C.step,aim);w.drainEffects();if(w.damageTaken>priorDamage)damage.push({time:w.time,x:w.player.x,cause:w.lastDamageCause,near:w.bodies.filter(b=>b.active&&Math.abs(b.y-C.playerY)<180).map(b=>({kind:b.kind,x:b.x,y:b.y})),bullets:w.bullets.filter(b=>b.hostile&&Math.abs(b.y-C.playerY)<180).map(b=>({x:b.x,y:b.y,source:b.sourceId}))});for(const b of w.bodies)if(b.active&&b.pattern==='lockshot'&&!guns.has(b.id))guns.set(b.id,{body:b,round:w.round,time:w.time,damageAtAdmission:b.lockDamageStart});
  }
  runs.push({goal,opening,damage,time:w.time,hp:w.player.hp,round:w.round,preempt:w.lockPreemptWins,bait:w.lockBaitWins,weapons:w.activeWeapons.map(k=>({kind:k,tier:w.weaponStage(k)})),guns:[...guns.values()].map(({body,...g})=>({...g,hp:body.hp,maxHp:body.maxHp,active:body.active,age:body.age,warning:body.warning,accepted:body.lockAcceptedShots??0,passed:body.lockPassed??0}))});
 }
 mkdirSync('build/qa/Stage-211',{recursive:true});writeFileSync('build/qa/Stage-211/tactical-runs.json',JSON.stringify(runs,null,2));for(const r of runs){expect(r.goal==='bait'?r.bait:r.preempt,JSON.stringify(r)).toBeGreaterThan(0);expect(r.round).toBe(1);expect(r.time).toBeLessThan(65);}
},60000);
