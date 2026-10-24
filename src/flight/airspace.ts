import type {EnemyKind} from './world';
import{pursuitRules}from'./pursuit-rounds';

export type ManeuverKind='sweep'|'cross'|'orbit';
export interface Maneuver {
 kind:ManeuverKind;variant:number;side:number;phase:number;
 anchorX:number;anchorY:number;entryX:number;entryY:number;entryTime:number;
}
export const maneuverRules={entrySpeed:160,sweepWidth:145,crossWidth:440,crossTime:3.2,orbitWidth:175,orbitHeight:85,holdTime:8.5,exitSpeed:170}as const;
const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
export function airspacePlan(sector:number){
 const family=sector%3,variant=Math.floor(sector/3)%3;
 const names=[['炮列扫域','交叉截击','旋阵封锁'],['错列封锁','反翼猎袭','折镜哨阵'],['折返炮列','纵深截击','双环折镜']];
 return {kind:(['sweep','cross','orbit']as const)[family],variant,name:names[variant][family],brief:family===2&&variant>0?'镜弹撞墙一次 · 可用子弹击落':family===1&&variant>0?'截击机折返 · 追弹可击落':['炮口横扫 · 纵向换位找空隙','机群横穿 · 绕侧追击，留意近射','哨机环绕抛射 · 穿过实弹间隙'][family]};
}
function activePose(m:Maneuver,t:number){
 const r=maneuverRules,exit=Math.max(0,t-r.holdTime)*r.exitSpeed;
 if(m.kind==='sweep')return{x:clamp(m.anchorX+Math.sin(t*(.65+m.variant*.12)*m.side+m.phase)*r.sweepWidth,60,660),y:m.anchorY+Math.sin(t*.5+m.phase)*28+exit};
 if(m.kind==='cross'){const travel=Math.min(r.crossTime,t);if(m.variant>0&&t>r.crossTime){const back=Math.min(pursuitRules.returnTime,t-r.crossTime),u=back/pursuitRules.returnTime;return{x:m.anchorX+m.side*r.crossWidth*(1-u),y:m.anchorY+r.crossTime*62+u*pursuitRules.returnDrop[m.variant]+Math.max(0,t-r.crossTime-pursuitRules.returnTime)*230};}return{x:m.anchorX+m.side*r.crossWidth*travel/r.crossTime,y:m.anchorY+travel*62+Math.max(0,t-r.crossTime)*230};}
 const a=m.phase+t*(.8+m.variant*.1)*m.side;
 return{x:m.anchorX+Math.cos(a)*r.orbitWidth,y:m.anchorY+Math.sin(a)*r.orbitHeight+exit};
}
export function maneuverPose(m:Maneuver,age:number){
 const start=activePose(m,0);if(age<m.entryTime)return{x:m.entryX,y:m.entryY+(start.y-m.entryY)*Math.max(0,age)/m.entryTime};
 return activePose(m,age-m.entryTime);
}
export const maneuverBank=(x:number,previousX:number)=>clamp((x-previousX)*.08,-.24,.24);
export function maneuverMuzzle(e:{x:number;y:number;px:number;r:number}){const bank=maneuverBank(e.x,e.px);return{x:e.x-Math.sin(bank)*e.r*.6,y:e.y+Math.cos(bank)*e.r*.6};}
interface SpawnSpec{kind:EnemyKind;x:number;y:number;maneuver?:Maneuver}
export function airspaceFormation(sector:number,side:number):SpawnSpec[]{
 const plan=airspacePlan(sector),v=plan.variant,sign=side*(v===1?-1:1),rows:SpawnSpec[]=[];
 const moving=(kind:EnemyKind,anchorX:number,anchorY:number,dir:number,phase:number,index:number)=>{
  const m:Maneuver={kind:plan.kind,variant:v,side:dir,phase,anchorX,anchorY,entryX:0,entryY:-80-index*80,entryTime:0},start=activePose(m,0);
  m.entryX=start.x;m.entryTime=(start.y-m.entryY)/maneuverRules.entrySpeed;rows.push({kind,x:start.x,y:m.entryY,maneuver:m});
 };
 if(plan.kind==='sweep'){
  moving('sentry',v?210:360,265,sign,0,0);
  if(v)moving('sentry',510,350,-sign,Math.PI,1);else rows.push({kind:'drone',x:100,y:-180});
  rows.push({kind:'drone',x:620,y:-260});
 }else if(plan.kind==='cross'){
  const leftFirst=sign>0;moving('diver',leftFirst?140:580,v===2?260:210,leftFirst?1:-1,0,0);
  moving('diver',leftFirst?580:140,v===2?440:320,leftFirst?-1:1,0,1);rows.push({kind:'drone',x:360,y:-300});
 }else{
  for(let i=0;i<2;i++)moving('spinner',360,v===2?360:310,sign,i*Math.PI+(v===2?.5:0),i);
  rows.push({kind:'lancer',x:v===1?160:560,y:-340});
 }
 return rows;
}
