import type {World} from '../core/world';
import {permanentPower} from '../core/rewards';
import {weaponNames,type WeaponKind} from '../core/weapons';

export interface EquipmentState {
 stage:number;calibration:number;pellets:number;targets:number;radius:number;hops:number;rate:number;direct:number;
}
export interface EquipmentChange {kind:WeaponKind;before?:EquipmentState;after:EquipmentState}
export function captureEquipment(w:World){
 const power=1+permanentPower(w.growth)/100;
 return new Map(w.activeWeapons.map(kind=>{
  const p=w.profileFor(kind);
  return [kind,{stage:w.weaponStage(kind),calibration:w.weaponCalibration(kind),pellets:p.offsets.length,
   targets:p.targets,radius:p.splashRadius??0,hops:p.chainHops??0,rate:p.rate,direct:p.damage.reduce((sum,n)=>sum+n,0)*p.rate*power}] as const;
 }));
}
/** Compare actual ownership/tier/calibration, never infer equipment gains from global power. */
export function equipmentChanges(before:ReadonlyMap<WeaponKind,EquipmentState>,w:World):EquipmentChange[]{
 return [...captureEquipment(w)].flatMap(([kind,after])=>{
  const old=before.get(kind);
  return !old||old.stage!==after.stage||old.calibration!==after.calibration?[{kind,before:old,after}]:[];
 });
}
const number=(n:number)=>n>=1e8?`${+(n/1e8).toFixed(1)}亿`:n>=1e4?`${+(n/1e4).toFixed(1)}万`:String(+n.toFixed(1));
export function equipmentReceipt(change:EquipmentChange){
 const {kind,before:a,after:b}=change,name=weaponNames[kind];
 const mechanics=kind==='arc'?`跳电${a?number(a.hops)+'→':''}${b.hops}次`:kind==='blast'?`范围${a?number(a.radius)+'→':''}${b.radius}`
  :a&&a.pellets===b.pellets&&a.targets!==b.targets?`贯穿${a.targets}→${b.targets}敌`:`${a&&a.pellets!==b.pellets?a.pellets+'→':''}${b.pellets}发/轮`;
 const title=!a?`新增${name} T${b.stage} · ${mechanics}`:a.stage!==b.stage?`${name} T${a.stage}→T${b.stage} · ${mechanics}`:`${name} 精校${a.calibration}→${b.calibration}`;
 return {title,detail:`领取时常态全弹直伤/秒 ${number(a?.direct??0)} → ${number(b.direct)}`};
}
/** At most one unread record per weapon, five weapons total. No save data or gameplay state. */
export interface EquipmentTicket extends EquipmentChange {remaining:number}
export class EquipmentReceiptQueue {
 private items:EquipmentTicket[]=[];
 get pending():readonly EquipmentTicket[]{return this.items;}
 clear(){this.items=[];}
 push(change:EquipmentChange){
  const found=this.items.find(item=>item.kind===change.kind);
  if(found){found.after={...change.after};found.remaining=3.2;}
  else if(this.items.length<5)this.items.push({remaining:3.2,kind:change.kind,before:change.before?{...change.before}:undefined,after:{...change.after}});
 }
 interrupt(change:EquipmentChange,remaining=3.2){
  const next=this.items.find(item=>item.kind===change.kind);
  this.items=this.items.filter(item=>item.kind!==change.kind);
  this.items.unshift({remaining:next?3.2:remaining,kind:change.kind,before:change.before?{...change.before}:undefined,after:{...(next?.after??change.after)}});this.items=this.items.slice(0,5);
 }
 take(){return this.items.shift();}
}
