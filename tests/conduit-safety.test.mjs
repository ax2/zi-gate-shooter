import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';
it('keeps the previously failing relay/supply overlap escapable without kills in round two seed one',()=>{
 const w=new World(1,2);w.player.x=w.player.px=360;let path=[];
 for(let frame=0;frame<100*60&&w.phase==='running';frame++){
  if(frame%60===0){const route=safeRoute(w.player.x,w.bodies,w.bullets,8,{reaction:frame?0:.45});
   if(!route){mkdirSync('build/qa/Stage-146',{recursive:true});writeFileSync('build/qa/Stage-146/route-failure.json',JSON.stringify({time:w.time,x:w.player.x,bodies:w.bodies,bullets:w.bullets.filter(b=>b.hostile),horizons:[1,2,3,4,5,6,7,8].map(h=>({h,possible:!!safeRoute(w.player.x,w.bodies,w.bullets,h,{reaction:0})}))},null,2));}
   expect(route,`t${w.time}`).not.toBeNull();path=route??[];
  }
  w.step(C.step,path[Math.floor(frame%60/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp).toBe(3);expect(w.kills).toBe(0);
 }
 expect(w.phase).toBe('boss-entry');
},30000);
