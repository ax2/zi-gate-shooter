import type { EnemyKind } from './config';
/** The original late-round curve takes over after the initial weapon ramp. */
export function bossEncounterScale(round:number){
 return [1,2,3,4,4,4,3,2,1.4][Math.max(0,Math.floor(round)-1)]??1;
}
/** Authored round curve, independent of the player's damage, choices or equipment. */
export function enemyHealthScale(kind:EnemyKind,round:number){
 const depth=Math.max(0,Math.floor(round)-1);
 if(kind==='drone'||kind==='conduit')return 1;
 // A fixed ramp lets upgraded builds encounter attacks before victory clears
 // the arena. The introductory solo boss and all normal enemy health stay put.
 if(kind==='boss')return (1+.6*depth+.09*depth*depth)*(1+Math.max(0,depth-5))*bossEncounterScale(round);
 if(kind==='charger')return 1+.18*depth+.015*depth*depth;
 return 1+.4*depth+.06*depth*depth;
}
export function firstAttackDelay(kind:EnemyKind){
 return kind==='boss'?.45:kind==='elite'?1.2:kind==='armor'||kind==='guard'?1.5:2.4;
}
