import type { WeaponKind } from '../core/weapons';

export const dossierWeapons: WeaponKind[] = ['pulse', 'scatter', 'pierce', 'blast', 'arc'];
export const weaponDossier: Record<WeaponKind, { asset: string; role: string; strength: string; tradeoff: string }> = {
  pulse: { asset: 'units.png', role: '持续速射 · 集中火力', strength: '对准单个目标，连续命中快速清理。', tradeoff: '弹道集中，横排敌人需要移动瞄准。' },
  scatter: { asset: 'scatter-player-v1.png', role: '近距聚弹 · 扇面覆盖', strength: '二、三阶靠近目标时，多颗弹丸集中命中。', tradeoff: '远处弹丸分散；靠近时仍要避开碰撞。' },
  pierce: { asset: 'pierce-player-v2.png', role: '纵列贯穿 · 一线突破', strength: '对准纵列，三阶可连续贯穿三个敌人。', tradeoff: '闭盾盾卫、箱子和数字门会截住弹丸。' },
  blast: { asset: 'blast-player-v1.png', role: '重炮直击 · 密集爆破', strength: '命中敌人后爆炸，波及附近敌人。', tradeoff: '开火较慢；打箱子或门不会触发爆炸。' },
  arc: { asset: 'arc-player-v1.png', role: '邻敌接力 · 错位追击', strength: '三阶最多追加三次跳电，逐次衰减。', tradeoff: '敌人间距过远或闭盾盾卫会截断电链。' },
};
