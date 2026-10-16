import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
const baseline=process.env.BOSS_ROSTER_BASELINE==='1';
it('observes authored boss and formation combinations through three normally earned long builds',()=>{
 const runs=[];
 for(const preferred of ['ballistic','electric','optical']){
  const w=new World(1337);let aim=360,previous=w.phase,battle=null;const battles=[];
  for(let frame=0;frame<1260*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),route=a.includes(preferred)&&w.build.ranks[preferred]<3?preferred:a.find(r=>w.build.ranks[r]<3)??a[0];
   if(route)w.chooseBuild(route,w.build.ranks[route]===1?route==='ballistic'?'ricochet':route==='electric'?'seeker':'relay':undefined);
   if(frame%6===0)aim=progressionTarget(w);const priorShots=new Set(w.bullets.filter(b=>b.hostile).map(b=>b.id));w.step(C.step,aim);w.drainEffects();
   if(w.phase==='boss'&&previous!=='boss'){const boss=w.bodies.find(b=>b.active&&b.kind==='boss');battle={round:w.round,variant:boss.bossVariant,formation:w.bossFormation?.id??null,start:w.time,spawns:w.escortSpawns,kills:w.escortKills,damage:w.damageTaken,shieldFrames:0,peakEscorts:0,escorts:[],emitted:0,arrived:[],counterVolleys:0,initialHP:boss.maxHp};}
   if(battle){battle.emitted+=w.bullets.filter(b=>b.hostile&&!priorShots.has(b.id)).length;for(const shot of w.bullets)if(shot.hostile&&shot.y>=C.playerY-40&&!battle.arrived.includes(shot.id))battle.arrived.push(shot.id);battle.counterVolleys=Math.max(battle.counterVolleys,w.bodies.find(b=>b.active&&b.kind==='boss')?.counterVolleys??0);battle.shieldFrames+=Number(w.bossShieldActive());battle.peakEscorts=Math.max(battle.peakEscorts,w.activeEscorts.length);for(const b of w.activeEscorts){let e=battle.escorts.find(e=>e.id===b.id);if(!e){e={id:b.id,kind:b.kind,maxHp:b.maxHp,age:0,minX:b.x,maxX:b.x};battle.escorts.push(e);}e.age=Math.max(e.age,b.age);e.minX=Math.min(e.minX,b.x);e.maxX=Math.max(e.maxX,b.x);}}
   if(battle&&w.phase==='recovery'){battles.push({...battle,duration:w.time-battle.start,spawned:w.escortSpawns-battle.spawns,killed:w.escortKills-battle.kills,hurt:w.damageTaken-battle.damage});battle=null;}
   previous=w.phase;
  }
  runs.push({preferred,time:w.time,round:w.round,hp:w.player.hp,battles,weapons:w.activeWeapons,kills:w.kills,tacticalWins:w.tacticalWins,peakBodies:w.peakBodies,peakBullets:w.peakBullets,fallbacks:w.fallbackCount});
 }
 mkdirSync('build/qa/Stage-171',{recursive:true});writeFileSync(`build/qa/Stage-171/${baseline?'baseline':'normal'}.json`,JSON.stringify(runs,null,2));
 for(const r of runs){expect(r.time,r.preferred).toBeCloseTo(1260);expect(r.hp).toBeGreaterThan(0);const cases=r.battles.filter(b=>b.round>=7&&b.round<=15);expect(cases).toHaveLength(9);expect(new Set(cases.map(b=>`${b.variant}/${b.formation}`)).size).toBe(baseline?3:9);expect(cases.every(b=>(baseline?b.spawned>=1:b.spawned===2)&&b.peakEscorts<=2)).toBe(true);if(!baseline){expect(cases.every(b=>b.duration>=3&&b.duration<45)).toBe(true);expect(cases.every(b=>b.emitted>0&&b.arrived.length>0)).toBe(true);}expect(r.battles.filter(b=>b.round<=3).every(b=>b.spawned===0)).toBe(true);expect(r.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},120000);
