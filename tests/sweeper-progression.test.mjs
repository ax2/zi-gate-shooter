import {it,expect} from 'vitest';import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';import {MAGNETIC} from '../src/core/magnetic-field';
it('normally meets moving sweepers and records movement plus magnetic field value across three builds',()=>{
 const runs=[],baseline=JSON.parse(readFileSync('docs/stages/Stage-172/normal.json','utf8'));
 for(const branch of ['spread','capacitor','seeker']){
  const w=new World(1337);let aim=360,firstReady=null,firstField=null,peak=0;const origins=new Map(),hits=[],sweepers=new Map(),relayTargets=new Set(),arrived=new Set();const pick=[];
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const available=w.build.available(w.buildPoints),route=available.includes('electric')&&w.build.ranks.electric<2?'electric':available.find(r=>w.build.ranks[r]<3)??available[0];
   if(route)w.chooseBuild(route,w.build.ranks[route]===1?route==='electric'?branch:route==='ballistic'?'ricochet':'relay':undefined);
   if(frame%6===0)aim=progressionTarget(w);w.step(C.step,aim);for(const b of w.bodies)if(b.pattern==='relay-screen')relayTargets.add(b.id);for(const b of w.bullets)if(b.hostile&&b.sourceId!==undefined&&b.y>=C.playerY-40)arrived.add(b.id);
   if(w.magneticUnlocked()&&firstReady===null)firstReady=w.time;
   for(const b of w.bodies)if(b.pattern==='sweep'){let entry=sweepers.get(b.id);if(!entry){entry={id:b.id,round:w.round,spawnedAt:w.time,kind:b.kind,shots:0,move:0,age:0,reached:false};sweepers.set(b.id,entry);}entry.shots=Math.max(entry.shots,b.sweeperShots??0);entry.move=Math.max(entry.move,Math.abs(b.x-(720-b.lane)));entry.age=Math.max(entry.age,b.age);entry.reached||=b.x===b.lane;}
   for(const field of w.magneticFields)if(!origins.has(field.id)){const inside=w.bodies.filter(b=>b.active&&b.kind in C.enemies&&Math.hypot(b.x-field.x,b.y-field.y)<=MAGNETIC.radius).map(b=>b.id);origins.set(field.id,{time:w.time,x:field.x,y:field.y,inside});if(firstField===null)firstField=w.time;}
   for(const e of w.drainEffects())if(e.type==='magnetic-hit'){const origin=origins.get(e.fieldId);hits.push({time:w.time,fieldId:e.fieldId,targetId:e.targetId,delay:origin?w.time-origin.time:null,laterEntrant:origin?!origin.inside.includes(e.targetId):false,x:e.x,y:e.y});}
   peak=Math.max(peak,w.magneticFields.length);if(frame%600===0)pick.push({time:w.time,weapons:w.activeWeapons.map(k=>({kind:k,tier:w.weaponStage(k)})),ranks:{...w.build.ranks},fields:w.magneticBursts,hits:w.magneticHits});
  }
  runs.push({branch,time:w.time,round:w.round,hp:w.player.hp,firstReady,firstField,fields:w.magneticBursts,hits:w.magneticHits,actualHostileArrivals:arrived.size,sweepers:[...sweepers.values()],hitsOnRelayScreen:hits.filter(h=>relayTargets.has(h.targetId)).length,hitsOnSweepers:hits.filter(h=>sweepers.has(h.targetId)).length,laterHitsOnSweepers:hits.filter(h=>sweepers.has(h.targetId)&&h.laterEntrant).length,before:{fields:baseline.find(r=>r.branch===branch).fields,hits:baseline.find(r=>r.branch===branch).hits,lateHits:baseline.find(r=>r.branch===branch).lateHits},lateHits:hits.filter(h=>h.laterEntrant).length,peak,origins:[...origins.entries()],contacts:hits,progression:pick,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 mkdirSync('build/qa/Stage-173',{recursive:true});writeFileSync('build/qa/Stage-173/normal.json',JSON.stringify(runs,null,2));
 for(const run of runs){expect(run.actualHostileArrivals).toBeGreaterThan(0);expect(run.sweepers).toHaveLength(20);expect(run.sweepers.filter(s=>s.move>=100).length).toBeGreaterThanOrEqual(15);expect(run.sweepers.reduce((n,s)=>n+s.shots,0)).toBeGreaterThan(0);expect(run.hp).toBeGreaterThan(0);expect(run.time).toBeCloseTo(600,5);expect(run.fields).toBeGreaterThan(5);expect(run.hits).toBeGreaterThan(5);// Stage176 replaces the R5 light targets responsible for the old incidental late entry.
  // Keep reporting late entry honestly, and require actual field damage on the new formation instead.
  expect(run.hitsOnRelayScreen).toBeGreaterThan(0);expect(run.peak).toBeLessThanOrEqual(MAGNETIC.limit);expect(run.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(run.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},60000);
