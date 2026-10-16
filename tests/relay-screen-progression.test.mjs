import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C,clamp} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';import {dangerTimeline,safeRoute} from '../src/core/reachability';
it('normally meets the shielded side formation and compares targeting decisions with earned cumulative weapons',()=>{
 const runs=[];
 for(const [branch,policy] of [['spread','ordinary'],['capacitor','ordinary'],['seeker','ordinary'],['seeker','relay'],['seeker','wing'],['seeker','hold-wing']]){
  const w=new World(1337);let aim=360,start=null,end=null;const seen=new Map(),arrived=new Set(),emitted=new Set(),emps=[];
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');const a=w.build.available(w.buildPoints),r=a.includes('electric')&&w.build.ranks.electric<3?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];if(r)w.chooseBuild(r,w.build.ranks[r]===1?r==='electric'?branch:r==='ballistic'?'ricochet':'relay':r==='electric'&&w.canRefineMagnetic()?'field-link':undefined);
   const watched=w.bodies.filter(b=>b.pattern==='relay-screen');
   if(frame%6===0){aim=progressionTarget(w);const target=watched.find(b=>b.active&&b.kind===(policy==='relay'?'conduit':'sniper'));if(policy!=='ordinary'&&target){const next=clamp(w.player.x+clamp(target.x-w.player.x,-68,68),C.minX,C.maxX),opts={phase:w.phase,phaseTime:w.phaseTime,reaction:0};const blocked=dangerTimeline(w.bodies,w.bullets,1.5,opts).some(rows=>rows.some(([lo,hi])=>Math.max(w.player.x,next)>=lo&&Math.min(w.player.x,next)<=hi));aim=blocked?(safeRoute(w.player.x,w.bodies,w.bullets,4,opts)?.[0]??w.player.x):next;}}
   if(policy==='hold-wing'&&w.round===5&&w.roundTime>=44.5&&w.roundTime<54)aim=220;w.step(C.step,aim);
   for(const b of [...watched,...w.bodies.filter(b=>b.pattern==='relay-screen')]){let e=seen.get(b.id);if(!e){e={id:b.id,round:w.round,kind:b.kind,spawn:w.time,x:b.x,y:b.y,hp:b.maxHp,shots:0,killed:false,emp:false,age:0};seen.set(b.id,e);if(!start)start={time:w.time,hp:w.player.hp,score:w.score,kills:w.kills};}e.shots=Math.max(e.shots,b.formationShots??0);e.killed||=b.hp<=0;e.emp||=(b.empRemaining??0)>0;e.age=Math.max(e.age,b.age);}
   for(const b of w.bullets)if(b.sourceId&&seen.has(b.sourceId)){emitted.add(b.id);if(b.y>=C.playerY-40)arrived.add(b.id);}
   for(const e of w.drainEffects())if(e.type==='emp'&&watched.some(b=>b.kind==='conduit'))emps.push({time:w.time,round:w.round,text:e.text,detail:e.detail});
   if(start&&!end&&w.round===5&&w.roundTime>54)end={time:w.time,hp:w.player.hp,score:w.score,kills:w.kills};
  }
  runs.push({branch,policy,time:w.time,round:w.round,hp:w.player.hp,score:w.score,kills:w.kills,start,end,formation:[...seen.values()],emitted:emitted.size,arrived:arrived.size,emps,weapons:w.activeWeapons.map(k=>({kind:k,tier:w.weaponStage(k),calibration:w.weaponCalibration(k)})),peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 mkdirSync('build/qa/Stage-176',{recursive:true});writeFileSync('build/qa/Stage-176/normal.json',JSON.stringify(runs,null,2));for(const r of runs){if(r.policy!=='hold-wing'){expect(r.time).toBeCloseTo(600,5);expect(r.hp).toBeGreaterThan(0);}expect(r.arrived).toBeGreaterThan(0);expect(r.formation.length).toBeGreaterThanOrEqual(5);expect(r.weapons).toHaveLength(5);expect(r.peakBodies).toBeLessThanOrEqual(32);expect(r.peakBullets).toBeLessThanOrEqual(128);}
},60000);
