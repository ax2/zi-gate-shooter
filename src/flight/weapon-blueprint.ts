import{componentRules,electrodePorts,bladeEnds}from'./early-parts';
import{evolutionRules}from'./evolutions';
import{hiveOffsets,needleOffsets,orbPorts,refitRank}from'./refits';
import{moduleFrames,type ModuleFragment}from'./module-visuals';
import{evolutionFrames}from'./evolution-visuals';

type Point={x:number;y:number};
export interface BlueprintMount extends Point{frame:number;w:number;h:number;angle:number;fragment:ModuleFragment;activity:number;evolved:boolean}
export interface BlueprintShot extends Point{frame:number;size:number;angle:number}
export interface BlueprintBeam{points:Point[];kind:'arc'|'laser';alpha:number}
export interface BlueprintBlast extends Point{frame:number;size:number}
export interface WeaponBlueprint{interval:number;rank:number;mounts:BlueprintMount[];shots:BlueprintShot[];beams:BlueprintBeam[];blasts:BlueprintBlast[];blades:(Point&{angle:number})[];targets:Point[]}
/** Illustrated loops only: the real attack's cadence, ports and art, with compact
 * travel distances. No World, hit simulation, payment, rewards or RNG. */
export function weaponBlueprint(id:string,seconds:number,rank=1):WeaponBlueprint|undefined{
 const evolved=Object.prototype.hasOwnProperty.call(evolutionFrames,id);if(!evolved&&!Object.prototype.hasOwnProperty.call(moduleFrames,id))return;const frame=(evolved?evolutionFrames:moduleFrames)[id];
 const time=Number.isFinite(seconds)?Math.max(0,seconds):0,r=refitRank((Number.isFinite(rank)?rank:1)-1);
 const interval=(evolved?evolutionRules[id as keyof typeof evolutionRules]:componentRules[id as keyof typeof componentRules]).interval,cycle=time%interval;
 const model:WeaponBlueprint={interval,rank:r,mounts:[],shots:[],beams:[],blasts:[],blades:[],targets:[{x:-68,y:-28},{x:0,y:-30},{x:68,y:-28}]};
 const activity=Math.max(0,1-cycle/.18),mount=(x:number,y:number,w:number,h=w,fragment:ModuleFragment='whole',angle=0)=>model.mounts.push({x,y,w,h,fragment,angle,activity,frame,evolved});
 const shot=(frame:number,x:number,y:number,size:number,angle=0)=>model.shots.push({frame,x,y,size,angle});
 const beam=(points:Point[],kind:'arc'|'laser',alpha=1)=>{if(alpha>0)model.beams.push({points,kind,alpha});};
 const blast=(at:Point,age:number,size=36)=>{if(age>=0&&age<.3)model.blasts.push({...at,size,frame:Math.min(8,Math.floor(age/.3*9))});};
 const curve=(a:Point,b:Point,u:number,bend:number)=>({x:(1-u)**2*a.x+2*(1-u)*u*bend+u*u*b.x,y:(1-u)**2*a.y+2*(1-u)*u*10+u*u*b.y});
 if(id==='hive'){
  for(const side of[-1,1]){mount(side*24,19,29,29,'whole',side*.16);for(const offset of hiveOffsets(side,r))if(cycle<.58){const a=-Math.PI/2+side*.16+offset*.18,d=cycle/.58*86;shot(1,side*24+Math.cos(a)*d,12+Math.sin(a)*d,20,a+Math.PI/2);}}
 }else if(id==='needles'){
  for(const dx of needleOffsets(r)){mount(dx/2.4,3,8,27,'rail');if(cycle<.42)shot(2,dx/2.4,2-cycle/.42*85,30);}
 }else if(id==='seekorb'){
  for(const[i,port]of orbPorts(r).entries()){const start={x:port.x/3,y:22},target=model.targets[i%3];mount(start.x,start.y,16,26,i%2?'orb-right':'orb-left',Math.asin(port.vx/componentRules.seekorb.speed));
   if(cycle<.88){const at=curve(start,target,cycle/.88,port.x/1.2);shot(3,at.x,at.y,29,Math.atan2(target.y-at.y,target.x-at.x)+Math.PI/2);}else if(cycle<1.04){beam([target,model.targets[(i+1)%3]],'arc',1-(cycle-.88)/.16);blast(target,cycle-.88,27);}
  }
 }else if(id==='electrodes'||id==='aurorawing'){
  for(const[i,port]of electrodePorts({x:0,y:0},time,evolved?1:r).entries()){const at={x:port.x*.45,y:20+port.y*.45},target=model.targets[(i+Math.floor(time/interval))%3];mount(at.x,at.y,evolved?35:27,evolved?35:27,'whole',Math.atan2(target.y-at.y,target.x-at.x)+Math.PI/2);
   if(cycle<.24){beam([at,target],evolved?'laser':'arc',1-cycle/.24);blast(target,cycle,25);}
  }
 }else if(id==='tracker'||id==='huntprism'){
  const offsets=evolved?[-24,0,24]:[0,...(r>1?[-11]:[]),...(r>2?[11]:[])];
  for(const[i,dx]of offsets.entries()){const target=model.targets[(i+Math.floor(time/interval))%3],at={x:dx,y:4};mount(dx,4,evolved?29:25,29,'whole',Math.atan2(target.y-at.y,target.x-at.x)+Math.PI/2);if(cycle<.22){beam([at,target],'laser',1-cycle/.22);blast(target,cycle,25);}}
 }else if(id==='blades'){
  mount(0,32,26,26,'whole',time*2.4);for(const end of bladeEnds({x:0,y:0},time,r))model.blades.push({x:end.x*.28,y:20+end.y*.15,angle:Math.atan2(end.y,end.x)+Math.PI/2});
 }else if(id==='starhive'||id==='plasmacore'){
  for(const side of(id==='starhive'?[-1,1]:[0])){const at={x:side*28,y:10},target=model.targets[side<0?0:side>0?2:1];mount(at.x,at.y,id==='starhive'?33:25,33,id==='plasmacore'?'orb-left':'whole',side*.18);
   if(cycle<.7){const p=curve(at,target,cycle/.7,side*64);shot(id==='starhive'?4:5,p.x,p.y,34,Math.atan2(target.y-p.y,target.x-p.x)+Math.PI/2);}blast(target,cycle-.7,id==='plasmacore'?58:43);
  }
 }else if(id==='thundernet'){
  mount(0,1,32,36);if(cycle<.3){beam([{x:0,y:-4},...model.targets],'arc',1-cycle/.3);for(const at of model.targets)blast(at,cycle,27);}
 }else if(id==='bladewave'){
  mount(0,32,32,32,'whole',time*2.4);
  if(cycle<1.1){const u=cycle<evolutionRules.bladewave.returnAt?cycle/evolutionRules.bladewave.returnAt:Math.max(0,1-(cycle-evolutionRules.bladewave.returnAt)/.55);for(const side of[-1,0,1])model.blades.push({x:side*68*u,y:22-62*u,angle:(cycle<.55?0:Math.PI)+side*.5});}
 }
 return model;
}
