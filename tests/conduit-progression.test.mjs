import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('encounters and discharges authored conduits through three normal build policies without granting state',()=>{
 const results=[];
 for(const primary of ['ballistic','electric','optical']){const w=new World(1337);let x=360,last=0;const bursts=[];
  for(let frame=0;frame<300*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const available=w.build.available(w.buildPoints),r=available.includes(primary)&&w.build.ranks[primary]<3?primary:available.find(r=>w.build.ranks[r]<3)??available[0];if(r)w.chooseBuild(r);
   if(frame%6===0)x=progressionTarget(w);w.step(C.step,x);for(const e of w.drainEffects())if(e.type==='emp'){bursts.push({time:w.time,round:w.round,targets:w.empTargets-last,text:e.text});last=w.empTargets;}
  }
  results.push({primary,time:w.time,hp:w.player.hp,round:w.round,bursts,conduitBursts:w.conduitBursts,empTargets:w.empTargets,timingWins:w.conduitTacticalWins,kills:w.kills,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
  expect(w.time).toBeCloseTo(300);expect(w.conduitBursts).toBeGreaterThan(0);expect(w.empTargets).toBeGreaterThan(0);expect(w.conduitBursts).toBe(bursts.length);expect(w.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(w.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-conduit`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/normal.json`,JSON.stringify(results,null,2));
},60000);
it('finds a legal aimed interruption of both charging sentries after normal first-chapter equipment and boss loot',()=>{
 const attempts=[];let success;
 for(const delay of [2.1,2.25,2.4,2.55,2.7]){const w=new World(1337);let target=224,receipt='';
  for(let frame=0;frame<160*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('pulse');
   const a=w.build.available(w.buildPoints),route=a.includes('ballistic')&&w.build.ranks.ballistic<2?'ballistic':a.find(r=>w.build.ranks[r]<3)??a[0];if(route)w.chooseBuild(route,route==='ballistic'&&w.build.ranks.ballistic===1?'fragment':undefined);
   target=w.round===1?(w.phase==='boss-entry'||w.phase==='boss'?360:224):w.roundTime<44.5+delay?68:360;
   w.step(C.step,target);for(const e of w.drainEffects())if(e.type==='emp')receipt=e.detail??'';
   if(w.round>=2&&w.conduitBursts>0)break;
  }
  const row={delay,time:w.time,roundTime:w.roundTime,hp:w.player.hp,round:w.round,weapons:w.activeWeapons,mastery:w.growth.mastery??0,ranks:{...w.build.ranks},bossLoot:{...w.bossLootStats},bursts:w.conduitBursts,affected:w.empTargets,timingWins:w.conduitTacticalWins,receipt};attempts.push(row);if(w.conduitTacticalWins>0){success=row;break;}
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-conduit-timing`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/timing.json`,JSON.stringify({attempts,success:success??null},null,2));expect(success).toBeDefined();expect(success.hp).toBeGreaterThan(0);
},60000);
