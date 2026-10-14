import { C } from './config';
export type WeaponKind = 'pulse' | 'scatter' | 'pierce' | 'blast';
export const weaponNames: Record<WeaponKind, string> = { pulse: '速射炮', scatter: '霰射炮', pierce: '穿甲炮', blast: '爆裂炮' };
export const weaponColors: Record<WeaponKind, string> = { pulse: '#83e5ff', scatter: '#ffd28b', pierce: '#d5b4ff', blast: '#ffb46d' };
export function weaponProfile(kind: WeaponKind, stage: number) {
  const tier = Math.max(0, Math.min(2, stage - 1));
  if (kind === 'blast') return {rate:[2,2.5,3][tier],offsets:[0],damage:[[16],[24],[32]][tier],vx:[0],targets:1,muzzleY:[92,94,100][tier],splashRadius:[90,110,130][tier]};
  if (kind === 'scatter') {
    const offsets = tier === 0 ? [-12, 0, 12] : tier === 1 ? [-24, -12, 0, 12, 24] : [-36, -24, -12, 0, 12, 24, 36];
    return { rate: tier === 2 ? 4 : 5, offsets, damage: offsets.map((_, i) => i === Math.floor(offsets.length / 2) ? 4 : Math.abs(i - Math.floor(offsets.length / 2)) === 1 ? 3 : 2),
      vx: offsets.map((_, i) => (i - Math.floor(offsets.length / 2)) * (tier === 2 ? 75 : 110)), targets: 1 };
  }
  if (kind === 'pierce') {
    const offsets = tier === 0 ? [0] : [-22, 22];
    return { rate: tier === 2 ? 4 : 5, offsets, muzzleY: [76, 82, 99][tier], damage: offsets.map(() => [6, 5, 8][tier]), vx: offsets.map(() => 0), targets: tier === 2 ? 3 : 2 };
  }
  const normal = C.weapon[tier];
  return { ...normal, vx: normal.offsets.map(() => 0), targets: 1 };
}
