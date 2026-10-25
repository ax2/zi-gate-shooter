import{FlightHangar,hangarById,hangarWeapons,type WeaponKind}from'./hangar';
import{techById}from'./technology';
import{evolutionDetail,evolutionLabel}from'./evolutions';
/** Read-only view of the permanent recipe; warehouse ownership never implies activation. */
export function hangarCombo(g:FlightHangar,side:string){
 const weapon=hangarById.get(side);if(!weapon?.combo)return;
 const main=hangarById.get(weapon.combo.weapon)!,tech=techById.get(weapon.combo.tech)!;
 const parents=[{id:main.id,icon:main.icon,name:main.name,level:g.level(main.id),required:2,kind:'main' as const},{id:side,icon:weapon.icon,name:weapon.name,level:g.level(side),required:3,kind:'side' as const}];
 const ready=parents.every(p=>p.level>=p.required),active=ready&&parents.every(p=>g.active(p.id)),missing=parents.find(p=>p.level<p.required);
 return{id:side,main:main.id,tech:tech.id,name:tech.name,icon:tech.icon,parents,ready,active,missing,status:active?'组合已激活':ready?'可装配':`缺${missing!.name} Lv${missing!.required}`,detail:evolutionDetail(tech.id),attack:evolutionLabel(tech.id)};
}
export const hangarComboIds=hangarWeapons.filter(w=>w.combo).map(w=>w.id);
export function comboSlots(g:FlightHangar,side:string){const view=hangarCombo(g,side);if(!view)return;
 const choose=(kind:WeaponKind,id:string)=>{const equipped=g.equipped(kind),current=equipped.indexOf(id);return current>=0?current:equipped.length<g.capacity(kind)?equipped.length:0;};
 return{main:choose('main',view.main),side:choose('side',side)};
}
