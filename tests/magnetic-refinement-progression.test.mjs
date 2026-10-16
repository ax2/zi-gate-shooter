import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('normally chooses damage-only, wide and field-link at an earned point and observes real additional coverage',()=>{
 const runs=[];for(const option of [null,'field-wide','field-link']){
  const w=new World(1337);let aim=360,decision=null;const examples=[];
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');const available=w.build.available(w.buildPoints);
   if(!decision&&w.canRefineMagnetic()&&available.includes('electric')){const before={time:w.time,weapons:w.activeWeapons.map(k=>({kind:k,stage:w.weaponStage(k)})),spent:w.build.spent,refinements:w.build.refinements.electric};expect(w.chooseBuild('electric',option??undefined)).toBe(true);decision={before,afterSpent:w.build.spent,afterRefinement:w.build.refinements.electric};}
   else {const r=available.includes('electric')&&w.build.ranks.electric<3?'electric':available.find(r=>w.build.ranks[r]<3)??available[0];if(r)w.chooseBuild(r,w.build.ranks[r]===1?r==='electric'?'seeker':r==='ballistic'?'ricochet':'relay':undefined);}
   if(frame%6===0)aim=progressionTarget(w);w.step(C.step,aim);for(const e of w.drainEffects())if((e.type==='magnetic-link'||e.type==='magnetic-hit')&&examples.length<8){const hit=w.lastMagneticRefinementHit;if(hit?.time===w.time&&(!examples.length||examples.at(-1).time!==hit.time))examples.push({...hit});}
  }
  runs.push({option,time:w.time,hp:w.player.hp,round:w.round,kills:w.kills,gates:w.gatesTaken,decision,refinement:w.build.refinements.electric,fields:w.magneticBursts,baseHits:w.magneticHits,wideHits:w.magneticWideHits,linkHits:w.magneticLinkHits,examples,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 mkdirSync('build/qa/Stage-174',{recursive:true});writeFileSync('build/qa/Stage-174/normal.json',JSON.stringify(runs,null,2));
 for(const r of runs){expect(r.time).toBeCloseTo(600,5);expect(r.hp).toBeGreaterThan(0);expect(r.decision).not.toBeNull();expect(r.decision.afterSpent).toBe(r.decision.before.spent+1);expect(r.decision.afterRefinement).toBe(r.decision.before.refinements+1);expect(r.baseHits).toBeGreaterThan(0);expect(r.peakBodies).toBeLessThanOrEqual(32);expect(r.peakBullets).toBeLessThanOrEqual(128);if(r.option==='field-wide')expect(r.wideHits).toBeGreaterThan(0);if(r.option==='field-link')expect(r.linkHits).toBeGreaterThan(0);}
},60000);
