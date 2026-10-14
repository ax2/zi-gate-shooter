/** Run-local milestone rewards. Shared by combat and the parameter panel. */
export function supportProfile(mastery = 0) {
  return {
    laserUnlocked: mastery >= 3,
    laserInterval: mastery >= 8 ? 1.8 : 3,
    laserDamage: 30,
    laserTargets: 4,
    refractionTargets: mastery >= 12 ? 2 : mastery >= 5 ? 1 : 0,
    refractionRange: 180,
    refractionDamage: .6,
  };
}

export function supportMilestone(mastery: number) {
  return ({3:'激光解锁',5:'折射解锁',8:'急速激光进化',12:'双重折射进化'} as Record<number,string>)[mastery];
}
