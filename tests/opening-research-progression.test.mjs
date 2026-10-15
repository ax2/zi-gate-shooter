import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('records real opening choices and branch outcomes without equipment or energy injection',()=>{
 const results=[];
 for(const [route,branch] of [['ballistic','penetrator'],['ballistic','fragment'],['electric','spread'],['electric','capacitor'],['optical','burn'],['optical','relay']]){
  const w=new World(1337);let x=360;const choices=[],pickups=[];let beforePickups=0;
  for(let frame=0;frame<180*60&&w.phase!=='dead';frame++){
   const available=w.build.available(w.buildPoints),selected=available.includes(route)&&w.build.ranks[route]<3?route:available.includes('electric')&&w.build.ranks.electric===0?'electric':available.find(r=>w.build.ranks[r]<3)??available[0];
   if(selected){const point=w.build.spent;w.chooseBuild(selected,selected===route&&w.build.ranks[route]===1?branch:undefined);choices.push({time:w.time,route:selected,branch:w.build[`${route}Branch`],spent:w.build.spent,mastery:w.growth.mastery??0,research:w.researchPoints??0,changed:w.build.spent>point});}
   if(frame%6===0)x=progressionTarget(w);w.step(C.step,x);w.drainEffects();if(w.pickups>beforePickups){pickups.push({time:w.time,count:w.pickups,mastery:w.growth.mastery??0,research:w.researchPoints??0});beforePickups=w.pickups;}
  }
  results.push({route,branch,time:w.time,hp:w.player.hp,choices,pickups,mastery:w.growth.mastery??0,research:w.researchPoints??0,pierces:w.scatterPierces,splashHits:w.scatterSplashHits,capacitorBursts:w.capacitorBursts,burnHits:w.burnHits,relayHits:w.relayHits,kills:w.kills,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 mkdirSync('build/qa/Stage-138',{recursive:true});writeFileSync('build/qa/Stage-138/opening.json',JSON.stringify(results,null,2));
 for(const r of results){expect(r.time).toBeCloseTo(180);expect(r.choices.every(c=>c.changed)).toBe(true);expect(r.research).toBe(2);expect(r.choices[0].time).toBeLessThan(30);expect(r.choices[1].time).toBeLessThan(60);expect(r.choices[1].branch).toBe(r.branch);expect(r.choices[1].mastery).toBe(0);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},60000);
