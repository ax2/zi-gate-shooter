import {ROTATING_SHIELD} from '../core/relay-screen';
import {lockshotLeaving} from '../core/lockshot';
import { C } from '../core/config';
import type { World } from '../core/world';
import { guardClosed } from '../core/behavior';
import { weaponNames, weaponProfile, type WeaponKind } from '../core/weapons';

type Context = Pick<World, 'round' | 'phase' | 'bodies' | 'pickups' | 'gatesTaken' | 'activeWeapons'> & Partial<Pick<World,'refitTarget'>>;
export interface Guide { kind: 'move' | 'crate' | 'pickup' | 'gate' | 'pair' | 'boss' | 'enemy' | 'weapon'; title: string; detail: string }
const movement: Guide = { kind: 'move', title: '左右拖动 · 自动开火', detail: '' };

export function weaponGuide(kind: WeaponKind, stage: number, profile:Pick<ReturnType<typeof weaponProfile>,'targets'|'chainHops'>=weaponProfile(kind,stage)): Guide {
  const details: Record<WeaponKind, string> = {
    pulse: '对准目标持续输出 · 适合集中火力',
    scatter: '近距聚弹更强 · 留意碰撞与敌弹',
    pierce: `对准纵列 · 最多贯穿${profile.targets}个敌人`,
    blast: '直击敌群中心 · 爆炸波及附近敌人',
    arc: `前方索敌快弹 · 最多追加${(profile.chainHops??0)}次跳电`,
  };
  return { kind: 'weapon', title: `${weaponNames[kind]} · T${stage}`, detail: details[kind] };
}

/** Read-only, in-world guidance: no timed grants, progression or persisted tutorial state. */
export function contextGuide(world: Context): Guide {
  const blockade = world.phase === 'boss' && world.bodies.some(b => b.active && b.kind === 'boss' && b.attack === 3 && b.warning > 0);
  if (blockade) return { kind: 'boss', title: '首领封锁：观察实际弹幕', detail: '留意仍在飞行的子弹 · 随弹幕移动' };
  if (world.phase !== 'running') return movement;
  const visible = world.bodies.filter(b => b.active && b.y >= 160 && b.y <= C.playerY + (b.kind === 'pickup' ? 52 : 0));
  const ace=visible.find(b=>b.aceRole&&b.aceEnraged&&b.y<600);
  if(ace)return {kind:'enemy',title:(ace.aceRole==='fan'?'扇炮':'针炮')+'王牌暴走：先看实弹再转火',detail:ace.aceRole==='fan'?'五线扇射扩大封锁 · 横移寻找空隙':'五连快弹封锁纵列 · 先离开同列'};
  if(visible.some(b=>b.aceRole&&b.y<600))return {kind:'enemy',title:'双线王牌：先拆哪台，决定暴走招式',detail:'扇炮横向压制 · 针炮纵列连发 · 旧弹不消失'};
  if(visible.some(b=>b.aceRole))return {kind:'enemy',title:'王牌撤离：尽快完成追击',detail:'留意仍在飞行的子弹 · 30秒内击毁双机'};
  if(visible.some(b=>b.pattern==='rebound'&&b.warning>0))return {kind:'enemy',title:'折返冲锋：看清第二次转向',detail:'两段冲刺 · 可集火击毁，或留出横向空隙'};
  const interceptor=visible.find(b=>b.pattern==='intercept'&&(b.warning>0||(b.interceptCoreRemaining??0)>0));
  if(interceptor)return {kind:'enemy',title:interceptor.burst?'截击核心：及时离开中路':'截击翼炮：留意两侧实弹',detail:'可抢先击毁或击破中继 · 已发弹仍危险'};
  if(visible.some(b=>b.pattern==='fire-control'&&b.kind==='conduit'))return {kind:'enemy',title:'火控中继：断供或集火纵列',detail:'中继增幅扇射 · 击破停火1.5秒，旧弹仍危险'};
  if(visible.some(b=>b.pattern==='fire-control'&&b.kind==='armor'))return {kind:'enemy',title:'火控断供：趁停火突破',detail:'恢复后只发单线弹 · 留意仍在飞行的子弹'};
  const locked=visible.find(b=>b.pattern==='lockshot'&&!lockshotLeaving(b));
  if(locked)return {kind:'enemy',title:(locked.empRemaining??0)>0?'斜射停火：已发子弹仍危险':locked.forkshot?'三角哨机：锁位后分三点射击':'斜射哨机：入场锁位后不再追踪',detail:locked.forkshot?'可蓄能抢先拆炮 · 首弹通过后可回中路':world.round===1?'抢先拆炮，或避完三连再击毁同机':'可在蓄能时击破 · 横移避开原位置的实弹'};
  if(visible.some(b=>b.pattern==='relocate'))return {kind:'enemy',title:'机动哨机：入场抢位，齐射再换位',detail:'停稳再蓄能 · 重新对齐目标'};
  if (visible.some(b => b.kind === 'sniper' && b.warning > 0))
    return { kind: 'enemy', title: '狙击蓄能：保持横向移动', detail: '也可抢先击毁 · 命中不会打断蓄能' };
  const rotating=visible.find(b=>b.kind==='guard'&&b.shieldTurn!==undefined);if(rotating)return {kind:'enemy',title:'轮换重盾：追开盾窗口',detail:`闭盾减伤${Math.round((1-ROTATING_SHIELD.closedScale)*100)}% · 击破中继可同时开盾`};
  if (visible.some(b => b.kind === 'guard' && b.warning > 0))
    return { kind: 'enemy', title: '盾卫开盾：避开扇形弹道', detail: '弱点已暴露 · 趁开盾集中火力' };
  if(world.round===1&&visible.some(b=>b.introEscort)&&visible.some(b=>b.kind==='crate'&&b.weaponKind&&b.stage>=3))
    return {kind:'enemy',title:'先清护炮，再选补给',detail:'集中火力拆盾炮 · 打碎一箱后靠近拾取'};
  if(visible.some(b=>b.pattern==='convoy'))return world.round===1?{kind:'enemy',title:'门后护炮：先拆前盾，再压后炮',detail:'打门后换位领取 · 保留横移空间躲实弹'}:{kind:'enemy',title:'补给护卫：尽早决定外侧路线',detail:'可集火击毁或等弱点暴露 · 留意实际扇形弹幕'};
  if(visible.some(b=>b.introEscort&&b.kind==='elite'))return {kind:'enemy',title:'后排扇炮：先避弹再转火',detail:'已发子弹不会消失 · 侧移后继续集火'};
  const equipment = visible.filter(b => b.weaponKind && (b.kind === 'pickup' || b.kind === 'crate'));
  if(equipment.some(b=>b.refit))return {kind:equipment.some(b=>b.refit&&b.kind==='pickup')?'pickup':'crate',
    title:equipment.some(b=>!b.refit&&!world.activeWeapons.includes(b.weaponKind!))?'补给取舍：扩展火力或改装核心':'配件改装：选择强化已有配件',detail:world.refitTarget?'同排只领一件 · 打碎后拾取才升级':'同排只领一件 · 暂停→当前火力可定向'};
  if (equipment.length && equipment.every(b => world.activeWeapons.includes(b.weaponKind!)))
    return { kind: equipment.some(b => b.kind === 'pickup') ? 'pickup' : 'crate', title: '已有武器：领取升阶或充能', detail: '同阶装备充能+30 · 满100突破强化' };
  if (visible.some(b => b.weaponKind && b.kind === 'pickup'))
    return { kind: 'pickup', title: '靠近领取，叠加新火力', detail: '同排选一种奖励 · 已有武器继续开火' };
  if (visible.some(b => b.weaponKind && b.kind === 'crate'))
    return { kind: 'crate', title: '对准一箱，增加火力能力', detail: '打碎再领取 · 旧能力保留到本局结束' };
  if(visible.some(b=>b.kind==='conduit'))return {kind:'enemy',title:'导电中继：击破打断邻敌',detail:'停火1.5秒 · 已发敌弹仍危险'};
  if (visible.some(b => b.kind === 'guard' && guardClosed(b) && b.y < 650))
    return { kind: 'enemy', title: '盾卫闭盾：正面伤害减半', detail: '闭盾挡住穿甲与跳电 · 留意开盾时机' };
  if (world.round !== 1) return movement;
  if (world.pickups === 0) {
    if (visible.some(b => b.kind === 'pickup')) return { kind: 'pickup', title: '装备已掉落，移到它下方', detail: '靠近拾取后，才会强化火力' };
    if (visible.some(b => b.kind === 'crate')) return { kind: 'crate', title: '对准装备箱持续射击', detail: '打碎后再拾取 · 未碎箱体会撞伤' };
  }
  const gates = visible.filter(b => b.kind === 'gate');
  if (gates.some(g => gates.some(other => other.id !== g.id && other.row === g.row)) && world.gatesTaken < 2)
    return { kind: 'pair', title: '先射击，把门的奖励打高', detail: '穿过才领取 · 同排只领一扇 · 满充能可提速' };
  if (gates.length && world.gatesTaken === 0)
    return { kind: 'gate', title: '持续射击，把门的奖励打高', detail: '移到门内，穿过时才领取' };
  return movement;
}
