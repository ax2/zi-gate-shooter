import{it,expect}from'vitest';import{World}from'../src/core/world';import{C}from'../src/core/config';import{safeRoute}from'../src/core/reachability';
it.each([6,9,12])('R%i retains full no-kill routes through both mirrored breaches and the later battery',round=>{
 for(const seed of[1,1337])for(const start of[68,360,652]){
  const w=new World(seed,round),seen=new Set<number>();w.player.x=w.player.px=start;let path:number[]=[],planned=0,drops=0;
  for(let frame=0;frame<100*60&&w.phase==='running';frame++){
   if(frame===0||frame-planned>=60||drops!==w.dropSpawns){const route=safeRoute(w.player.x,w.bodies,w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction:frame===0||drops!==w.dropSpawns?.45:0});expect(route,`${round}/${seed}/${start}/${w.time}`).not.toBeNull();path=route??[];planned=frame;drops=w.dropSpawns;}
   w.step(C.step,path[Math.floor((frame-planned)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);
   for(const b of w.bodies)if(b.controlGroup===-round)seen.add(b.id);
   expect(w.player.hp).toBe(3);expect(w.kills).toBe(0);expect(w.bodies.length).toBeLessThanOrEqual(32);expect(w.bullets.length).toBeLessThanOrEqual(48);
  }
  expect(w.phase).toBe('boss-entry');expect(seen.size).toBe(3);
 }
},60000);
