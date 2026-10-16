import type { WeaponKind } from './weapons';

/** Chapter flavor breaks ties; missing capabilities always precede duplicates. */
export function armoryOffers(owned: readonly WeaponKind[], preferred: readonly WeaponKind[]): WeaponKind[] {
  const order = [...new Set<WeaponKind>([...preferred, 'pulse', 'scatter', 'pierce', 'blast', 'arc'])];
  return [...order.filter(kind => !owned.includes(kind)), ...order.filter(kind => owned.includes(kind))].slice(0, 2);
}

export function refitFocus(owned:readonly WeaponKind[],current:WeaponKind,ranks:{ballistic:number;electric:number}){
  const linked=([['scatter',ranks.ballistic],['arc',ranks.electric]] as const)
    .filter(([kind,rank])=>rank>0&&owned.includes(kind)).sort((a,b)=>b[1]-a[1]||Number(b[0]===current)-Number(a[0]===current));
  return linked[0]?.[0]??(owned.includes(current)?current:owned[0]);
}
/** Later supply offers a real breadth/depth choice; early discovery is unchanged. */
export function armoryChoices(owned:readonly WeaponKind[],preferred:readonly WeaponKind[],focus?:WeaponKind){
  if(owned.length<2||!focus||!owned.includes(focus))return armoryOffers(owned,preferred).map(kind=>({kind,refit:false}));
  const missing=armoryOffers(owned,preferred).find(kind=>!owned.includes(kind));
  if(missing)return [{kind:missing,refit:false},{kind:focus,refit:true}];
  const other=[...preferred,...owned].find(kind=>owned.includes(kind)&&kind!==focus)!;
  return [{kind:focus,refit:true},{kind:other,refit:true}];
}
