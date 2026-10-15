import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';
it('replays all chapter packs from three lanes without kills or immunity and with 450ms new-drop reaction',()=>{
 for(const round of [2,3,4])for(const start of [68,360,652]){const w=new World(1337,round);w.player.x=w.player.px=start;let path:number[]=[],planAt=0,seen=0;
 for(let frame=0;frame<100*60&&w.phase==='running';frame++){
  if(frame===0||frame-planAt>=60||seen!==w.dropSpawns){const reaction=frame===0||seen!==w.dropSpawns?.45:0;const route=safeRoute(w.player.x,w.bodies,w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction});expect(route,`R${round} x${start} t${w.time}`).not.toBeNull();path=route??[];planAt=frame;seen=w.dropSpawns;}
  w.step(C.step,path[Math.floor((frame-planAt)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp,`R${round} x${start} t${w.time}`).toBe(3);expect(w.kills).toBe(0);
 }
 expect(w.phase).toBe('boss-entry');expect(w.dropSpawns).toBe(round===2?34:round===3?25:44);expect(w.dropKills).toBe(0);
 }
},60000);
