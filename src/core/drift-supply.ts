/** Authored side-chapter supply motion; two choices keep their original spacing. */
export const DRIFT_SUPPLY={at:16,shift:70,turn1:.6,turn2:1.8,settle:3,opening:.45} as const;
export const hasDriftSupply=(round:number)=>round>1&&(round-1)%3===1;
const ease=(t:number)=>t*t*(3-2*t);
export function driftOffset(age:number){
 if(!Number.isFinite(age)||age<=0||age>=DRIFT_SUPPLY.settle)return 0;
 if(age<DRIFT_SUPPLY.turn1)return DRIFT_SUPPLY.shift*ease(age/DRIFT_SUPPLY.turn1);
 if(age<DRIFT_SUPPLY.turn2)return DRIFT_SUPPLY.shift*(1-2*ease((age-DRIFT_SUPPLY.turn1)/(DRIFT_SUPPLY.turn2-DRIFT_SUPPLY.turn1)));
 return DRIFT_SUPPLY.shift*(ease((age-DRIFT_SUPPLY.turn2)/(DRIFT_SUPPLY.settle-DRIFT_SUPPLY.turn2))-1);
}
export const driftVelocity=(age:number)=>(driftOffset(age+1/120)-driftOffset(age-1/120))*60;
