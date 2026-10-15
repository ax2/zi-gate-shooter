import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('records chapter engagement and real branch gains through legal normal progression',()=>{
 const result=[];
 for(const [route,branch] of [['ballistic','fragment'],['electric','spread'],['optical','relay']]){
  const w=new World(1337);let x=360;const rounds=new Map();
  for(let frame=0;frame<300*60&&w.phase!=='dead';frame++){
   const available=w.build.available(w.buildPoints),r=available.includes(route)&&w.build.ranks[route]<3?route:available.find(r=>w.build.ranks[r]<3)??available[0];
   if(r)w.chooseBuild(r,r===route&&w.build.ranks[route]===1?branch:undefined);
   if(frame%6===0)x=progressionTarget(w);w.step(C.step,x);w.drainEffects();
   if(w.phase!=='running')continue;
   const row=rounds.get(w.round)??{round:w.round,seconds:0,combat:0,targets:0,dry:0,longestDry:0,longestDryEnd:0,middleSeconds:0,middleCombat:0,middleTargets:0};rounds.set(w.round,row);
   const visible=w.bodies.filter(b=>b.active&&b.y>=300&&b.y<=C.playerY),combat=visible.some(b=>b.kind in C.enemies),target=combat||visible.some(b=>b.kind==='crate'||b.kind==='gate');
   row.seconds+=C.step;if(combat)row.combat+=C.step;if(target)row.targets+=C.step;
   row.dry=target?0:row.dry+C.step;if(row.dry>row.longestDry){row.longestDry=row.dry;row.longestDryEnd=w.roundTime;}
   if(w.roundTime>=40&&w.roundTime<60){row.middleSeconds+=C.step;if(combat)row.middleCombat+=C.step;if(target)row.middleTargets+=C.step;}
  }
  result.push({route,branch,time:w.time,hp:w.player.hp,round:w.round,kills:w.kills,arcLinks:w.arcLinks,splashHits:w.scatterSplashHits,relayHits:w.relayHits,peakBodies:w.peakBodies,peakBullets:w.peakBullets,rounds:[...rounds.values()].map(({dry,...r})=>r)});
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-engagement`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/engagement.json`,JSON.stringify(result,null,2));
 for(const r of result){expect(r.time).toBeCloseTo(300);expect(r.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},60000);
