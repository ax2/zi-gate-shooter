import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from '../tests/helpers/progression-driver';
const oldPath='./baseline.mjs',Old=(await import(oldPath)).World;
const rows:any[]=[];
for(const route of ['ballistic','electric','optical'] as const){
 const w=new World(1337,1,'scatter',0),old=new Old(1337,1,'scatter',0);let aim=360,baseScore=0,frames=0;const bursts:any[]=[];
 const state=(v:World)=>JSON.stringify(v,(k,v)=>k==='score'||k==='rapidBreak'?undefined:v instanceof Map?[...v]:v instanceof Set?[...v]:v);
 for(let f=0;f<1200*60&&w.player.hp>0;f++){
  for(const v of [w,old]){
   if(v.bossRewardRound!==null&&v.phase==='recovery'&&v.phaseTime>=C.bossLootReveal)v.claimBossReward('research');
   const a=v.build.available(v.buildPoints),r=a.includes(route)?route:a[0];
   if(r)v.chooseBuild(r,r==='ballistic'?(v.canFuseAmmo()?'fuse-fragment':v.canRefineStorm()?'storm-relay':v.canRefineFracture()?'fracture-line':v.build.ranks[r]===1?'ricochet':undefined):r==='electric'?(v.canRefineMagnetic()?'field-link':v.canRefineIon()?'ion-orb':v.build.ranks[r]===1?'seeker':undefined):v.canRefinePhoton()?'photon-reach':v.build.ranks[r]===1?'burn':undefined);
  }
  if(f%6===0)aim=progressionTarget(w);
  const bonus=w.rapidBreak.totalBonus;w.step(C.step,aim);old.step(C.step,aim);
  for(const e of w.drainEffects())if(e.type==='kill'||e.type==='boss-kill')baseScore+=C.enemies[e.enemyKind!].score;
  old.drainEffects();assert.equal(state(w),state(old),'Combat drift at '+route+' '+w.time);assert.equal(w.score,old.score+w.rapidBreak.totalBonus);assert.equal(w.score,baseScore+w.rapidBreak.totalBonus);frames++;
  if(w.rapidBreak.totalBonus>bonus)bursts.push({time:w.time,round:w.round,delta:w.rapidBreak.totalBonus-bonus,...w.rapidBreak.last});
 }
 rows.push({route,frames,time:w.time,hp:w.player.hp,round:w.round,pickups:w.pickups,gates:w.gatesTaken,mastery:w.growth.mastery,score:w.score,baseScore,bonus:w.rapidBreak.totalBonus,best:w.rapidBreak.best,chains:w.rapidBreak.chains,bursts});console.log(JSON.stringify({...rows.at(-1),bursts:bursts.length}));
}
writeFileSync('build/qa/Stage-238/normal.json',JSON.stringify({method:'Virtual60Hz omniscient control, earned upgrades, every frame public World equal except score/tracker; no human/device difficulty claim',rows},null,2));
