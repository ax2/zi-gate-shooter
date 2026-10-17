import type {WeaponKind} from '../core/weapons';
export interface ImpactMarker {
 x:number;y:number;kind:WeaponKind;life:number;total?:number;opticalBand?:number;prism?:boolean;
}
export function trimImpactBudget(markers:ImpactMarker[],weak:boolean){
 const cap=weak?4:12;
 while(markers.length>cap){const i=markers.findIndex(h=>!h.opticalBand);markers.splice(i<0?0:i,1);}
}
/** Keep optical priority and the original budget; one gun cannot suppress all other guns at the same point. */
export function admitWeaponImpact(markers:ImpactMarker[],x:number,y:number,kind:WeaponKind,weak:boolean){
 trimImpactBudget(markers,weak);
 if(markers.some(h=>!h.opticalBand&&h.kind===kind&&Math.hypot(h.x-x,h.y-y)<28))return false;
 const total=weak?.14:.18,next:ImpactMarker={x,y,kind,life:total,total},cap=weak?4:12;
 if(markers.length<cap){markers.push(next);return true;}
 let index=-1;
 for(let i=0;i<markers.length;i++){
  const h=markers[i];if(h.opticalBand)continue;
  const old=markers[index];
  if(index<0||(h.kind===kind&&old.kind!==kind)||((h.kind===kind)===(old.kind===kind)&&h.life/(h.total??.14)<old.life/(old.total??.14)))index=i;
 }
 if(index<0)return false;
 markers[index]=next;return true;
}
