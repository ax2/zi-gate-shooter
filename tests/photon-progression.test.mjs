import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('earns both photon refinements from normal arc openings and records real group and solo releases',()=>{
 const runs=[];for(const option of ['photon-reach','photon-focus']){const w=new World(1337,1,'arc');let aim=360,selected=null,third=0,focus=0,maxChain=0;
 for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
  if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
  const available=w.build.available(w.buildPoints),route=w.build.ranks.optical<3||w.build.refinements.optical<2?'optical':available.find(r=>w.build.ranks[r]<3)??'optical';
  if(available.includes(route)){const branch=route==='optical'&&w.canRefinePhoton()?option:w.build.ranks[route]===1?route==='optical'?'relay':route==='electric'?'seeker':'ricochet':undefined;if(w.chooseBuild(route,branch)&&w.build.photonAugment&&!selected)selected={time:w.time,hp:w.player.hp,points:w.buildPoints,spent:w.build.spent,weapons:w.activeWeapons};}
  if(frame%6===0)aim=progressionTarget(w);w.step(C.step,aim);const effects=w.drainEffects(),chains=effects.filter(e=>e.type==='laser-arc').length;if(w.build.photonAugment){third+=Number(chains>=3);focus+=effects.filter(e=>e.type==='laser-focus').length;maxChain=Math.max(maxChain,chains);}
 }
 runs.push({option,selected,time:w.time,hp:w.player.hp,round:w.round,third,focus,maxChain,arc:w.laserArcHits,ranks:w.build.ranks,refinements:w.build.refinements,peakBodies:w.peakBodies,peakBullets:w.peakBullets});}
 mkdirSync('build/qa/Stage-180',{recursive:true});writeFileSync('build/qa/Stage-180/normal.json',JSON.stringify(runs,null,2));for(const r of runs){expect(r.selected).not.toBeNull();expect(r.time).toBeCloseTo(600);expect(r.focus).toBeGreaterThan(0);expect(r.arc).toBeGreaterThan(0);}expect(runs[0].third).toBeGreaterThan(0);
},60000);
