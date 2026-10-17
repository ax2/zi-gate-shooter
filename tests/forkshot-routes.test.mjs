import {it,expect} from 'vitest';import {existsSync,writeFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {World} from '../src/core/world';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';
if(!existsSync('build/qa/Stage-195/baseline-world.mjs'))execFileSync(process.execPath,['tools/capture-stage195-baseline.mjs']);const {World:OldWorld}=await import('../build/qa/Stage-195/baseline-world.mjs');
it('all authored rosters, equipment times and fixed enemy health stay unchanged apart from fork metadata',()=>{
 for(const plan of [0,1,2])for(let round=1;round<=18;round++){
  const a=new World(1337,round,undefined,plan),b=new OldWorld(1337,round,undefined,plan);const roster=w=>w.scheduled.map(({forkshot,dropLabel,dropDetail,...rest})=>rest);expect(roster(a)).toEqual(roster(b));for(const kind of Object.keys(C.enemies))expect(a.spawn(kind,360).maxHp).toBe(b.spawn(kind,360).maxHp);
 }
});
it('side chapters retain no-kill safe paths from three starting lanes across the three battle orders',()=>{
 const results=[];
 for(const round of [2,5,8])for(const plan of [0,1,2])for(const start of [68,360,652]){
  const w=new World(1337,round,undefined,plan);w.player.x=w.player.px=start;let path=[],planAt=0,seen=0;const sources=new Map();
  for(let f=0;f<75*60&&w.phase==='running';f++){
   if(f===0||f-planAt>=60||seen!==w.dropSpawns){const reaction=f===0||seen!==w.dropSpawns?.45:0;path=safeRoute(w.player.x,w.bodies,w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction});expect(path,`R${round} P${plan} x${start} t${w.time}`).not.toBeNull();planAt=f;seen=w.dropSpawns;}
   w.step(C.step,path?.[Math.floor((f-planAt)/6)]??w.player.x);w.drainEffects();for(const b of w.bodies)if(b.forkshot)sources.set(b.id,b);
   w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp,`R${round} P${plan} x${start} t${w.time}`).toBe(3);expect(w.kills).toBe(0);
  }
  results.push({round,plan,start,time:w.time,hp:w.player.hp,phase:w.phase,shots:[...sources.values()].map(b=>b.lockAcceptedShots??0),method:'controlled no-kill route forecast; friendly bullets removed after each step, not a normal playable run'});expect(w.phase).toBe('boss-entry');
 }
 writeFileSync('build/qa/Stage-195/no-kill-routes.json',JSON.stringify(results,null,2));
},180000);
