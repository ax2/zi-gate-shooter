import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World,type Body} from '../src/core/world';
import {C} from '../src/core/config';
import {safeRoute} from '../src/core/reachability';

// Full rendered silhouettes, rather than the deliberately smaller hitboxes.
const overlap=(a:Body,b:Body)=>Math.max(0,Math.min(a.x+a.width*1.45/2,b.x+b.width*1.65/2)-Math.max(a.x-a.width*1.45/2,b.x-b.width*1.65/2))
 *Math.max(0,Math.min(a.y+a.height*1.38/2,b.y+b.width*1.65/2)-Math.max(a.y-a.height*1.38/2,b.y-b.width*1.65/2));

it('keeps the paired armour charge silhouettes clear of drones in an actual no-kill chapter',()=>{
 const records=[];
 for(const round of [2,4,5,7,8,10])for(const seed of [1,77,1337]){
  const w=new World(seed,round);w.player.x=w.player.px=68;
  let path:number[]=[],planAt=0,seen=0;const tracked=new Set<number>();
  let chargeFrames=0,occludedFrames=0,maxOverlap=0,minArmourGap=Infinity;
  const samples=[];
  for(let frame=0;frame<44*60&&w.phase==='running';frame++){
   if(frame===0||frame-planAt>=60||seen!==w.dropSpawns){
    const route=safeRoute(w.player.x,w.bodies,w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction:frame===0||seen!==w.dropSpawns?.45:0});
    expect(route,`R${round} t${w.time}`).not.toBeNull();path=route??[];planAt=frame;seen=w.dropSpawns;
   }
   w.step(C.step,path[Math.floor((frame-planAt)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);
   for(const b of w.bodies)if(b.active&&b.kind==='armor'&&b.deploying&&w.roundTime>=35&&w.roundTime<36)tracked.add(b.id);
   const armour=w.bodies.filter(b=>b.active&&tracked.has(b.id));
   if(armour.length===2)minArmourGap=Math.min(minArmourGap,Math.abs(armour[0].x-armour[1].x)-armour[0].width*1.45);
   for(const b of armour)if(b.warning>0){
    const drones=w.bodies.filter(d=>d.active&&d.kind==='drone');
    const largest=Math.max(0,...drones.map(d=>overlap(b,d)));
    chargeFrames++;if(largest>0)occludedFrames++;maxOverlap=Math.max(maxOverlap,largest);
    if(samples.length<6||frame%12===0)samples.push({time:w.time,x:b.x,y:b.y,largest,drones:drones.map(d=>({x:d.x,y:d.y}))});
   }
  }
  records.push({round,seed,tracked:[...tracked],hp:w.player.hp,kills:w.kills,chargeFrames,occludedFrames,maxOverlap,minArmourGap,samples});
 }
 mkdirSync('build/qa/Stage-160',{recursive:true});writeFileSync('build/qa/Stage-160/formation.json',JSON.stringify(records,null,2));
 for(const r of records){expect(r.tracked).toHaveLength(2);expect(r.hp).toBe(3);expect(r.kills).toBe(0);expect(r.chargeFrames).toBeGreaterThan(0);expect(r.occludedFrames,`R${r.round}`).toBe(0);expect(r.minArmourGap).toBeGreaterThanOrEqual(12);}
},60000);
