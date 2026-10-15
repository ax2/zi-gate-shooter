import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('measures normal midgame engagement and actual six-branch effects without granting equipment or immunity',()=>{
 const results=[];
 for(const [route,branch] of [['ballistic','penetrator'],['ballistic','fragment'],['electric','spread'],['electric','capacitor'],['optical','burn'],['optical','relay']]){
  const w=new World(1337);let x=360,visibleFrames=0,runningFrames=0;const kills=[];
  for(let frame=0;frame<300*60&&w.phase!=='dead';frame++){
   const a=w.build.available(w.buildPoints),r=a.includes(route)&&w.build.ranks[route]<3?route:a.includes('electric')&&w.build.ranks.electric===0?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];
   if(r)w.chooseBuild(r,r===route&&w.build.ranks[route]===1?branch:undefined);if(frame%6===0)x=progressionTarget(w);
   w.step(C.step,x);for(const e of w.drainEffects())if(e.type==='kill')kills.push({y:e.y,kind:e.enemyKind,round:w.round});
   if(w.phase==='running'&&w.round>=2){runningFrames++;if(w.bodies.some(b=>b.active&&b.kind in C.enemies&&b.y>=300&&b.y<=C.playerY))visibleFrames++;}
  }
  results.push({route,branch,time:w.time,hp:w.player.hp,round:w.round,dropSpawns:w.dropSpawns,dropKills:w.dropKills,arcLinks:w.arcLinks,kills:w.kills,midgameKills:kills.filter(k=>k.round>=2).length,midgameTopKills:kills.filter(k=>k.round>=2&&k.y<300).length,visiblePercent:runningFrames?100*visibleFrames/runningFrames:0,pierces:w.scatterPierces,splashHits:w.scatterSplashHits,capacitorBursts:w.capacitorBursts,burnHits:w.burnHits,relayHits:w.relayHits,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-swarm-progression`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/swarm.json`,JSON.stringify(results,null,2));
 for(const r of results){expect(r.time).toBeCloseTo(300);expect(r.dropSpawns).toBeGreaterThan(0);expect(r.dropKills).toBeGreaterThan(0);expect(r.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},60000);
