import{C}from'../../src/core/config';import{safeRoute}from'../../src/core/reachability';import{World}from'../../src/core/world';import type{BattlePlan}from'../../src/core/battle-plan';
/** Diagnostic operator only. Unknown bodies remain unseen for450ms. Fine paths
 * are followed at their real60Hz cadence; they are never resampled to100ms. */
export function fineObservedRoute(Runtime:typeof World=World,round=2,plan:BattlePlan=0,start=360,seed=9001){
 const w=new Runtime(seed,round,undefined,plan);(w as any).shoot=()=>{};w.player.x=w.player.px=start;
 const births=new Map<number,number>(),known=new Set<number>(),unknown=new Set<number>();
 let path:number[]=[],planned=0,quantum=6,failureTime:number|null=null,minLag=Infinity;
 const refinements:Array<{time:number;x:number;path:number[]}>=[],positions:Array<{time:number;x:number;hp:number}>=[];
 for(let f=0;f<90*60&&w.phase==='running';f++){
  let matured=false;
  for(const b of w.bodies)if(b.active){if(!births.has(b.id))births.set(b.id,f);const age=f-births.get(b.id)!;if(!known.has(b.id)&&age>=27){known.add(b.id);matured=true;minLag=Math.min(minLag,age*C.step);}}
  for(const p of w.bullets)if(p.hostile&&(!p.sourceId||!known.has(p.sourceId)))unknown.add(p.id);
  if(f===0||matured||f-planned>=60){
   const bodies=w.bodies.filter(b=>known.has(b.id)),options={phase:w.phase,phaseTime:w.phaseTime,reaction:f===0?.45:0};
   let route=safeRoute(w.player.x,bodies,w.bullets,8,options);quantum=6;
   if(!route)route=safeRoute(w.player.x,bodies,w.bullets,8,{...options,gridPoints:49});
   if(!route){route=safeRoute(w.player.x,bodies,w.bullets,8,{...options,gridPoints:97,stepFrames:1});if(route){quantum=1;refinements.push({time:w.time,x:w.player.x,path:route});}}
   if(!route){failureTime=w.time;break;}path=route;planned=f;
  }
  w.step(C.step,f<27?w.player.x:path[Math.floor((f-planned)/quantum)]??w.player.x);w.drainEffects();
  if(w.time>=24&&w.time<=28)positions.push({time:w.time,x:w.player.x,hp:w.player.hp});
 }
 return{round,plan,start,seed,time:w.time,phase:w.phase,hp:w.player.hp,damage:w.damageTaken,kills:w.kills,cratesBroken:w.cratesBroken,failureTime,minObservationSeconds:minLag,unknownEmitterBullets:unknown.size,refinements,positions,method:'No-fire isolated diagnostic; body observation450ms; default100ms slabs first, exact1/60s fallback with unchanged12px margin, actual World contacts, no immunity'};
}
