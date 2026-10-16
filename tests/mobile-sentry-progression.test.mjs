import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('encounters mobile sentries in three legal 300-second build runs without adding state',()=>{
 const results=[];
 for(const primary of ['ballistic','electric','optical']){const w=new World(1337);let x=360;const seen=new Set(),moved=new Set();let volleys=0;
  for(let f=0;f<300*60&&w.phase!=='dead';f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),r=a.includes(primary)&&w.build.ranks[primary]<3?primary:a.find(r=>w.build.ranks[r]<3)??a[0];if(r)w.chooseBuild(r);
   if(f%6===0)x=progressionTarget(w);w.step(C.step,x);w.drainEffects();
   for(const b of w.bodies)if(b.active&&b.pattern==='relocate'){seen.add(`${w.round}:${b.id}`);if(Math.abs(b.x-b.lane)>5)moved.add(`${w.round}:${b.id}`);volleys=Math.max(volleys,b.sentryVolleys??0);}
  }
  results.push({primary,time:w.time,round:w.round,hp:w.player.hp,seen:seen.size,moved:moved.size,maxVolleys:volleys,kills:w.kills,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
  expect(w.time).toBeCloseTo(300);expect(seen.size).toBeGreaterThan(0);expect(moved.size).toBeGreaterThan(0);expect(w.player.hp).toBeGreaterThan(0);
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-mobile-sentry`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/normal.json`,JSON.stringify(results,null,2));
},60000);
it('observes real post-volley relocation after a normal first chapter and boss equipment reward',()=>{
 const w=new World(1337);const frames=[];let seen=false,moved=false,chargedAgain=false;
 for(let f=0;f<145*60&&w.phase!=='dead';f++){
  if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('pulse');
  // Pick the fork only at its actual node; other nodes omit a branch.
  if(w.build.available(w.buildPoints).includes('optical'))w.chooseBuild('optical',w.build.ranks.optical===1?'burn':undefined);
  const x=w.round===1?(w.phase==='boss'||w.phase==='boss-entry'?360:224):652;
  w.step(C.step,x);w.drainEffects();
  const b=w.bodies.find(b=>b.active&&b.pattern==='relocate');
  if(b){seen=true;if(f%12===0)frames.push({time:w.time,roundTime:w.roundTime,x:b.x,lane:b.lane,warning:b.warning,age:b.age,volleys:b.sentryVolleys??0});
   if(Math.abs(b.x-b.lane)>50)moved=true;if(moved&&(b.sentryVolleys??0)>0&&b.warning>0)chargedAgain=true;}
  if(chargedAgain)break;
 }
 const result={time:w.time,round:w.round,hp:w.player.hp,weapons:w.activeWeapons,ranks:w.build.ranks,bossLoot:w.bossLootStats,seen,moved,chargedAgain,frames};
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-mobile-sentry-observe`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/observe.json`,JSON.stringify(result,null,2));
 expect(seen).toBe(true);expect(moved).toBe(true);expect(chargedAgain).toBe(true);expect(w.player.hp).toBeGreaterThan(0);
},60000);
