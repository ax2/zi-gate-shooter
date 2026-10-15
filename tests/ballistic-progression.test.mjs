import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {progressionTarget} from './helpers/progression-driver';
it('contrasts alignment versus compact groups and reaches both forks through normal progression',()=>{
 const comparisons=[],runs=[];
 for(const branch of ['penetrator','fragment']){
  for(const encounter of ['column','cluster']){
   const w=new World();w.growth.mastery=2;w.chooseBuild('ballistic');w.chooseBuild('ballistic',branch);w.player.x=w.player.px=68;
   const targets=(encounter==='column'?[[360,600],[360,450]]:[[360,600],[420,600],[300,600]]).map(([x,y])=>{const b=w.spawn('armor',x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;});
   const p=w.profileFor('scatter');w.bullets=[{id:999999,x:360,y:730,px:360,py:730,vx:0,vy:-1200,damage:10,age:0,active:true,hostile:false,weaponKind:'scatter',remainingTargets:p.targets,hitBodies:[],splashRadius:p.splashRadius}];
   for(let i=0;i<25;i++){w.step(C.step,68);w.drainEffects();}
   comparisons.push({branch,encounter,damage:targets.map(b=>1000-b.hp),pierces:w.scatterPierces,splashHits:w.scatterSplashHits});
  }
  const w=new World(1337);let x=360,chosenAt;
  for(let frame=0;frame<300*60&&w.phase!=='dead';frame++){
   const available=w.build.available(w.growth.mastery??0);const route=available.includes('ballistic')&&w.build.ranks.ballistic<3?'ballistic':available.includes('electric')&&w.build.ranks.electric===0?'electric':available.find(r=>w.build.ranks[r]<3)??available[0];
   if(route){w.chooseBuild(route,route==='ballistic'&&w.build.ranks.ballistic===1?branch:undefined);if(w.build.ballisticBranch&&!chosenAt)chosenAt=w.time;}
   if(frame%6===0)x=progressionTarget(w);w.step(C.step,x);w.drainEffects();
  }
  runs.push({branch,selected:w.build.ballisticBranch,chosenAt,time:w.time,hp:w.player.hp,round:w.round,kills:w.kills,mastery:w.growth.mastery,pierces:w.scatterPierces,bursts:w.scatterBursts,splashHits:w.scatterSplashHits,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 const directory=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-ballistic-branches`;mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/branches.json`,JSON.stringify({comparisons,runs},null,2));
 const row=(branch,e)=>comparisons.find(r=>r.branch===branch&&r.encounter===e);
 expect(row('penetrator','column').damage).toEqual([10,10]);expect(row('fragment','column').damage).toEqual([10,0]);expect(row('fragment','cluster').damage).toEqual([10,5,5]);expect(row('penetrator','cluster').damage).toEqual([10,0,0]);
 for(const r of runs){expect(r.time).toBeCloseTo(300);expect(r.selected).toBe(r.branch);expect(r.chosenAt).toBeLessThan(150);expect(r[r.branch==='penetrator'?'pierces':'splashHits']).toBeGreaterThan(0);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},60000);
