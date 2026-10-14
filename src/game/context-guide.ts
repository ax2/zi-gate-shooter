import { C } from '../core/config';
import type { World } from '../core/world';

type Context = Pick<World, 'round' | 'phase' | 'bodies' | 'pickups' | 'gatesTaken'>;
export interface Guide { kind: 'move' | 'crate' | 'pickup' | 'gate' | 'pair'; title: string; detail: string }
const movement: Guide = { kind: 'move', title: '左右拖动 · 自动开火', detail: '' };

/** Read-only, in-world guidance: no timed grants, progression or persisted tutorial state. */
export function contextGuide(world: Context): Guide {
  if (world.phase !== 'running') return movement;
  const visible = world.bodies.filter(b => b.active && b.y >= 160 && b.y <= C.playerY + (b.kind === 'pickup' ? 52 : 0));
  if (visible.some(b => b.weaponKind && b.kind === 'pickup'))
    return { kind: 'pickup', title: '靠近领取所选武器', detail: '同排只领一种 · 换装不会降阶' };
  if (visible.some(b => b.weaponKind && b.kind === 'crate'))
    return { kind: 'crate', title: '选择武器：对准其中一箱', detail: '打碎再领取 · 同排只选一种' };
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
