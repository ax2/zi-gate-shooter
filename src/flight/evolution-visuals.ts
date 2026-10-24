import{electrodePorts}from'./early-parts';
import type{FlightWorld}from'./world';
import type{FlightProfile}from'./profile';
import type{ModulePose,ModuleFragment}from'./module-visuals';
export const evolutionFrames:Record<string,number>={starhive:0,thundernet:1,plasmacore:2,aurorawing:3,huntprism:4,bladewave:5};
export interface EvolutionPose extends ModulePose{column:number;port:number}
/** Physical mounts, not predicted attacks. A single generator may feed multiple
 * chain jumps or blades; multiple independent beam ports stay independently lit. */
export function evolutionPoses(w:FlightWorld,p:FlightProfile,schematic=false):EvolutionPose[]{
 if(!schematic&&(w.phase==='dead'||w.player.hp<=0))return[];const result:EvolutionPose[]=[],at=w.player;
 for(const[column,id]of p.evolutions.entries()){
  if(!id)continue;const bullets=w.bullets.filter(b=>!b.hostile&&b.damageSource===id&&b.age>=0&&b.age<.18),fields=w.effects.filter(e=>!e.hostile&&e.source===id&&e.points&&e.age>=0&&e.age<.18);
  const add=(port:number,x:number,y:number,width:number,height:number,fragment:ModuleFragment='whole',angle=0)=>{
   const shots=bullets.filter(b=>port<0||b.port===port),beams=fields.filter(e=>port<0||e.port===port),age=Math.min(1,...shots.map(b=>b.age),...beams.map(e=>e.age)),activity=schematic?0:Math.max(0,1-age/.18),beam=beams[0];
   if(beam&&(id==='aurorawing'||id==='huntprism')){const[a,b]=beam.points!;angle=Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2;}
   result.push({id,column,port,x,y,w:width,h:height,angle,fragment,frame:evolutionFrames[id],activity,rank:1});
  };
  if(id==='starhive')for(const[i,side]of[-1,1].entries())add(i,at.x+side*76,at.y-36,78,78,'whole',side*.18);
  else if(id==='thundernet')add(-1,at.x,at.y-52,80,94);
  else if(id==='plasmacore')add(0,at.x,at.y-36,60,86,'orb-left');
  else if(id==='aurorawing')for(const[i,point]of electrodePorts(at,w.time).entries())add(i,point.x,point.y,88,88,'whole',Math.atan2(point.y-at.y,point.x-at.x)+Math.PI/2);
  else if(id==='huntprism')for(const[i,side]of[-1,0,1].entries())add(i,at.x+side*65,at.y-45,76,76);
  else if(id==='bladewave')add(-1,at.x,at.y+29,88,88,'whole',w.time*2.4);
 }
 return result;
}
