import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('earns all three electric branches normally and observes actual rearward seeker hits',()=>{
 const runs=[];
 for(const branch of ['spread','capacitor','seeker']){
  const w=new World(1337);let target=360,chosenAt=null;const jumps=[];
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),r=a.includes('electric')&&w.build.ranks.electric<3?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];
   if(r){w.chooseBuild(r,r==='electric'&&w.build.ranks.electric===1?branch:undefined);if(w.build.electricBranch&&chosenAt===null)chosenAt=w.time;}
   if(frame%6===0)target=progressionTarget(w);const prior=[...w.bodies];w.step(C.step,target);
   for(const e of w.drainEffects())if(e.type==='arc'&&e.seeker){const b=prior.find(b=>Math.abs(b.x-e.targetX)<.01&&Math.abs(b.y-e.targetY)<.01);jumps.push({time:w.time,round:w.round,x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,distance:Math.hypot(e.targetX-e.x,e.targetY-e.y),target:b?.kind??'spawned-this-step',warning:b?.warning??null});}
  }
  runs.push({branch,selected:w.build.electricBranch,chosenAt,time:w.time,round:w.round,hp:w.player.hp,kills:w.kills,seekerLinks:w.seekerLinks,capacitorBursts:w.capacitorBursts,arcLinks:w.arcLinks,ionBursts:w.ionBursts,weapons:w.activeWeapons,peakBodies:w.peakBodies,peakBullets:w.peakBullets,jumps});
 }
 mkdirSync('build/qa/Stage-164',{recursive:true});writeFileSync('build/qa/Stage-164/electric-normal.json',JSON.stringify(runs,null,2));
 for(const r of runs){expect(r.time).toBeCloseTo(600);expect(r.hp).toBeGreaterThan(0);expect(r.selected).toBe(r.branch);expect(r.chosenAt).toBeLessThan(150);expect(r.ionBursts).toBeGreaterThan(0);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
 const seeker=runs.find(r=>r.branch==='seeker');expect(seeker.seekerLinks).toBeGreaterThan(0);expect(seeker.jumps.some(e=>e.distance>220)).toBe(true);
},60000);
