import{technologies,techById,type Assembly}from'./technology';
const shared:Record<string,string[]>={guns:['split','barrage','arsenal'],coil:['chain','seeker'],laser:['twin','drill']};
const passive=new Set(Object.values(shared).flat());
/** Existing hull-damage ledger only. Shared attacks stay one row; passive
 * modifiers do not invent an independent contribution or a measured DPS. */
export function combatReport(a:Assembly,contribution:Readonly<Record<string,number>>,interceptions=0){
 const ids=new Set(['guns',...technologies.filter(t=>a.has(t.id)&&!passive.has(t.id)).map(t=>t.id),...Object.keys(contribution).filter(id=>Number.isFinite(contribution[id])&&contribution[id]>0)]);
 const values=[...ids].map(id=>{const t=techById.get(id),damage=Math.max(0,Number.isFinite(contribution[id])?contribution[id]:0);return{id,name:id==='guns'?'主炮＋翼炮':id==='mineblast'?'雷区连爆':t?.name??'其他命中',icon:t?.icon??0,column:t?.column??0,damage,modifiers:(shared[id]??[]).filter(key=>a.has(key)),interceptions:id==='electrodes'?Math.max(0,interceptions):0};});
 const total=values.reduce((n,r)=>n+r.damage,0),rows=values.map(r=>({...r,share:total?r.damage/total:0})).sort((a,b)=>b.damage-a.damage||b.interceptions-a.interceptions||a.id.localeCompare(b.id));
 return{total,rows};
}
export function combatSource(id:string){return Object.entries(shared).find(([,ids])=>ids.includes(id))?.[0]??id;}
