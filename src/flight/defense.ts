import{technologies,partInfo,parts,type Assembly,type Part}from'./technology';
export const defenseRules={shotLife:5.5,orbLife:4.5,edge:32,fade:.5,armorDuration:6,armorRadius:43,armorEvery:6,receiptLife:3.5}as const;
export type Supply=Part|'repair'|'armor';
export interface PickupReceipt{part:Supply;amount:number;until:number;repaired:number;main?:{beforeCount:number;afterCount:number;beforeDamage:number;afterDamage:number}}
export const supplyName=(p:Supply)=>p==='armor'?'光甲':p==='repair'?'维修':partInfo[p].name;
/** The live wallet and prerequisites decide the link; collecting strengthens the basic cannon but never installs a technology. */
export function pickupOffer(a:Assembly,r:PickupReceipt){
 if(r.part==='repair'||r.part==='armor')return undefined;
 const col=parts.indexOf(r.part),eligible=technologies.filter(t=>t.column===col&&!a.has(t.id)&&!a.lockedBy(t.id)&&!a.missing(t.id).length);
 return eligible.find(t=>t.evolution&&a.can(t.id))??eligible.find(t=>a.can(t.id))??eligible[0];
}
export function pickupHint(a:Assembly,r:PickupReceipt){
 if(r.part==='armor')return'立即挡弹6秒 · 激光/撞击仍需躲';
 if(r.part==='repair')return r.repaired?'生命 +'+r.repaired:'生命已满';
 const t=pickupOffer(a,r);if(!t)return'材料已入仓 · 用于组件精校';
 if(a.can(t.id))return'可组装 · '+t.name+' ›';
 const missing=parts.map(p=>({p,n:Math.max(0,(a.cost(t.id)[p]??0)-a.inventory[p])})).filter(p=>p.n>0);
 return'还差 '+missing.map(p=>supplyName(p.p)+p.n).join(' / ');
}
