import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {progressionTarget} from './helpers/progression-driver';
it('both ion evolutions unlock through earned progression and land additional hits in ten-minute runs',()=>{
 const runs=[];
 for(const seed of [1337,9001])for(const option of ['ion-orb','ion-spear']){
  const w=new World(seed);let aim=360,decision=null,firstHit=null,maxOrbs=0,maxSpears=0;
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const available=w.build.available(w.buildPoints);
   if(w.canRefineIon()&&available.includes('electric')){
    const before={time:w.time,spent:w.build.spent,refinements:w.build.refinements.electric,weapons:w.activeWeapons.map(k=>({kind:k,stage:w.weaponStage(k)})),charge:w.ionCharge};
    expect(w.chooseBuild('electric',option)).toBe(true);decision={before,afterSpent:w.build.spent,afterRefinements:w.build.refinements.electric,afterCharge:w.ionCharge};
   }else if(available.length){
    const r=w.canRefineMagnetic()&&available.includes('electric')?'electric':available.includes('electric')&&(w.build.ranks.electric<3||w.build.refinements.electric<2)?'electric':available.find(r=>w.build.ranks[r]<3)??available[0];
    w.chooseBuild(r,r==='electric'&&w.canRefineMagnetic()?'field-link':w.build.ranks[r]===1?r==='electric'?'seeker':r==='ballistic'?'ricochet':'relay':undefined);
   }
   if(frame%6===0)aim=progressionTarget(w,'arc');w.step(C.step,aim);w.drainEffects();
   maxOrbs=Math.max(maxOrbs,w.ionOrbs.length);maxSpears=Math.max(maxSpears,w.ionSpears.length);
   if(!firstHit&&w.ionOrbHits+w.ionSpearHits)firstHit={time:w.time,round:w.round,orbHits:w.ionOrbHits,spearHits:w.ionSpearHits,damage:w.ionBonusDamage};
  }
  runs.push({seed,option,time:w.time,hp:w.player.hp,round:w.round,kills:w.kills,decision,firstHit,bursts:w.ionBursts,baseHits:w.ionHits,orbSpawns:w.ionOrbSpawns,orbHits:w.ionOrbHits,spearShots:w.ionSpearShots,spearHits:w.ionSpearHits,bonusDamage:w.ionBonusDamage,maxOrbs,maxSpears,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 mkdirSync('build/qa/Stage-190',{recursive:true});writeFileSync('build/qa/Stage-190/normal.json',JSON.stringify(runs,null,2));
 for(const r of runs){expect(r.time).toBeCloseTo(600,5);expect(r.hp).toBeGreaterThan(0);expect(r.decision).not.toBeNull();expect(r.decision.afterSpent).toBe(r.decision.before.spent+1);expect(r.decision.afterRefinements).toBe(r.decision.before.refinements+1);expect(r.decision.afterCharge).toBe(r.decision.before.charge);expect(r.firstHit).not.toBeNull();expect(r.baseHits).toBeGreaterThan(0);expect(r.bonusDamage).toBeGreaterThan(0);expect(r.maxOrbs).toBeLessThanOrEqual(2);expect(r.maxSpears).toBeLessThanOrEqual(4);expect(r.peakBodies).toBeLessThanOrEqual(32);expect(r.peakBullets).toBeLessThanOrEqual(128);}
},60000);
