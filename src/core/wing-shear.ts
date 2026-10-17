import{C}from'./config';
import type{Body}from'./world';
/** Four fixed crossing pairs. Only shot direction changes; no player tracking. */
export const WING_SHEAR={beats:4,spacing:.15,vy:300,targets:[300,340,380,420],muzzleX:120,muzzleY:90}as const;
export function wingShearVolley(b:Pick<Body,'x'|'y'|'attackCycle'>,beat:number){
 const reverse=Math.floor(b.attackCycle/2)%2===1;
 const target=WING_SHEAR.targets[reverse?3-beat:beat];
 return [-1,1].map(side=>{const x=b.x+side*WING_SHEAR.muzzleX,y=b.y+WING_SHEAR.muzzleY,aim=side<0?target:C.width-target;
  return{x,y,vx:(aim-x)*WING_SHEAR.vy/(C.playerY-y),vy:WING_SHEAR.vy};});
}
