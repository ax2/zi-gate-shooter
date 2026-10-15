import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';
import {C,clamp} from '../src/core/config';
import {dangerTimeline,safeRoute} from '../src/core/reachability';
import {progressionTarget} from './helpers/progression-driver';
class Baseline extends World{get bossFormation(){return undefined;}}
function aim(w,priority){
 if(priority!=='escorts'||!w.activeEscorts.length)return progressionTarget(w);
 const goal=[...w.activeEscorts].sort((a,b)=>b.y-a.y)[0].x,x=w.player.x,next=x+clamp(goal-x,-C.moveSpeed*.1,C.moveSpeed*.1),options={phase:w.phase,phaseTime:w.phaseTime,reaction:0};
 const blocked=dangerTimeline(w.bodies,w.bullets,1.5,options).some(row=>row.some(([lo,hi])=>Math.max(x,next)>=lo&&Math.min(x,next)<=hi));
 return blocked?(safeRoute(x,w.bodies,w.bullets,4,options)?.[0]??x):next;
}
it('measures tactical target priority against a fixed-health counterfactual and stationary control',()=>{
 const results=[];
 for(const policy of ['baseline','baseline-stationary','boss','escorts','stationary']){
  const w=policy.startsWith('baseline')?new Baseline(1337,4):new World(1337,4);w.phase='boss';
  const boss=w.spawn('boss',360,C.bossY);boss.bossVariant=0;const initialHP=boss.hp;
  // Explicit moderate build fixture: identical real pickups/choices, not normal growth evidence.
  for(const kind of ['pulse','blast']){const p=w.spawn('pickup',360,C.playerY,3);p.weaponKind=kind;w.step(C.step,360);w.drainEffects();}
  w.growth.mastery=4;w.chooseBuild('electric');w.chooseBuild('ballistic');w.chooseBuild('ballistic');w.chooseBuild('optical');
  let target=360,shield=0,escortShots=0;
  for(let frame=0;frame<75*60&&w.phase==='boss';frame++){
   if(frame%6===0)target=policy.includes('stationary')?360:aim(w,policy);
   const before=new Set(w.bullets.filter(b=>b.hostile).map(b=>b.id));w.step(C.step,target);w.drainEffects();
   shield+=Number(w.bossShieldActive());escortShots+=w.bullets.filter(b=>b.hostile&&!before.has(b.id)).length;
  }
  results.push({policy,initialHP,time:w.time,phase:w.phase,hp:w.player.hp,hurt:w.damageTaken,escortKills:w.escortKills,shieldSeconds:shield*C.step,hostileEmissions:escortShots,charge:w.growth.energy,tacticalWins:w.tacticalWins});
 }
 const directory=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-formation-priority`;
 mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/priority.json`,JSON.stringify(results,null,2));
 expect(new Set(results.map(r=>r.initialHP)).size).toBe(1);
 const prioritized=results.find(r=>r.policy==='escorts');expect(prioritized.phase).toBe('recovery');expect(prioritized.escortKills).toBe(2);
 expect(results.find(r=>r.policy==='stationary').hurt).toBeGreaterThan(prioritized.hurt);
 expect(results.find(r=>r.policy==='stationary').time).toBeLessThan(results.find(r=>r.policy==='baseline-stationary').time);
},60000);
