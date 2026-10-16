import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';
it('keeps the fixed-lock side-chapter shot window reachable from both mirrored sides without kills and with delayed reaction',()=>{
 for(const round of [2,5,8])for(const seed of [1337,9001])for(const start of [68,360,652]){const w=new World(seed,round);w.player.x=w.player.px=start;let path:number[]=[],planAt=0,pending=-1;const known=new Set<number>(),guns=new Set<number>();let actualShots=0;
 for(let frame=0;frame<30*60;frame++){
  const added=w.bodies.some(b=>b.active&&!known.has(b.id));for(const b of w.bodies)known.add(b.id);if(added&&pending<0)pending=frame+27;
  if(frame===0||pending>=0&&frame>=pending||pending<0&&frame-planAt>=60){const next=safeRoute(w.player.x,w.bodies,w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction:0});expect(next,`R${round}/${seed}/x${start}/t${w.time}`).not.toBeNull();path=next??[];planAt=frame;pending=-1;}
  w.step(C.step,path[Math.floor((frame-planAt)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp,`R${round}/${seed}/x${start}/t${w.time}`).toBe(3);expect(w.kills).toBe(0);
  for(const b of w.bodies)if(b.active&&b.pattern==='lockshot'){guns.add(b.id);actualShots=Math.max(actualShots,w.lockshotShots);}
 }
 expect(guns.size).toBe(1);expect(actualShots).toBe(3);
 }
},60000);
