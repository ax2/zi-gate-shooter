import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {safeRoute} from '../src/core/reachability';
it('keeps late boss admissions escapable with 450ms reaction, no kills and no immunity from three starting lanes',()=>{
 for(const round of [4,5,6])for(const start of [68,360,652]){
  const w=new World(1337,round);w.phase='boss';w.player.x=start;
  const b=w.spawn('boss',360,260);b.bossVariant=(round-1)%3;b.attackCycle=[0,2,3][b.bossVariant];
  let path:number[]=[],planAt=0,seenSpawns=0;
  for(let frame=0;frame<1200;frame++){
   if(frame===0||frame-planAt>=60||seenSpawns!==w.escortSpawns){
    const reaction=frame===0||seenSpawns!==w.escortSpawns?.45:0;
    const route=safeRoute(w.player.x,w.bodies,w.bullets,6,{phase:w.phase,phaseTime:w.phaseTime,reaction});
    expect(route,`round ${round} start ${start} t ${w.time}`).not.toBeNull();path=route??[];planAt=frame;seenSpawns=w.escortSpawns;
   }
   w.step(C.step,path[Math.floor((frame-planAt)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);
   expect(w.player.hp,`round ${round} start ${start} frame ${frame}`).toBe(3);
  }
  expect(w.escortSpawns).toBe(2);expect(w.kills).toBe(0);expect(w.damageTaken).toBe(0);
 }
},60000);
it('a boss phase without a live boss never generates a formation',()=>{
 const w=new World(1337,4);w.phase='boss';for(let i=0;i<180;i++){w.step(C.step,68);w.drainEffects();}
 expect(w.escortSpawns).toBe(0);
});
