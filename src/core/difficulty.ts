import type { EnemyKind } from './config';
/** Authored round curve, independent of the player's damage, choices or equipment. */
export function enemyHealthScale(kind:EnemyKind,round:number){
 const depth=Math.max(0,Math.floor(round)-1);
 if(kind==='drone'||kind==='conduit')return 1;
 // Preserve the first two circuits. Later fixed durability supports real attack windows
 // as independent weapon calibration, route refinement and power grow together.
 if(kind==='boss')return (1+.6*depth+.09*depth*depth)*(1+Math.max(0,depth-5));
 if(kind==='charger')return 1+.18*depth+.015*depth*depth;
 return 1+.4*depth+.06*depth*depth;
}
export function firstAttackDelay(kind:EnemyKind){
 return kind==='boss'?.45:kind==='elite'?1.2:kind==='armor'||kind==='guard'?1.5:2.4;
}
