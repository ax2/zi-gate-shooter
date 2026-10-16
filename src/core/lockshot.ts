import {C} from './config';
import type {Body} from './world';
export const LOCKSHOT={at:23,y:360,opening:.1,warning:1,spacing:.12,shots:3,speed:620,pivot:20,barrel:48,hold:10,exitSpeed:220} as const;
export const lockshotLeaving=(b:Pick<Body,'age'|'lockShots'>)=>(b.lockShots??0)>=LOCKSHOT.shots||b.age>=LOCKSHOT.hold;
/** The admitted target is immutable; neither later movement nor EMP retargets it. */
export function lockshotProfile(b:Pick<Body,'x'|'y'|'lane'|'lockX'>){
 const dx=(b.lockX??b.lane)-b.x,dy=C.playerY-(b.y+LOCKSHOT.pivot),length=Math.hypot(dx,dy)||1;
 const ux=dx/length,uy=dy/length;
 return {x:b.x+ux*LOCKSHOT.barrel,y:b.y+LOCKSHOT.pivot+uy*LOCKSHOT.barrel,ux,uy,vx:ux*LOCKSHOT.speed,vy:uy*LOCKSHOT.speed};
}
