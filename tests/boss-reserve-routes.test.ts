import{it,expect}from'vitest';import{World}from'../src/core/world';import{C}from'../src/core/config';import{safeRoute}from'../src/core/reachability';
import{mkdirSync,writeFileSync}from'node:fs';
it.each([4,5,6,7,8,9,10,11,12].flatMap(round=>[68,360,652].map(start=>({round,start}))))('actual half-health reinforcement leaves an observed no-kill escape r$round x$start',({round,start})=>{
 const w=new World(1337,round);w.phase='boss';w.player.x=w.player.px=start;Object.assign(w,{shoot(){}});const boss=w.spawn('boss',360,C.bossY);boss.bossVariant=(round-1)%3;boss.attackCycle=[0,2,3][boss.bossVariant];
 const births=new Map<number,number>(),known=new Set<number>();let path:number[]=[],planAt=0,unknownShots=0,admitted=0;
 for(let f=0;f<1500;f++){
  let matured=false;for(const b of w.bodies)if(b.active){if(!births.has(b.id))births.set(b.id,f);if(!known.has(b.id)&&f-births.get(b.id)!>=27){known.add(b.id);matured=true;}}
  for(const b of w.bullets)if(b.hostile&&b.sourceId&&!known.has(b.sourceId))unknownShots++;
  if(f===360){const damage=boss.maxHp*.6/(w.bossShieldActive()?.55:1);w.bullets.push({id:90000,x:boss.x,y:boss.y,px:boss.x,py:boss.y,vx:0,vy:0,damage,age:0,active:true,hostile:false});}
  if(f===0||matured||f-planAt>=60||f===361){const bodies=w.bodies.filter(b=>known.has(b.id)),options={phase:w.phase,phaseTime:w.phaseTime,reaction:f===0?.45:0};const route=safeRoute(w.player.x,bodies,w.bullets,8,options)??safeRoute(w.player.x,bodies,w.bullets,8,{...options,gridPoints:49});expect(route,`r${round} x${start} t${w.time}`).not.toBeNull();path=route??[];planAt=f;}
  w.step(C.step,f<27?w.player.x:path[Math.floor((f-planAt)/6)]??w.player.x);w.drainEffects();admitted=Math.max(admitted,boss.bossReserveSpawns??0);expect(w.player.hp,`t${w.time}`).toBe(3);
 }
 expect(admitted).toBe(2);expect(w.kills).toBe(0);expect(w.damageTaken).toBe(0);expect(unknownShots).toBe(0);mkdirSync('build/qa/Stage-252/routes',{recursive:true});writeFileSync(`build/qa/Stage-252/routes/${round}-${start}.json`,JSON.stringify({round,start,time:w.time,hp:w.player.hp,admitted,kills:w.kills,unknownShots,method:'Controlled actual half-health contact; no-fire route, 450ms per-body observation delay. Not normal progression or human difficulty.'}));
},120000);
