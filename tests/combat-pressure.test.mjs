import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {progressionTarget} from './helpers/progression-driver';
import {mkdirSync,writeFileSync} from 'node:fs';
const directory=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-combat-pressure-${process.env.PRESSURE_LABEL??'current'}`;
it('measures normal growth with real route choices and actual boss attack opportunities',()=>{
 const records=[];
 for(const preference of ['optical','electric','ballistic']){
  const w=new World(1337);let target=360,activeBoss;
  const bosses=[],hostile=new Set();let hurt=0;
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(frame%6===0)target=progressionTarget(w);
   const available=w.build.available(w.growth.mastery??0);
   const route=available.find(r=>r===preference&&w.build.ranks[r]<3)??available.find(r=>w.build.ranks[r]<3)??available.find(r=>r===preference)??available[0];
   if(route)w.chooseBuild(route);
   const before=w.phase;w.step(C.step,target);
   if(before!=='boss'&&w.phase==='boss'){
    const boss=w.bodies.find(b=>b.kind==='boss'&&b.active);
    activeBoss={round:w.round,start:w.time,hp:boss?.maxHp,projectiles:0,cycles:0};
   }
   for(const b of w.bullets)if(b.hostile&&!hostile.has(b.id)){hostile.add(b.id);if(w.phase==='boss'&&activeBoss)activeBoss.projectiles++;}
   const boss=w.bodies.find(b=>b.kind==='boss'&&b.active);if(boss&&activeBoss)activeBoss.cycles=boss.attackCycle-[0,2,3][boss.bossVariant??0];
   for(const e of w.drainEffects()){
    if(e.type==='hurt')hurt++;
    if(e.type==='boss-kill'&&activeBoss){bosses.push({...activeBoss,duration:+(w.time-activeBoss.start).toFixed(3)});activeBoss=undefined;}
   }
  }
  records.push({preference,time:w.time,hp:w.player.hp,round:w.round,hurt,hostile:hostile.size,mastery:w.growth.mastery,ranks:w.build.ranks,refinements:w.build.refinements,bosses,activeBoss});
  expect(Number.isFinite(w.score)).toBe(true);expect(w.peakBodies).toBeLessThanOrEqual(32);
 }
 mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/pressure.json`,JSON.stringify(records,null,2));
 for(const record of records){
  expect(record.bosses.length).toBeGreaterThanOrEqual(3);
  expect(record.bosses.slice(0,3).every(b=>b.projectiles>0)).toBe(true);
  expect(record.bosses.slice(0,3).every(b=>b.duration<20)).toBe(true);
 }
 console.log(`Pressure evidence: ${directory}`);
},60000);
