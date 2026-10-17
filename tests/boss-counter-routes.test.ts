import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';import {mkdirSync,writeFileSync} from 'node:fs';
it.each([1,2,3,4,5,6,11,12].flatMap(round=>[68,360,652].map(start=>({round,start}))))('counter phase and live escorts retain no-kill escape (round $round, x$start)',({round,start})=>{
 const w=new World(1337,round);w.phase='boss';w.player.x=w.player.px=start;const b=w.spawn('boss',360,C.bossY);b.bossVariant=(round-1)%3;b.attackCycle=[0,2,3][b.bossVariant];b.hp=b.maxHp*.49;
 let path:number[]=[],planAt=0,seen=0;
 for(let f=0;f<1200;f++){
  if(f===0||f-planAt>=60||seen!==w.escortSpawns){
   const route=safeRoute(w.player.x,w.bodies,w.bullets,6,{phase:w.phase,phaseTime:w.phaseTime,reaction:f===0||seen!==w.escortSpawns?.45:0});
   expect(route,`t=${w.time}, escorts=${w.escortSpawns}`).not.toBeNull();path=route??[];planAt=f;seen=w.escortSpawns;
  }
  w.step(C.step,path[Math.floor((f-planAt)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);
  expect(w.player.hp,`t=${w.time}`).toBe(3);expect(w.kills).toBe(0);
 }
 expect(b.counterVolleys).toBeGreaterThan(1);expect(w.damageTaken).toBe(0);
 mkdirSync('build/qa/Stage-230/routes',{recursive:true});writeFileSync(`build/qa/Stage-230/routes/${round}-${start}.json`,JSON.stringify({round,start,time:w.time,counterVolleys:b.counterVolleys,escorts:w.escortSpawns,hp:w.player.hp,peakBodies:w.peakBodies,peakBullets:w.peakBullets},null,2));
},120000);
it.each([4,5,6].flatMap(round=>[2,4].map(at=>({round,at}))))('half-health transition preserves an escape with existing fire (round $round, t$at)',({round,at})=>{
 const w=new World(1337,round);w.phase='boss';const b=w.spawn('boss',360,C.bossY);b.bossVariant=(round-1)%3;b.attackCycle=[0,2,3][b.bossVariant];
 let path:number[]=[],planAt=0,seen=0,transitioned=false,preserved=0;
 for(let f=0;f<1200;f++){
  const transition=!transitioned&&f>=at*60;
  if(transition){b.hp=b.maxHp*.49;transitioned=true;preserved=w.bullets.filter(b=>b.hostile).length;}
  if(transition||f===0||f-planAt>=60||seen!==w.escortSpawns){
   const route=safeRoute(w.player.x,w.bodies,w.bullets,6,{phase:w.phase,phaseTime:w.phaseTime,reaction:transition||f===0||seen!==w.escortSpawns?.45:0});
   expect(route,`t=${w.time}`).not.toBeNull();path=route??[];planAt=f;seen=w.escortSpawns;
  }
  w.step(C.step,path[Math.floor((f-planAt)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp,`t=${w.time}`).toBe(3);
 }
 expect(preserved).toBeGreaterThan(0);expect(b.counterVolleys).toBeGreaterThan(0);expect(w.kills).toBe(0);
 mkdirSync('build/qa/Stage-230/transitions',{recursive:true});writeFileSync(`build/qa/Stage-230/transitions/${round}-${at}.json`,JSON.stringify({round,at,preserved,hp:w.player.hp,counterVolleys:b.counterVolleys},null,2));
},120000);
