import{World}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'../tests/helpers/progression-driver';import type{OpticalBranch,OpticalFusion}from'../src/core/build-tree';import{writeFileSync}from'node:fs';import assert from'node:assert/strict';
const path='./baseline.mjs',Old=(await import(path)).World;
const stats=(w:World)=>({burn:w.burnHits,relay:w.relayHits,mirror:w.mirrorHits,shots:w.mirrorShots});
function input(w:World,base:OpticalBranch,extra?:OpticalBranch){
 if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
 const a=w.build.available(w.buildPoints),r=a.includes('optical')?'optical':a[0];if(!r)return;
 w.chooseBuild(r,r==='optical'?(w.canRefinePhoton()?'photon-reach':extra&&w.canFuseOptics?.()?('optic-'+extra)as OpticalFusion:w.build.ranks.optical===1?base:undefined):r==='ballistic'?w.build.ranks.ballistic===1?'ricochet':undefined:w.build.ranks.electric===1?'seeker':undefined);
}
const serialize=(value:unknown)=>JSON.stringify(value,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
if(process.env.OPTIC_MODE==='legacy'){
 const rows=[];for(const base of['burn','relay','mirror']as const){const before=new Old(1337,1,'scatter'),after=new World(1337,1,'scatter');let aim=360;
  for(let f=0;f<18000;f++){input(before,base);input(after,base);if(f%6===0)aim=progressionTarget(before);before.step(C.step,aim);after.step(C.step,aim);assert.equal(serialize(after.drainEffects()),serialize(before.drainEffects()),`${base} effects frame${f}`);assert.equal(serialize(after),serialize(before),`${base} world frame${f}`);}
  rows.push({base,frames:18000,hp:after.player.hp,equal:true});console.log(JSON.stringify(rows.at(-1)));
 }writeFileSync('build/qa/Stage-229/legacy.json',JSON.stringify(rows,null,2));
}else{
 const seconds=Number(process.env.OPTIC_SECONDS??600),pairs=seconds>600?[['burn','relay'],['relay','mirror'],['mirror','burn']]as const:[['burn','relay'],['burn','mirror'],['relay','burn'],['relay','mirror'],['mirror','burn'],['mirror','relay']]as const;
 const results=[];for(const [base,extra]of pairs){const w=new World(1337,1,'scatter');let aim=360,fusion:any=null,firstUseful:any=null;
  for(let f=0;f<seconds*60&&w.player.hp>0;f++){
   const old=w.build.opticalFusion,profile=w.supportProfile(),hits=stats(w),spent=w.build.spent;input(w,base,extra);
   if(!old&&w.build.opticalFusion)fusion={time:w.time,round:w.round,spentBefore:spent,spentAfter:w.build.spent,refinements:w.build.refinements.optical,before:profile,after:w.supportProfile(),stats:hits,base:w.build.opticalBranch,extra:w.build.opticalFusion,weapons:[...w.activeWeapons]};
   if(f%6===0)aim=progressionTarget(w);w.step(C.step,aim);w.drainEffects();
   if(fusion&&!firstUseful&&((extra==='burn'&&w.burnHits>fusion.stats.burn)||(extra==='relay'&&w.relayHits>fusion.stats.relay)||(extra==='mirror'&&w.mirrorHits>fusion.stats.mirror)))firstUseful={time:w.time,round:w.round,stats:stats(w)};
  }
  const result={base,extra,seconds,time:w.time,hp:w.player.hp,round:w.round,gates:w.gatesTaken,pickups:w.pickups,bossWins:w.bossWins,weapons:[...w.activeWeapons],peakBodies:w.peakBodies,peakBullets:w.peakBullets,fusion,firstUseful,final:stats(w)};results.push(result);console.log(JSON.stringify(result));
 }writeFileSync(`build/qa/Stage-229/normal-${seconds}.json`,JSON.stringify({seed:1337,results,limits:'Normally earned progression with legal choices, same omniscient zero-reaction safe operator; virtual60Hz not FPS or human difficulty. Legacy serializes World/effects, excluding no public counters but JS private ledger is separately tested.'},null,2));
}
