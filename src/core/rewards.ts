import { C, clamp } from './config';
export interface Growth { stage: number; bonus: number; energy: number; overload: number }
export function gateValue(energy: number): number {
  let rank = 0;
  for (let i = 0; i < C.thresholds.length; i++) if (energy >= C.thresholds[i]) rank = i;
  return C.rewards[rank];
}
export function previewReward(g: Growth, nominal: number, kind: 'power' | 'energy') {
  const power = kind === 'power' ? Math.min(nominal, 100 - g.bonus) : 0;
  const energy = Math.min(nominal - power, 100 - g.energy);
  return { power, energy, wasted: nominal - power - energy };
}
export function activateOverload(g: Growth) {
  if (g.energy >= 100 && g.overload <= 0) { g.energy = 0; g.overload = 6; return true; }
  return false;
}
export function grantGate(g: Growth, nominal: number, kind: 'power' | 'energy') {
  const value = previewReward(g, nominal, kind);
  g.bonus = clamp(g.bonus + value.power, 0, 100);
  g.energy = clamp(g.energy + value.energy, 0, 100);
  const activated = activateOverload(g);
  return { ...value, activated };
}
export function grantEquipment(g: Growth, stage: number) {
  if (stage > g.stage) { g.stage = stage; return { upgraded: true, activated: false }; }
  g.energy = Math.min(100, g.energy + 30);
  return { upgraded: false, activated: activateOverload(g) };
}
