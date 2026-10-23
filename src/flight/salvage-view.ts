import{flightProfile}from'./profile';
import{technologies,type Assembly}from'./technology';
import{upgradeChoices}from'./upgrades';

/** Collected growth and the spendable wallet are different, both read-only here.
 * The percent compares one main-cannon volley at the same family calibration.
 * It is not total DPS, nor a claim about damage actually dealt to enemies. */
export function salvageView(a:Assembly){
 const p=flightProfile(a);
 return{collected:p.main.collected,count:p.guns.count,damage:p.guns.damage,
  volley:p.guns.count*p.guns.damage,
  pickupVolleyPercent:Math.round((p.main.count*p.main.damageFactor-1)*100),
  next:p.main.next,remaining:p.main.remaining};
}

/** The same paid choices as the normal prompt. With an empty wallet show
 * reachable recipes, never locked branches or hypothetical paid ancestors. */
export function salvageChoices(a:Assembly,target?:string){
 const ready=upgradeChoices(a,target);
 if(ready.length)return ready;
 return technologies.filter(t=>!a.has(t.id)&&!a.lockedBy(t.id)&&!a.missing(t.id).length)
  .sort((x,y)=>Number(!!y.component)-Number(!!x.component)||x.tier-y.tier)
  .slice(0,3).map(t=>t.id);
}
