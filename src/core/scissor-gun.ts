import {C,clamp} from './config';
import type {Body} from './world';
export const SCISSOR={durability:2,opening:.1,warning:.9,spacing:.35,recovery:2.5,hold:4.5,speed:320,portX:42,pivot:22,barrel:40,offset:110,spread:38} as const;
/** Both banks keep the target captured on actual admission. No live tracking. */
export function scissorProfile(b:Pick<Body,'x'|'y'|'lockX'|'lane'>,bank:number,spread=0){
 const side=bank===0?-1:1,x=b.x+side*SCISSOR.portX,y=b.y+SCISSOR.pivot;
 const target=clamp((b.lockX??b.lane)-side*SCISSOR.offset+spread,C.minX,C.maxX),dx=target-x,dy=C.playerY-y,length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length;
 return{x:x+ux*SCISSOR.barrel,y:y+uy*SCISSOR.barrel,ux,uy,vx:ux*SCISSOR.speed,vy:uy*SCISSOR.speed,target};
}
