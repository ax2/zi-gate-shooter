import{World}from'../src/core/world';import{C}from'../src/core/config';import{safeRoute,dangerTimeline}from'../src/core/reachability';import{writeFileSync}from'node:fs';
function replay(delayed:boolean,noFire=false,strict=false){const w=new World(1337,2,undefined,1);if(noFire)(w as any).shoot=()=>{};w.player.x=w.player.px=68;let path:number[]=[],planned=0,seen=0,pending=-1;const observations=[],birth=new Map<number,number>(),known=new Set<number>();let unknownShots=0;
 for(let f=0;f<75*60&&w.phase==='running';f++){
  let matured=false;if(strict){for(const b of w.bodies)if(b.active){if(!birth.has(b.id))birth.set(b.id,f);if(!known.has(b.id)&&f-birth.get(b.id)!>=27){known.add(b.id);matured=true;}}for(const b of w.bullets)if(b.hostile&&b.sourceId&&!known.has(b.sourceId))unknownShots++;}
  if(delayed&&seen!==w.dropSpawns&&pending<0)pending=f+27;
  const replan=strict?(f===0||matured||f-planned>=60):delayed?(f===0||pending>=0&&f>=pending||pending<0&&f-planned>=60):(f===0||f-planned>=60||seen!==w.dropSpawns);
  if(replan){const reaction=f===0||!delayed&&seen!==w.dropSpawns?.45:0;const p=safeRoute(w.player.x,strict?w.bodies.filter(b=>known.has(b.id)):w.bodies,w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction});observations.push({time:w.time,reaction,pending,ok:!!p,x:w.player.x});
   if(!p)return{delayed,noFire,strict,unknownShots,time:w.time,hp:w.player.hp,observations,reactions:[0,.1,.2,.3,.45,.55].map(reaction=>({reaction,path:safeRoute(w.player.x,w.bodies,w.bullets,8,{reaction})})),timeline:dangerTimeline(w.bodies,w.bullets,8),bodies:w.bodies,bullets:w.bullets};path=p;planned=f;pending=-1;
  }
  seen=w.dropSpawns;w.step(C.step,path[Math.floor((f-planned)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);
 }
 return{delayed,noFire,strict,unknownShots,time:w.time,hp:w.player.hp,phase:w.phase,kills:w.kills,observations};
}
const runs=[replay(false),replay(true),replay(true,true),replay(true,true,true)];writeFileSync('build/qa/Stage-218/diagnosis.json',JSON.stringify(runs,null,2));console.log(JSON.stringify(runs.map(r=>({delayed:r.delayed,noFire:r.noFire,strict:r.strict,unknownShots:r.unknownShots,time:r.time,hp:r.hp,phase:r.phase,kills:r.kills,reactions:r.reactions?.map(p=>({reaction:p.reaction,found:!!p.path}))})),null,2));
