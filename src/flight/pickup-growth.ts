/** Real collected parts strengthen the basic cannon without consuming the crafting wallet. */
export const pickupGrowthRules={doubleAt:3,tripleAt:9,damagePerDoubling:.05}as const;
export function mainGunState(value:number){const collected=Number.isFinite(value)?Math.max(0,Math.floor(value)):0,count=collected>=pickupGrowthRules.tripleAt?3:collected>=pickupGrowthRules.doubleAt?2:1,next=count===1?pickupGrowthRules.doubleAt:count===2?pickupGrowthRules.tripleAt:undefined;return{collected,count,rank:count,damageFactor:1+pickupGrowthRules.damagePerDoubling*Math.log2(1+collected),next,remaining:next===undefined?0:next-collected};}
export const mainGunPorts=(count:number)=>count>=3?[-20,0,20]:count===2?[-11,11]:[0];
