import type {World} from '../core/world';
import type {WeaponKind} from '../core/weapons';
import {builtWeapon} from '../core/build-profile';
import {permanentPower} from '../core/rewards';
/** Evaluated from current equipment, including upgrades earned while the box travels. */
export function refitLabel(w:Pick<World,'weaponStage'|'weaponCalibration'|'profileFor'|'build'|'growth'>,kind:WeaponKind){
  const stage=w.weaponStage(kind),calibration=w.weaponCalibration(kind);
  if(stage<3)return `T${stage} → T${stage+1}`;
  const power=1+permanentPower(w.growth)/100;
  const number=(value:number)=>value>=1000?`${+(value/1000).toFixed(1)}k`:String(+value.toFixed(1));
  const before=w.profileFor(kind).damage.reduce((n,d)=>n+d,0)*power;
  const after=builtWeapon(kind,stage,calibration+1,w.build).damage.reduce((n,d)=>n+d,0)*power;
  return `单轮直伤 ${number(before)} → ${number(after)}`;
}
