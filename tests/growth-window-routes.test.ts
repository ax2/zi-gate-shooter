import {it,expect} from 'vitest';import {writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';
it('first-chapter growth window preserves all three orders and all three starting lanes without kills',()=>{
 const results=[];
 for(const round of [1])for(const plan of [0,1,2] as const)for(const start of [68,360,652]){
  const w=new World(1337,round,undefined,plan);w.player.x=w.player.px=start;let path:number[]|null=[],planAt=0,seen=0;
  for(let f=0;f<75*60&&w.phase==='running';f++){
   if(f===0||f-planAt>=60||seen!==w.dropSpawns){const reaction=f===0||seen!==w.dropSpawns?.45:0;path=safeRoute(w.player.x,w.bodies,w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction});expect(path,`R${round} P${plan} x${start} t${w.time}`).not.toBeNull();planAt=f;seen=w.dropSpawns;}
   w.step(C.step,path?.[Math.floor((f-planAt)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp,`R${round} P${plan} x${start} t${w.time}`).toBe(3);expect(w.kills).toBe(0);
  }
  results.push({round,plan,start,time:w.time,hp:w.player.hp,phase:w.phase,method:'controlled no-kill with friendly shots removed after each step; not normal gameplay'});expect(w.phase).toBe('boss-entry');
 }
 writeFileSync('build/qa/Stage-217/no-kill-routes.json',JSON.stringify(results,null,2));
},180000);
