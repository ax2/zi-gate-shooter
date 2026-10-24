import {electrodePorts}from'./early-parts';
import {needleOffsets,orbPorts}from'./refits';
import type{FlightProfile}from'./profile';
import type{FlightWorld}from'./world';
export const moduleFrames:Record<string,number>={hive:0,needles:1,seekorb:2,electrodes:3,tracker:4,blades:5};
export type ModuleFragment='whole'|'rail'|'orb-left'|'orb-right';
export interface ModulePose{id:string;frame:number;x:number;y:number;angle:number;w:number;h:number;fragment:ModuleFragment;activity:number;rank:number}
/** Pure presentation: only actual source-labelled shots/effects trigger a firing pose.
 * No timers, target selection, attacks, inventory or random numbers are advanced here. */
export function modulePoses(world:FlightWorld,profile:FlightProfile,schematic=false):ModulePose[]{
 const result:ModulePose[]=[],p=world.player;if(!schematic&&(world.phase==='dead'||p.hp<=0))return result;
 for(const[col,id]of profile.components.entries()){
  if(!id)continue;const rank=profile.componentRanks[col],shots=world.bullets.filter(b=>!b.hostile&&b.damageSource===id&&b.age>=0&&b.age<.18),effects=world.effects.filter(e=>!e.hostile&&e.source===id&&e.age>=0&&e.age<.18&&e.points);
  const add=(x:number,y:number,w:number,h:number,fragment:ModuleFragment='whole',angle=0,index=0)=>{
   const field=id==='electrodes'?effects.filter(e=>Math.hypot(e.points![0].x-x,e.points![0].y-y)<36):effects;
   const age=Math.min(1,...shots.map(b=>b.age),...field.map(e=>e.age)),activity=schematic?0:Math.max(0,1-age/.18);
   const beam=id==='tracker'?field[index%Math.max(1,field.length)]:undefined;
   if(beam){const[a,b]=beam.points!;angle=Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2;}
   result.push({id,frame:moduleFrames[id],x,y,angle,w,h,fragment,activity,rank});
  };
  if(id==='hive')for(const side of[-1,1])add(p.x+side*68,p.y-3,66+(rank-1)*4,66+(rank-1)*4,'whole',side*.16);
  else if(id==='needles')for(const dx of needleOffsets(rank))add(p.x+dx,p.y-43,20,68,'rail');
  else if(id==='seekorb')for(const[portIndex,port]of orbPorts(rank).entries())add(p.x+port.x,p.y+7,39,66,portIndex%2?'orb-right':'orb-left',Math.asin(port.vx/280));
  else if(id==='electrodes')for(const port of electrodePorts(p,world.time,rank))add(port.x,port.y,62,62,'whole',Math.atan2(port.y-p.y,port.x-p.x)+Math.PI/2);
  else if(id==='tracker')for(const[i,dx]of[0,...(rank>1?[-32]:[]),...(rank>2?[32]:[])].entries())add(p.x+dx,p.y-48,61,61,'whole',0,i);
  else if(id==='blades')add(p.x,p.y+29,62,62,'whole',world.time*2.4);
 }
 return result;
}
/** The narrow fragments show one physical rail/chamber per real attack port. */
export function moduleSource(frame:number,fragment:ModuleFragment){
 const x=frame%3*256,y=Math.floor(frame/3)*256;
 return fragment==='rail'?{x:x+94,y:y+16,w:68,h:224}:fragment==='orb-left'?{x:x+16,y:y+16,w:112,h:224}:fragment==='orb-right'?{x:x+128,y:y+16,w:112,h:224}:{x,y,w:256,h:256};
}
