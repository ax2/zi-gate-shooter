import type {WeaponKind} from '../core/weapons';
import {C,clamp} from '../core/config';
/** Default visual sockets. They do not change shot origin or collision radius. */
export const mountedRig:Record<WeaponKind,{frame:number;x:number;y:number;size:number}>={
 pulse:{frame:0,x:-70,y:-20,size:66},
 scatter:{frame:1,x:70,y:-20,size:72},
 pierce:{frame:2,x:-48,y:-85,size:76},
 blast:{frame:3,x:48,y:-85,size:72},
 arc:{frame:4,x:0,y:-92,size:92},
};
/** Retract the support arm near a wall; preserve the full-size original module. */
export function mountedCenter(playerX:number,offset:number,size:number){
 const inset=size/2+8;
 return clamp(playerX+offset,inset,C.width-inset);
}
/** Low side guns lift over the shoulder while retracting, rather than hiding behind the torso. */
export function mountedPose(playerX:number,mount:{x:number;y:number},size:number){
 const x=mountedCenter(playerX,mount.x,size),fold=Math.abs(playerX+mount.x-x);
 return {x,y:mount.y-(mount.y>-60?fold*3.5:0),fold};
}
