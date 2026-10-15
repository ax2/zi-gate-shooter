import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('reaches and beats all three chapters at the new real docking geometry through normal ten-minute growth',()=>{
 const w=new World(1337);let target=360;const entries=[],victories=[];let lastPhase=w.phase;
 for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
  if(w.contractReward)w.claimContractReward('energy');
  const a=w.build.available(w.buildPoints),r=a.find(r=>w.build.ranks[r]<3)??a[0];if(r)w.chooseBuild(r);
  if(frame%6===0)target=progressionTarget(w);w.step(C.step,target);const events=w.drainEffects();
  if(w.phase==='boss'&&lastPhase!=='boss'){const b=w.bodies.find(b=>b.active&&b.kind==='boss');entries.push({time:w.time,round:w.round,y:b.y,variant:b.bossVariant,hp:b.maxHp});}
  if(events.some(e=>e.type==='boss-kill'))victories.push({time:w.time,round:w.round,hp:w.player.hp,escorts:w.escortKills});lastPhase=w.phase;
 }
 const result={time:w.time,hp:w.player.hp,round:w.round,entries,victories,escortSpawns:w.escortSpawns,escortKills:w.escortKills,kills:w.kills,peakBodies:w.peakBodies,peakBullets:w.peakBullets};
 const directory=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-boss-placement`;mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/normal.json`,JSON.stringify(result,null,2));
 expect(w.time).toBeCloseTo(600);expect(new Set(entries.map(e=>e.variant)).size).toBe(3);expect(entries.every(e=>e.y===C.bossY)).toBe(true);expect(victories.length).toBeGreaterThanOrEqual(3);expect(w.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);
},60000);
