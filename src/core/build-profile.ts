import {type BuildTree,BALLISTIC_FORK,hasAmmo} from './build-tree';
import {weaponProfile,isBallisticWeapon,type WeaponKind} from './weapons';
import {supportProfile} from './support-profile';

/** Shared by combat and read-only upgrade comparisons. */
export function builtWeapon(kind:WeaponKind,stage:number,calibration:number,build:BuildTree){
  const p=weaponProfile(kind,stage),rank=build.ranks;
  const refinement=1+.1*build.refinements[kind==='arc'?'electric':'ballistic'];
  return {...p,targets:isBallisticWeapon(kind)&&hasAmmo(build,'penetrator')?Math.max(p.targets,BALLISTIC_FORK.targets):p.targets,
    splashRadius:isBallisticWeapon(kind)&&hasAmmo(build,'fragment')?Math.max(p.splashRadius??0,BALLISTIC_FORK.radius):p.splashRadius,
    damage:p.damage.map(n=>n*(1+.5*calibration)*refinement*(isBallisticWeapon(kind)&&rank.ballistic>=2?1.3:kind==='scatter'&&rank.ballistic>=1?1.1:1)),
    chainHops:kind==='arc'?(p.chainHops??0)+(rank.electric>=1?1:0)+(build.electricBranch==='spread'?1:0):kind==='scatter'&&rank.ballistic>=3?1+(build.stormAugment==='storm-relay'?1:0):p.chainHops};
}
export function builtSupport(mastery:number|undefined,build:BuildTree){
  const p=supportProfile(mastery),rank=build.ranks.optical;
  return {...p,laserUnlocked:p.laserUnlocked||rank>0,laserDamage:p.laserDamage*(rank>0?1.15:1)*(1+.1*build.refinements.optical),
    laserInterval:p.laserInterval*(rank>=2?.75:1),laserTargets:p.laserTargets+(rank>=3?2:0),prism:rank>=3&&build.ranks.ballistic>=1};
}
