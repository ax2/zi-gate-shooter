import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';import {MAGNETIC} from '../src/core/magnetic-field';
it('normally earns magnetic fields through three branch builds and measures real later entrants',()=>{
 const runs=[];
 for(const branch of ['spread','capacitor','seeker']){
  const w=new World(1337);let aim=360,firstReady=null,firstField=null,peak=0;const origins=new Map(),hits=[];const pick=[];
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const available=w.build.available(w.buildPoints),route=available.includes('electric')&&w.build.ranks.electric<2?'electric':available.find(r=>w.build.ranks[r]<3)??available[0];
   if(route)w.chooseBuild(route,w.build.ranks[route]===1?route==='electric'?branch:route==='ballistic'?'ricochet':'relay':undefined);
   if(frame%6===0)aim=progressionTarget(w);w.step(C.step,aim);
   if(w.magneticUnlocked()&&firstReady===null)firstReady=w.time;
   for(const field of w.magneticFields)if(!origins.has(field.id)){const inside=w.bodies.filter(b=>b.active&&b.kind in C.enemies&&Math.hypot(b.x-field.x,b.y-field.y)<=MAGNETIC.radius).map(b=>b.id);origins.set(field.id,{time:w.time,x:field.x,y:field.y,inside});if(firstField===null)firstField=w.time;}
   for(const e of w.drainEffects())if(e.type==='magnetic-hit'){const origin=origins.get(e.fieldId);hits.push({time:w.time,fieldId:e.fieldId,targetId:e.targetId,delay:origin?w.time-origin.time:null,laterEntrant:origin?!origin.inside.includes(e.targetId):false,x:e.x,y:e.y});}
   peak=Math.max(peak,w.magneticFields.length);if(frame%600===0)pick.push({time:w.time,weapons:w.activeWeapons.map(k=>({kind:k,tier:w.weaponStage(k)})),ranks:{...w.build.ranks},fields:w.magneticBursts,hits:w.magneticHits});
  }
  runs.push({branch,time:w.time,round:w.round,hp:w.player.hp,firstReady,firstField,fields:w.magneticBursts,hits:w.magneticHits,lateHits:hits.filter(h=>h.laterEntrant).length,peak,origins:[...origins.entries()],contacts:hits,progression:pick,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 mkdirSync('build/qa/Stage-172',{recursive:true});writeFileSync('build/qa/Stage-172/normal.json',JSON.stringify(runs,null,2));
 for(const run of runs){expect(run.hp).toBeGreaterThan(0);expect(run.time).toBeCloseTo(600,5);expect(run.fields).toBeGreaterThan(5);expect(run.hits).toBeGreaterThan(5);expect(run.lateHits).toBeGreaterThan(0);expect(run.peak).toBeLessThanOrEqual(MAGNETIC.limit);expect(run.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(run.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},60000);
