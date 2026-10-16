import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('records naturally earned boss phases and actual battle emissions through ten minutes',()=>{
 const records=[];
 for(const route of ['ballistic','electric','optical']){
  const w=new World(1337);let target=360,battle=null;const battles=[],seen=new Set();
  for(let f=0;f<600*60&&w.phase!=='dead';f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const available=w.build.available(w.buildPoints),chosen=available.includes(route)?route:available[0];if(chosen)w.chooseBuild(chosen);
   if(f%6===0)target=progressionTarget(w);w.step(C.step,target);w.drainEffects();
   const boss=w.bodies.find(b=>b.active&&b.kind==='boss');
   if(w.phase==='boss'&&boss){
    if(!battle)battle={round:w.round,start:w.time,half:null,low:null,attacks:[],finished:[],counterAt:null,counterVolleys:0,counterVisibleFrames:0,counterIds:[],arrivedIds:[],damageStart:w.damageTaken,shots:0,cycle:boss.attackCycle};
    if(boss.hp<=boss.maxHp*.5&&battle.half===null)battle.half=w.time-battle.start;
    if(boss.hp<=boss.maxHp*.2&&battle.low===null)battle.low=w.time-battle.start;
    const freshCounter=(boss.counterVolleys??0)>battle.counterVolleys;
    if(freshCounter)for(const b of w.bullets)if(b.hostile&&!seen.has(b.id))battle.counterIds.push(b.id);
    for(const b of w.bullets)if(b.hostile&&battle.counterIds.includes(b.id)&&!battle.arrivedIds.includes(b.id)&&b.py-31<=C.playerY&&b.y+31>=C.playerY)battle.arrivedIds.push(b.id);
    battle.counterVolleys=boss.counterVolleys??0;if(boss.counterVolleys)battle.counterVisibleFrames++;
    if(boss.counterfire&&battle.counterAt===null)battle.counterAt=w.time-battle.start;
    if(boss.warning>0&&!battle.attacks.includes(boss.attack))battle.attacks.push(boss.attack);
    if(boss.attackCycle!==battle.cycle){battle.finished.push(boss.attack);battle.cycle=boss.attackCycle;}
    for(const b of w.bullets)if(b.hostile&&!seen.has(b.id)){seen.add(b.id);battle.shots++;}
   }
   if(battle&&w.phase==='recovery'){battles.push({...battle,duration:w.time-battle.start,damage:w.damageTaken-battle.damageStart});battle=null;}
  }
  records.push({route,time:w.time,round:w.round,hp:w.player.hp,kills:w.kills,bossWins:w.bossWins,damageTaken:w.damageTaken,peakBodies:w.peakBodies,peakBullets:w.peakBullets,battles});
  expect(w.time).toBeCloseTo(600);expect(w.player.hp).toBeGreaterThan(0);expect(battles.length).toBeGreaterThanOrEqual(5);expect(battles[0].arrivedIds.length,route).toBeGreaterThan(0);
  for(const b of battles.slice(0,3)){expect(b.counterVolleys,`${route}, round ${b.round}`).toBeGreaterThanOrEqual(1);expect(b.counterVisibleFrames).toBeGreaterThanOrEqual(12);}
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-boss-escalation`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/bosses.json`,JSON.stringify(records,null,2));
},120000);
