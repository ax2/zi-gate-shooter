import{it,expect}from'vitest';import{writeFileSync}from'node:fs';import{World}from'../src/core/world';import{C}from'../src/core/config';import{safeRoute}from'../src/core/reachability';
for(const round of [4,7,10])for(const start of [68,360,652])it(`full no-kill R${round} route from ${start}`,()=>{
 const w=new World(1337,round);w.player.x=w.player.px=start;const seen=new Set<number>(),guns=new Set<number>();let path:number[]=[],planned=-999;
 for(let f=0;f<72*60&&w.player.hp>0;f++){
  const fresh=w.bodies.some(b=>b.active&&b.kind in C.enemies&&!seen.has(b.id));for(const b of w.bodies)if(b.active&&b.kind in C.enemies)seen.add(b.id);
  if(f-planned>=60||fresh){path=safeRoute(w.player.x,w.bodies,w.bullets,7,{phase:w.phase,phaseTime:w.phaseTime,reaction:f===0||fresh?.45:0})??[];expect(path.length,`R${round}/x${start}/t${w.time}`).toBeGreaterThan(0);planned=f;}
  w.step(C.step,path[Math.floor((f-planned)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);for(const b of w.bodies)if(b.pattern==='bankshot')guns.add(b.id);expect(w.player.hp,`t=${w.time}`).toBe(3);
 }
 const result={round,start,time:w.time,hp:w.player.hp,kills:w.kills,guns:guns.size,shots:w.bankShots,reflections:w.bankReflections,peakBodies:w.peakBodies,peakBullets:w.peakBullets};writeFileSync(`build/qa/Stage-207/route-${round}-${start}.json`,JSON.stringify(result,null,2));expect(w.kills).toBe(0);expect(guns.size).toBe(2);expect(w.bankReflections).toBeGreaterThanOrEqual(2);expect(w.peakBodies).toBeLessThanOrEqual(32);expect(w.peakBullets).toBeLessThanOrEqual(128);
},120000);
