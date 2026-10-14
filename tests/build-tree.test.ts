import { expect,it } from 'vitest';
import { World } from '../src/core/world';
it('requires earned breakthroughs and enforces the lightning combination prerequisite',()=>{
 const w=new World();expect(w.chooseBuild('ballistic')).toBe(false);
 w.growth.mastery=9;
 expect(w.chooseBuild('ballistic')).toBe(true);expect(w.activeWeapons).toContain('scatter');
 expect(w.weaponStage('pulse')).toBe(1);
 w.chooseBuild('ballistic');expect(w.chooseBuild('ballistic')).toBe(false);
 w.chooseBuild('electric');expect(w.chooseBuild('ballistic')).toBe(true);
 expect(w.profileFor('scatter').chainHops).toBe(1);
 expect(w.profileFor('arc').chainHops).toBe(2);
 expect(w.chooseBuild('ballistic')).toBe(false);
});
it('optical choices alter live support parameters without removing existing weapons',()=>{
 const w=new World();w.growth.mastery=1;
 w.chooseBuild('optical');expect(w.supportProfile().laserUnlocked).toBe(true);
 expect(w.supportProfile().laserDamage).toBeCloseTo(34.5);
 expect(w.chooseBuild('optical')).toBe(false);
 w.growth.mastery=3;w.chooseBuild('optical');w.chooseBuild('optical');
 expect(w.supportProfile().laserInterval).toBe(2.25);expect(w.supportProfile().laserTargets).toBe(6);
 expect(w.activeWeapons).toEqual(['pulse']);expect(new World().build.spent).toBe(0);
});
