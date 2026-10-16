import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('earns three ballistic branches normally and measures actual separated flank hits over ten minutes',()=>{
 const runs=[];
 for(const branch of ['penetrator','fragment','ricochet']){
  const w=new World(1337);let target=360,chosenAt=null;const bounces=[];
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),r=a.includes('ballistic')&&w.build.ranks.ballistic<3?'ballistic':a.find(r=>w.build.ranks[r]<3)??a[0];
   if(r){w.chooseBuild(r,r==='ballistic'&&w.build.ranks.ballistic===1?branch:undefined);if(w.build.ballisticBranch&&chosenAt===null)chosenAt=w.time;}
   if(frame%6===0)target=progressionTarget(w);w.step(C.step,target);
   for(const e of w.drainEffects())if(e.type==='ricochet')bounces.push({time:w.time,round:w.round,x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,distance:Math.hypot(e.targetX-e.x,e.targetY-e.y),side:Math.abs(e.targetX-e.x)});
  }
  runs.push({branch,selected:w.build.ballisticBranch,chosenAt,time:w.time,round:w.round,hp:w.player.hp,kills:w.kills,bounces:w.scatterRicochets,pierces:w.scatterPierces,splashHits:w.scatterSplashHits,stormLinks:w.stormLinks,weapons:w.activeWeapons,peakBodies:w.peakBodies,peakBullets:w.peakBullets,events:bounces});
 }
 mkdirSync('build/qa/Stage-168',{recursive:true});writeFileSync('build/qa/Stage-168/ballistic-normal.json',JSON.stringify(runs,null,2));
 for(const r of runs){expect(r.time).toBeCloseTo(600);expect(r.hp).toBeGreaterThan(0);expect(r.selected).toBe(r.branch);expect(r.chosenAt).toBeLessThan(90);expect(r.stormLinks).toBeGreaterThan(0);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
 const ricochet=runs.find(r=>r.branch==='ricochet');expect(ricochet.bounces).toBeGreaterThan(10);expect(ricochet.events.some(e=>e.distance>140)).toBe(true);expect(ricochet.events.every(e=>e.distance<=280.00001&&e.side>=80)).toBe(true);
},60000);
