import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {timeline} from '../src/core/director';import {safeRoute} from '../src/core/reachability';
it('preserves the first equipment windows and simple opening while authoring one compact branch-feedback group',()=>{
 for(const seed of [1,77,1337]){const list=timeline(1,seed),opening=list.filter(s=>s.at<8);
  expect(opening.map(s=>[s.at,s.kind,s.x,s.dropY])).toEqual([[1,'drone',360,320],[3.5,'drone',210,320],[5.5,'drone',510,320]]);
  const group=list.filter(s=>s.at===24.5);expect(group.map(s=>[s.kind,s.x,s.drop,s.dropY])).toEqual([240,300,360].map(x=>['drone',x,true,360]));expect(group.filter(s=>s.dropLabel)).toHaveLength(1);
  expect(list.filter(s=>['crate','armory','gates'].includes(s.kind)).map(s=>[s.at,s.kind,s.x,s.stage,s.pair])).toEqual([[8,'crate',240,2,undefined],[16,'armory',360,undefined,undefined],[20,'gates',360,undefined,undefined],[27,'gates',360,undefined,true],[48,'armory',360,3,undefined],[49.2,'gates',500,undefined,undefined],[58,'gates',360,undefined,true]]);
  expect(list.find(s=>s.kind==='armor'&&s.at===38)?.dropY).toBe(500);
 }
});
it('shows the first normal-health enemy protected before ordinary T1 shots can kill it, then gives one real kill',()=>{
 const w=new World();for(let i=0;i<75;i++){w.step(C.step,360);w.drainEffects();}const b=w.bodies.find(b=>b.kind==='drone')!;
 expect(b.dropGrace).toBeGreaterThan(0);expect(b.y).toBeGreaterThanOrEqual(320);expect(b.hp).toBe(C.enemies.drone.hp);expect(w.kills).toBe(0);expect(w.growth.energy).toBe(0);
 for(let i=0;i<60;i++){w.step(C.step,360);w.drainEffects();}expect(w.kills).toBe(1);expect(w.dropKills).toBe(1);expect(w.score).toBe(10);
});
it('retains no-kill first-run routes from three lanes and three seeds, reacting 450ms to every visible arrival',()=>{
 for(const seed of [1,77,1337])for(const start of [68,360,652]){const w=new World(seed);w.player.x=w.player.px=start;let path:number[]=[],planned=0,seen=0;
  for(let frame=0;frame<100*60&&w.phase==='running';frame++){
   if(frame===0||frame-planned>=60||seen!==w.dropSpawns){const reaction=frame===0||seen!==w.dropSpawns?.45:0;const route=safeRoute(w.player.x,w.bodies,w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction});expect(route,`seed${seed} x${start} t${w.time}`).not.toBeNull();path=route??[];planned=frame;seen=w.dropSpawns;}
   w.step(C.step,path[Math.floor((frame-planned)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp,`seed${seed} x${start} t${w.time}`).toBe(3);expect(w.kills).toBe(0);
  }
  expect(w.phase).toBe('boss-entry');expect(w.dropSpawns).toBe(39);expect(w.dropKills).toBe(0);
 }
},60000);
