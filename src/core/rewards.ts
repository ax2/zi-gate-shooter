import { C, clamp } from './config';
import {OVERLOAD} from './overload';
export interface Growth { stage: number; bonus: number; energy: number; overload: number; mastery?: number }
export const permanentPower = (g: Growth) => g.bonus + (g.mastery ?? 0) * 10;
export function gateValue(energy: number, kind: 'power' | 'energy' = 'power'): number {
  let rank = 0;
  for (let i = 0; i < C.thresholds.length; i++) if (energy >= C.thresholds[i]) rank = i;
  return C.rewards[rank] * (kind === 'energy' ? C.energyGateMultiplier : 1);
}
export function previewReward(g: Growth, nominal: number, kind: 'power' | 'energy') {
  const power = kind === 'power' ? Math.min(nominal, 100 - g.bonus) : 0;
  const energy = nominal - power;
  return { power, energy, wasted: nominal - power - energy };
}
export function gateRewardLabel(value: { power: number; energy: number }) {
  return [value.power ? `火力 +${value.power}%` : '', value.energy ? `充能 +${value.energy}` : ''].filter(Boolean).join(' · ') || '储能已满';
}
export function activateOverload(g: Growth) {
  if (g.energy >= 100) {
    const levels = Math.floor(g.energy / 100);
    g.mastery = (g.mastery ?? 0) + levels;
    g.energy %= 100; g.overload = OVERLOAD.duration; return true;
  }
  return false;
}
export function grantGate(g: Growth, nominal: number, kind: 'power' | 'energy') {
  const value = previewReward(g, nominal, kind);
  g.bonus = clamp(g.bonus + value.power, 0, 100);
  g.energy += value.energy;
  const activated = activateOverload(g);
  return { ...value, activated };
}
export function grantEquipment(g: Growth, stage: number) {
  if (stage > g.stage) { g.stage = stage; return { upgraded: true, activated: false }; }
  g.energy += 30;
  return { upgraded: false, activated: activateOverload(g) };
}
