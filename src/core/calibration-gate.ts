import type{WeaponKind}from'./weapons';import{weaponNames}from'./weapons';import{refitFocus}from'./armory-offers';import{gateValue}from'./rewards';
export const CALIBRATION_GATE={fromRound:4,threshold:56,chargeCost:40}as const;
interface TargetState{round:number;growth:{bonus:number};activeWeapons:readonly WeaponKind[];weaponStage:(kind:WeaponKind)=>number;weaponKind:WeaponKind;refitTarget?:WeaponKind;build:{ranks:{ballistic:number;electric:number}}}
/** Future admission only. An existing gate keeps the exact module it advertised. */
export function calibrationGateTarget(w:TargetState){
 if(w.round<CALIBRATION_GATE.fromRound||w.growth.bonus<100)return;
 const eligible=w.activeWeapons.filter(k=>w.weaponStage(k)>=3);if(!eligible.length)return;
 return w.refitTarget&&eligible.includes(w.refitTarget)?w.refitTarget:refitFocus(eligible,w.weaponKind,w.build.ranks);
}
export function calibrationGateReward(b:{energy:number;calibrationTarget?:WeaponKind}){
 if(!b.calibrationTarget)return null;
 const ready=b.energy>=CALIBRATION_GATE.threshold,charge=gateValue(b.energy,'energy')-(ready?CALIBRATION_GATE.chargeCost:0);
 return{kind:b.calibrationTarget,ready,charge};
}
export function calibrationGateLabel(value:NonNullable<ReturnType<typeof calibrationGateReward>>){return[value.ready?`${weaponNames[value.kind]} 精校+1`:'',value.charge?`充能 +${value.charge}`:''].filter(Boolean).join(' · ');}
