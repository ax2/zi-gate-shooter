import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {safeRoute} from '../src/core/reachability';
it('keeps a no-kill hunter encounter escapable from three lanes with reaction time for admitted targets',()=>{
 for(const start of [68,360,652]){
  const w=new World();w.player.x=start;const p=w.spawn('pickup',start,C.playerY,2);p.weaponKind='pulse';w.step(C.step,start);w.acceptContract('hunter');
  let path:number[]=[],planAt=0,seen=-1;
  for(let frame=0;frame<30*60;frame++){
   if(frame===0||frame-planAt>=60||seen!==w.contract!.reinforcements){
    const reaction=seen!==w.contract!.reinforcements?.45:0;
    const route=safeRoute(w.player.x,w.bodies,w.bullets,6,{phase:w.phase,phaseTime:w.phaseTime,reaction});
    expect(route,`start ${start} t ${w.time}`).not.toBeNull();path=route??[];planAt=frame;seen=w.contract!.reinforcements;
   }
   w.step(C.step,path[Math.floor((frame-planAt)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);
   expect(w.player.hp,`start ${start} t ${w.time}`).toBe(3);
  }
  expect(w.contract!.reinforcements).toBe(2);expect(w.kills).toBe(0);expect(w.contract!.status).toBe('failed');
 }
},60000);
