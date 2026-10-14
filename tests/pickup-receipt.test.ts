import { it, expect } from 'vitest';
import { World } from '../src/core/world';
import { C } from '../src/core/config';

it('new module acquisition does not also charge the arsenal or upgrade old modules',()=>{
  const w=new World();w.growth.stage=3;w.growth.energy=80;w.growth.mastery=2;
  const p=w.spawn('pickup',360,C.playerY,3);p.weaponKind='arc';p.speed=0;
  w.step(C.step);
  const events=w.drainEffects();const notices=events.filter(e=>e.text);
  expect(notices).toHaveLength(1);
  expect(notices[0].text).toContain('新增电弧炮');
  expect(notices[0].detail).toContain('电弧炮 T3');
  expect(w.growth.energy).toBe(80);
  expect(events.some(e=>e.type==='overload')).toBe(false);
  expect(w.activeWeapons).toEqual(['pulse','arc']);
});
it('repeated weapons explain charge and tier upgrades name the affected module',()=>{
  const w=new World();const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';p.speed=0;
  w.step(C.step);expect(w.drainEffects().find(e=>e.type==='upgrade')?.text).toContain('速射炮 · 升至T2');
  const repeat=w.spawn('pickup',360,C.playerY,2);repeat.weaponKind='pulse';repeat.speed=0;
  w.step(C.step);const receipt=w.drainEffects().find(e=>e.type==='pickup');
  expect(receipt?.text).toBe('重复装备 · 充能+30');
  expect(receipt?.detail).toContain('30/100');expect(w.activeWeapons).toEqual(['pulse']);
});
