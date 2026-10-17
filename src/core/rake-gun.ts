import type{Body}from'./world';
export const RAKE={warning:.6,spacing:.25,stagger:.25,recovery:2.4,vy:310,swing:180,spread:40,pivot:20,barrel:38}as const;
type State=Pick<Body,'x'|'y'|'age'|'timer'|'warning'|'rakeVolley'|'rakeFiring'|'rakeFiredVolley'|'rakeFiredAt'>;
export function rakeVelocity(x:number,volley:number){return(1-Math.min(2,Math.max(0,volley)))*RAKE.swing*(x<360?1:-1);}
export function rakeMuzzle(b:Pick<Body,'x'|'y'|'rakeVolley'>){const vx=rakeVelocity(b.x,b.rakeVolley??0),length=Math.hypot(vx,RAKE.vy);return{x:b.x+vx/length*RAKE.barrel,y:b.y+RAKE.pivot+RAKE.vy/length*RAKE.barrel};}
/** Hardware follows the actual salvo sequence, never draws a future flight line. */
export function rakeBarrelAngle(b:State){
 const last=b.rakeFiredVolley??0,next=b.rakeVolley??0,from=Math.atan2(rakeVelocity(b.x,last),RAKE.vy),to=Math.atan2(rakeVelocity(b.x,next),RAKE.vy);
 if(b.age-(b.rakeFiredAt??-99)<.08)return from;
 const fraction=b.rakeFiring?1-b.timer/RAKE.spacing:b.warning>0?1-b.timer/RAKE.warning:0;
 return from+(to-from)*Math.min(1,Math.max(0,fraction));
}
