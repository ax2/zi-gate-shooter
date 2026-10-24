import{flightProfile}from'./profile';
import{technologies,parts,type Assembly}from'./technology';
import{upgradeChoices}from'./upgrades';
import type{PickupReceipt}from'./defense';

/** Collected growth and the spendable wallet are different, both read-only here.
 * The percent compares one main-cannon volley at the same family calibration.
 * It is not total DPS, nor a claim about damage actually dealt to enemies. */
export function salvageView(a:Assembly){
 const p=flightProfile(a);
 return{collected:p.main.collected,count:p.guns.count,damage:p.guns.damage,
  volley:p.guns.count*p.guns.damage,
  pickupVolleyPercent:Math.round((p.main.count*p.main.damageFactor-1)*100),
  next:p.main.next,remaining:p.main.remaining,rank:p.main.rank,nextKind:p.main.nextKind,progress:p.main.progress};
}

/** The same paid choices as the normal prompt. With an empty wallet show
 * reachable recipes, never locked branches or hypothetical paid ancestors. */
export function salvageChoices(a:Assembly,target?:string,receipt?:PickupReceipt){
 const ready=upgradeChoices(a,target,receipt);
 const next=target?a.nextStep(target):undefined;
 // Keep an explicitly tracked reachable recipe visible even while another
 // family can be paid for. The battle prompt filters out unpayable pictures.
 const pending=next&&!a.has(next)&&!a.lockedBy(next)&&!a.missing(next).length?next:undefined;
 if(ready.length)return pending&&!ready.includes(pending)?[pending,...ready].slice(0,3):ready;
 const column=receipt?parts.indexOf(receipt.part as typeof parts[number]):-1;
 return technologies.filter(t=>!a.has(t.id)&&!a.lockedBy(t.id)&&!a.missing(t.id).length)
  .sort((x,y)=>Number(y.id===next)-Number(x.id===next)||Number(y.column===column)-Number(x.column===column)||Number(!!y.component)-Number(!!x.component)||x.tier-y.tier)
  .slice(0,3).map(t=>t.id);
}
