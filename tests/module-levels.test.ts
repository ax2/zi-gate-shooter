import { expect,it } from 'vitest';
import { World } from '../src/core/world';
import { C } from '../src/core/config';
import type { WeaponKind } from '../src/core/weapons';
it('upgrades only the collected module and retains earlier firepower',()=>{
 const w=new World();
 const collect=(kind:WeaponKind,stage:number)=>{const b=w.spawn('pickup',360,C.playerY,stage);b.weaponKind=kind;b.speed=0;w.step(C.step);w.drainEffects();};
 collect('scatter',2);expect(w.weaponStage('pulse')).toBe(1);expect(w.weaponStage('scatter')).toBe(2);
 collect('arc',3);expect(w.weaponStage('scatter')).toBe(2);expect(w.weaponStage('arc')).toBe(3);
 collect('scatter',3);expect(w.weaponStage('pulse')).toBe(1);expect(w.weaponStage('scatter')).toBe(3);expect(w.weaponStage('arc')).toBe(3);
 collect('arc',2);expect(w.weaponStage('arc')).toBe(3);expect(w.growth.energy).toBe(30);
 expect(new World().activeWeapons).toEqual(['pulse']);
});
