import { C } from './config';
export type WeaponKind = 'pulse' | 'scatter' | 'pierce';
export const weaponNames: Record<WeaponKind, string> = { pulse: '速射炮', scatter: '霰射炮', pierce: '穿甲炮' };
export const weaponColors: Record<WeaponKind, string> = { pulse: '#83e5ff', scatter: '#ffd28b', pierce: '#d5b4ff' };
export function weaponProfile(kind: WeaponKind, stage: number) {
  const tier = Math.max(0, Math.min(2, stage - 1));
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
