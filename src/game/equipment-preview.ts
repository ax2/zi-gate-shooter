import type {World} from '../core/world';
import {builtWeapon} from '../core/build-profile';
import {permanentPower} from '../core/rewards';
import {recipeIds,recipeStatus} from '../core/recipe-goal';
import {weaponNames,weaponColors,type WeaponKind} from '../core/weapons';
import {weaponDossier} from './weapon-dossier';
const number=(n:number)=>n>=1e8?`${+(n/1e8).toFixed(1)}亿`:n>=1e4?`${+(n/1e4).toFixed(1)}万`:String(+n.toFixed(1));
/** Pure projection of one owned upgrade. The labelled ceiling excludes accuracy, overload and derived hits. */
export function equipmentPreview(w:World,kind:WeaponKind){
 if(!w.activeWeapons.includes(kind))return null;
 const stage=w.weaponStage(kind),calibration=w.weaponCalibration(kind),toTier=Math.min(3,stage+1),toCalibration=calibration+Number(stage>=3);
 const before=w.profileFor(kind),after=builtWeapon(kind,toTier,toCalibration,w.build),power=1+permanentPower(w.growth)/100;
 const direct=(p:typeof before)=>p.damage.reduce((sum,n)=>sum+n,0)*p.rate*power;
 const view={build:w.build,activeWeapons:w.activeWeapons,weaponStage:(k:WeaponKind)=>k===kind?toTier:w.weaponStage(k)};
 const combinations=recipeIds.filter(id=>!recipeStatus(w,id).ready&&recipeStatus(view,id).ready).map(id=>recipeStatus(view,id).name);
 const rate=before.rate===after.rate?`${number(after.rate)}轮/秒`:`${number(before.rate)}→${number(after.rate)}轮/秒`;
 const mechanics=before.offsets.length!==after.offsets.length?`每轮${before.offsets.length}→${after.offsets.length}发`:before.targets!==after.targets?`贯穿${before.targets}→${after.targets}敌`:before.splashRadius!==after.splashRadius?`爆炸范围${before.splashRadius}→${after.splashRadius}`:before.chainHops!==after.chainHops?`跳电${before.chainHops}→${after.chainHops}次`:weaponDossier[kind].role.split(' · ')[0];
 return {kind,toTier,toCalibration,before,after,directBefore:direct(before),directAfter:direct(after),combinations,
  title:stage<3?`${weaponNames[kind]} T${stage} → T${toTier}`:`${weaponNames[kind]} · 专属精校${toCalibration}`,
  detail:`全弹直伤/秒 ${number(direct(before))} → ${number(direct(after))}`,
  hint:combinations.length?`新组合：${combinations.join(' / ')}`:`${mechanics} · ${rate}`,color:weaponColors[kind]};
}
