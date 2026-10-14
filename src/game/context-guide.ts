import { C } from '../core/config';
import type { World } from '../core/world';
import { guardClosed } from '../core/behavior';
import { weaponNames, weaponProfile, type WeaponKind } from '../core/weapons';

type Context = Pick<World, 'round' | 'phase' | 'bodies' | 'pickups' | 'gatesTaken' | 'activeWeapons'>;
export interface Guide { kind: 'move' | 'crate' | 'pickup' | 'gate' | 'pair' | 'boss' | 'enemy' | 'weapon'; title: string; detail: string }
const movement: Guide = { kind: 'move', title: '左右拖动 · 自动开火', detail: '' };

export function weaponGuide(kind: WeaponKind, stage: number): Guide {
  const details: Record<WeaponKind, string> = {
    pulse: '对准目标持续输出 · 适合集中火力',
    scatter: '近距聚弹更强 · 留意碰撞与敌弹',
    pierce: `对准纵列 · 最多贯穿${weaponProfile('pierce', stage).targets}个敌人`,
    blast: '直击敌群中心 · 爆炸波及附近敌人',
    arc: `追击相邻敌人 · 最多追加${weaponProfile('arc', stage).chainHops}次跳电`,
  };
  return { kind: 'weapon', title: `${weaponNames[kind]} · T${stage}`, detail: details[kind] };
}

/** Read-only, in-world guidance: no timed grants, progression or persisted tutorial state. */
export function contextGuide(world: Context): Guide {
  const blockade = world.phase === 'boss' && world.bodies.some(b => b.active && b.kind === 'boss' && b.attack === 3 && b.warning > 0);
  if (blockade) return { kind: 'boss', title: '先避开前波，再移向下一缺口', detail: '预警显示下一波 · 留意仍在飞行的子弹' };
  if (world.phase !== 'running') return movement;
  const visible = world.bodies.filter(b => b.active && b.y >= 160 && b.y <= C.playerY + (b.kind === 'pickup' ? 52 : 0));
  if (visible.some(b => b.kind === 'sniper' && b.warning > 0))
    return { kind: 'enemy', title: '狙击蓄能：离开预警通道', detail: '也可抢先击毁 · 命中不会打断蓄能' };
  if (visible.some(b => b.kind === 'guard' && b.warning > 0))
    return { kind: 'enemy', title: '盾卫开盾：避开扇形弹道', detail: '弱点已暴露 · 趁开盾集中火力' };
  const equipment = visible.filter(b => b.weaponKind && (b.kind === 'pickup' || b.kind === 'crate'));
  if (equipment.length && equipment.every(b => world.activeWeapons.includes(b.weaponKind!)))
    return { kind: equipment.some(b => b.kind === 'pickup') ? 'pickup' : 'crate', title: '已有武器：领取升阶或充能', detail: '同阶装备充能+30 · 满100突破强化' };
  if (visible.some(b => b.weaponKind && b.kind === 'pickup'))
    return { kind: 'pickup', title: '靠近领取，叠加新火力', detail: '同排选一种奖励 · 已有武器继续开火' };
  if (visible.some(b => b.weaponKind && b.kind === 'crate'))
    return { kind: 'crate', title: '对准一箱，增加火力能力', detail: '打碎再领取 · 旧能力保留到本局结束' };
  if (visible.some(b => b.kind === 'guard' && guardClosed(b) && b.y < 650))
    return { kind: 'enemy', title: '盾卫闭盾：正面伤害减半', detail: '闭盾挡住穿甲与跳电 · 留意开盾时机' };
  if (world.round !== 1) return movement;
  if (world.pickups === 0) {
    if (visible.some(b => b.kind === 'pickup')) return { kind: 'pickup', title: '装备已掉落，移到它下方', detail: '靠近拾取后，才会强化火力' };
    if (visible.some(b => b.kind === 'crate')) return { kind: 'crate', title: '对准装备箱持续射击', detail: '打碎后再拾取 · 未碎箱体会撞伤' };
  }
  const gates = visible.filter(b => b.kind === 'gate');
  if (gates.some(g => gates.some(other => other.id !== g.id && other.row === g.row)) && world.gatesTaken < 2)
    return { kind: 'pair', title: '先射击，把门的奖励打高', detail: '穿过才领取 · 同排只领一扇' };
  if (gates.length && world.gatesTaken === 0)
    return { kind: 'gate', title: '持续射击，把门的奖励打高', detail: '移到门内，穿过时才领取' };
  return movement;
}
