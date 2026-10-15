import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {progressionTarget} from './helpers/progression-driver';
it('encounters all three boss formations through normal ten-minute progression with bounded entities',()=>{
 const w=new World(1337),battles=[];let target=360,battle=null,previous=w.phase;
 for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
  const available=w.build.available(w.growth.mastery??0);const route=available.find(r=>w.build.ranks[r]<3)??available[0];if(route)w.chooseBuild(route);
  if(frame%6===0)target=progressionTarget(w);
  w.step(C.step,target);w.drainEffects();
  if(w.phase==='boss'&&previous!=='boss')battle={round:w.round,formation:w.bossFormation?.id??null,start:w.time,spawns:w.escortSpawns,kills:w.escortKills,damage:w.damageTaken,shieldFrames:0,peakEscorts:0};
  if(battle){battle.shieldFrames+=Number(w.bossShieldActive());battle.peakEscorts=Math.max(battle.peakEscorts,w.activeEscorts.length);}
  if(battle&&w.phase==='recovery'){
   battles.push({...battle,duration:w.time-battle.start,spawned:w.escortSpawns-battle.spawns,killed:w.escortKills-battle.kills,hurt:w.damageTaken-battle.damage});battle=null;
  }
  previous=w.phase;
 }
 const result={time:w.time,hp:w.player.hp,round:w.round,battles,escortSpawns:w.escortSpawns,escortKills:w.escortKills,tacticalWins:w.tacticalWins,peakBodies:w.peakBodies,peakBullets:w.peakBullets,fallbacks:w.fallbackCount};
 const directory=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-boss-formations`;
 mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/formations.json`,JSON.stringify(result,null,2));
 expect(w.time).toBeCloseTo(600);
 for(const formation of ['bulwark','pincer','crossfire'])expect(battles.some(b=>b.formation===formation&&b.spawned>0)).toBe(true);
 expect(battles.filter(b=>b.round<=3).every(b=>b.spawned===0)).toBe(true);
 expect(battles.every(b=>b.spawned<=2&&b.peakEscorts<=2)).toBe(true);
 expect(w.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(w.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);
},60000);
