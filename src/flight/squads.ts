import type{Part}from'./technology';
export type SquadKind='claw'|'column'|'wheel';
export interface SquadMember{group:number;kind:SquadKind;index:number;side:number;variant:number;attacks:number}
export interface SquadEncounter{id:number;sector:number;kind:SquadKind;started:number;nodes:number[];killed:number[];outcome:'active'|'won'|'escaped';ended?:number;claimed:boolean;rewarded:boolean;pending?:{x:number;y:number}}
export interface SquadRecord{id:number;sector:number;kind:SquadKind;outcome:'won'|'escaped';killed:number;claimed:boolean;ended:number}
export const squadRules={from:10,to:26,count:4,duration:18,reward:3,rewardIds:12,warmup:.6,life:3.8,hold:6,exitSpeed:220}as const;
export const squadTypes:Record<SquadKind,{name:string;brief:string;part:Part;icon:number;hp:number;interval:number}>={
 claw:{name:'翼钳夹击',brief:'两翼切入 · 绕侧逐机击破',part:'alloy',icon:5,hp:60,interval:2.4},
 column:{name:'蛇行纵队',brief:'沿纵列贯穿 · 绿壳弹可击碎',part:'coil',icon:6,hp:90,interval:2.2},
 wheel:{name:'回旋火环',brief:'绕圈散射 · 抢拆侧翼减压',part:'lens',icon:10,hp:105,interval:2.5},
};
export function squadPlan(sector:number){return{kind:(['claw','column','wheel']as const)[sector%3],variant:Math.floor(sector/3)%3};}
/** Shared pose and shot geometry, no player-dependent HP or hidden future paths. */
export function squadPose(m:SquadMember,age:number){
 const i=m.index,side=m.side*(m.variant===1?-1:1);
 if(m.kind==='column'){const t=age-i*.42;return{x:360+side*Math.sin(t*.8)*155,y:-80+age*150-i*95};}
 if(m.kind==='claw'){
  const ax=(side>0?[95,245,475,625]:[625,475,245,95])[i],ay=i===1||i===2?330:250,entryY=-80-i*65,entry=(ay-entryY)/190,t=Math.max(0,age-entry),exit=Math.max(0,t-squadRules.hold)*squadRules.exitSpeed;
  return{x:Math.max(60,Math.min(660,ax+(ax<360?1:-1)*Math.sin(t*(.65+m.variant*.06))*75)),y:age<entry?entryY+age*190:ay+t*30+exit};
 }
 const entry=3.4,t=Math.max(0,age-entry),a=i*Math.PI/2+side*t*(.65+m.variant*.07),x=360+Math.cos(a)*210,y=350+Math.sin(a)*110+Math.max(0,t-squadRules.hold)*squadRules.exitSpeed,startY=-80-i*70;
 return{x,y:age<entry?startY+(350+Math.sin(i*Math.PI/2)*110-startY)*age/entry:y};
}
export function squadAngles(m:SquadMember,age:number,aim:number){const side=m.side*(m.variant===1?-1:1);if(m.kind==='claw')return[aim-.11,aim+.11];if(m.kind==='column')return[Math.PI/2+side*.14];const outward=m.index*Math.PI/2+side*Math.max(0,age-3.4)*(.65+m.variant*.07);return[outward-.16,outward+.16];}
