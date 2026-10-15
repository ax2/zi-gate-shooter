import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('records visible first-run combat and true branch hits through normal equipment and boss loot',()=>{
 const results=[];
 for(const [route,branch] of [['ballistic','fragment'],['electric','spread'],['optical','relay']]){
  const w=new World(1337);let x=360,opening=0,upgraded=0,upgradeWindow=0,firstProc=null,firstChoice=null,firstBranch=null;const kills=[];
  for(let frame=0;frame<100*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const available=w.build.available(w.buildPoints),r=available.includes(route)&&w.build.ranks[route]<3?route:available.find(r=>w.build.ranks[r]<3)??available[0];
   if(r){if(firstChoice===null)firstChoice=w.time;const fork=r===route&&w.build.ranks[route]===1;if(w.chooseBuild(r,fork?branch:undefined)&&fork&&firstBranch===null)firstBranch=w.time;}
   if(frame%6===0)x=progressionTarget(w);w.step(C.step,x);for(const e of w.drainEffects())if(e.type==='kill'&&w.round===1)kills.push({kind:e.enemyKind,y:e.y,time:w.time});
   const proc=route==='ballistic'?w.scatterSplashHits:route==='electric'?w.arcLinks:w.relayHits;if(proc>0&&firstProc===null)firstProc=w.time;
   if(w.round===1&&w.phase==='running'){
    const visible=w.bodies.some(b=>b.active&&b.kind in C.enemies&&b.y>=300&&b.y<=C.playerY);
    if(w.roundTime<8&&visible)opening+=C.step;
    if(w.roundTime>=14){upgradeWindow+=C.step;if(visible)upgraded+=C.step;}
   }
  }
  results.push({route,branch,time:w.time,hp:w.player.hp,round:w.round,openingVisible:opening,upgradedVisible:upgraded,upgradeWindow,firstChoice,firstBranch,firstProc,kills: kills.length,nearEntryKills:kills.filter(k=>k.y<300).length,firstChapterKills:kills,arcLinks:w.arcLinks,splashHits:w.scatterSplashHits,relayHits:w.relayHits,bossWins:w.bossWins,bossLoot:{...w.bossLootStats},peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-first-impact`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/impact.json`,JSON.stringify(results,null,2));
 for(const r of results){expect(r.time).toBeCloseTo(100);expect(r.firstChoice).not.toBeNull();expect(r.firstBranch).not.toBeNull();expect(r.bossWins).toBeGreaterThan(0);expect(r.bossLoot.claimed).toBeGreaterThan(0);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},60000);
