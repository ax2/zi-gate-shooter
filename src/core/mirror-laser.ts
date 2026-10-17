import{C}from'./config';
export const MIRROR_LASER={damage:.65,targets:2,left:36,right:684,slope:1,radius:5,life:.28}as const;
export interface MirrorSegment{x:number;y:number;tx:number;ty:number}
/** Nearest wall, one reflection only. Stop at the opposite wall or playfield top. */
export function mirrorPath(x:number,y=C.playerY-100):MirrorSegment[]{
 const side=x<360?-1:1,wall=side<0?MIRROR_LASER.left:MIRROR_LASER.right;
 const bounceY=y-Math.abs(wall-x)/MIRROR_LASER.slope;
 if(bounceY<=C.playerShotTop)return[{x,y,tx:x+side*(y-C.playerShotTop)*MIRROR_LASER.slope,ty:C.playerShotTop}];
 const opposite=side<0?MIRROR_LASER.right:MIRROR_LASER.left;
 const dy=Math.min(bounceY-C.playerShotTop,Math.abs(opposite-wall)/MIRROR_LASER.slope);
 return[{x,y,tx:wall,ty:bounceY},{x:wall,y:bounceY,tx:wall-side*dy*MIRROR_LASER.slope,ty:bounceY-dy}];
}
