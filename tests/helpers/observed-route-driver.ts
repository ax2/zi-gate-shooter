import{C}from'../../src/core/config';
import{safeRoute}from'../../src/core/reachability';
import{World}from'../../src/core/world';
import type{BattlePlan}from'../../src/core/battle-plan';

/** Isolated no-fire fixture, not normal earned progression. Each body remains
 * unknown for 27 frames after first appearance. Movement follows the existing
 * plan during perception; a new arrival never artificially stops the player. */
export function observedNoFireRoute(round:number,plan:BattlePlan,start:number,seed=1337,onFailure?:(w:World,known:ReadonlySet<number>)=>void){
 const w=new World(seed,round,undefined,plan);
 (w as any).shoot=()=>{};
 w.player.x=w.player.px=start;
 const births=new Map<number,number>(),known=new Set<number>(),unknownBullets=new Set<number>();
 let path:number[]=[],planned=0,minLag=Infinity,maxBodies=0,maxBullets=0,failureTime:number|null=null;
 for(let f=0;f<75*60&&w.phase==='running';f++){
  let matured=false;
  for(const b of w.bodies)if(b.active){
   if(!births.has(b.id))births.set(b.id,f);
   const age=f-births.get(b.id)!;
   if(!known.has(b.id)&&age>=27){known.add(b.id);matured=true;minLag=Math.min(minLag,age*C.step);}
  }
  // All normal chapter shots have a visible emitter/warning before launch.
  // Verify this rather than gaining early knowledge from an unseen source.
  for(const b of w.bullets)if(b.hostile&&(!b.sourceId||!known.has(b.sourceId)))unknownBullets.add(b.id);
  if(f===0||matured||f-planned>=60){
   const route=safeRoute(w.player.x,w.bodies.filter(b=>known.has(b.id)),w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction:f===0?.45:0});
   if(!route){failureTime=w.time;onFailure?.(w,known);break;}
   path=route;planned=f;
  }
  w.step(C.step,f<27?w.player.x:path[Math.floor((f-planned)/6)]??w.player.x);w.drainEffects();
  maxBodies=Math.max(maxBodies,w.bodies.length);maxBullets=Math.max(maxBullets,w.bullets.length);
 }
 return{round,plan,start,seed,time:w.time,phase:w.phase,hp:w.player.hp,damage:w.damageTaken,kills:w.kills,cratesBroken:w.cratesBroken,
  failureTime,minObservationSeconds:minLag,unknownEmitterBullets:unknownBullets.size,observedBodies:known.size,maxBodies,maxBullets,
  method:'Isolated no-fire fixture; per-body >=450ms delayed observation; continue existing movement, no immunity or kills'};
}
