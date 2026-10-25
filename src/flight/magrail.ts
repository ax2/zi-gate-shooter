/** Candidate timings for the permanent main weapon, not the historical rail perk. */
export const magrailRules={charge:.23,hits:12,burstCount:3,burstMultiplier:2.5,burstCooldown:.8,maxTrail:80}as const;
export function magrailSpec(value:number){
 const level=Number.isFinite(value)?Math.max(0,Math.min(5,Math.floor(value))):0;
 const count=level>=4?3:level>=2?2:1;
 return{level,count,interval:[1.1,.85,.8,.75,.7,.65][level],pierce:level>=3?7:4,
  damageFactor:(count===3?.55:count===2?.65:1)*(level>=3?1.35:1),
  ports:count===3?[-12,0,12]:count===2?[-9,9]:[0]};
}
export function magrailMuzzle(main:readonly string[],x:number,y:number){const slot=main.indexOf('rail');return{x:x+(main.length>1&&slot>=0?(slot?23:-23):0),y:y-49};}
